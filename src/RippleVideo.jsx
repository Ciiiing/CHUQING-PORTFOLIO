import { useEffect, useRef } from 'react'
import { Geometry, Mesh, Program, Renderer, RenderTarget, Texture, Triangle } from 'ogl'

const MAX_WAVES = 72
const START_SCALE = 1.5
const LIFE_CONSTANT = Math.log(500)

const waveVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;
varying vec2 vUv;
varying float vOpacity;
void main() {
  vUv = uv;
  vOpacity = iOpacity;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}
`

const waveFragment = `
precision highp float;
varying vec2 vUv;
varying float vOpacity;
uniform float uRings;
const float PI = 3.141592653589793;
const float EDGE = 0.006737947;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;
  float brush = (exp(-r * 5.0) - EDGE) / (1.0 - EDGE);
  brush *= 0.55 + 0.45 * cos(sqrt(r) * PI * 2.0 * uRings);
  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}
`

const screenVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const compositeFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uTexel;
uniform vec3 uHighlight;
uniform float uStrength;
uniform float uSwirl;
uniform float uGlint;
const float TAU = 6.283185307179586;

vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0));
  vec2 scale = uResolution / safe;
  vec2 scaledSize = safe * max(scale.x, scale.y);
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

void main() {
  float amount = texture2D(uDisplacement, vUv).r;
  vec2 base = coverUV(vUv);
  float theta = amount * uSwirl * TAU;
  vec2 push = vec2(sin(theta), cos(theta)) * amount * uStrength;
  vec3 color = texture2D(uTexture, base + push).rgb;

  if (uGlint > 0.001) {
    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;
    vec3 normal = normalize(vec3(-ex * 24.0, -ey * 24.0, 1.0));
    vec3 light = normalize(vec3(-0.35, 0.55, 1.0));
    float raw = pow(max(dot(normal, light), 0.0), 22.0);
    float flatSpec = pow(max(light.z, 0.0), 22.0);
    color += uHighlight * clamp((raw - flatSpec) / max(1.0 - flatSpec, 0.0001), 0.0, 1.0) * uGlint;
  }

  gl_FragColor = vec4(color, 1.0);
}
`

export default function RippleVideo({ src, poster }) {
  const mountRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    const video = videoRef.current
    if (!mount || !video) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer

    try {
      renderer = new Renderer({
        alpha: false,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      })
    } catch {
      return undefined
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 1)
    const canvas = gl.canvas
    canvas.className = 'ripple-video__canvas'
    canvas.style.opacity = '0'
    mount.appendChild(canvas)

    const videoTexture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    })

    const offsets = new Float32Array(MAX_WAVES * 2)
    const scales = new Float32Array(MAX_WAVES * 2)
    const opacities = new Float32Array(MAX_WAVES)
    const waves = Array.from({ length: MAX_WAVES }, () => ({
      x: 0,
      y: 0,
      scale: START_SCALE,
      target: START_SCALE,
      size: 1,
      opacity: 0,
    }))
    let current = 0

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities },
    })

    const waveProgram = new Program(gl, {
      vertex: waveVertex,
      fragment: waveFragment,
      uniforms: { uRings: { value: 4 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
    })
    waveProgram.setBlendFunc(gl.ONE, gl.ONE)
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false })

    const displacementTarget = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    })

    const compositeUniforms = {
      uTexture: { value: videoTexture },
      uDisplacement: { value: displacementTarget.texture },
      uResolution: { value: [1, 1] },
      uTextureSize: { value: [1, 1] },
      uTexel: { value: [1, 1] },
      uHighlight: { value: [0.74, 0.88, 1] },
      uStrength: { value: 0.18 },
      uSwirl: { value: 0.55 },
      uGlint: { value: 0.42 },
    }

    const compositeMesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex: screenVertex,
        fragment: compositeFragment,
        uniforms: compositeUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    })

    let width = 1
    let height = 1
    let videoReady = false

    const resize = () => {
      width = Math.max(1, mount.clientWidth)
      height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height)
      compositeUniforms.uResolution.value = [width, height]
      const fieldW = Math.max(2, Math.round(width * 0.55))
      const fieldH = Math.max(2, Math.round(height * 0.55))
      displacementTarget.setSize(fieldW, fieldH)
      compositeUniforms.uTexel.value = [1 / fieldW, 1 / fieldH]
    }

    const onVideoReady = () => {
      videoReady = true
      videoTexture.image = video
      compositeUniforms.uTextureSize.value = [video.videoWidth || 1, video.videoHeight || 1]
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()
    video.addEventListener('loadeddata', onVideoReady)
    if (video.readyState >= 2) onVideoReady()
    video.play().catch(() => {})

    const setNewWave = (x, y, power = 1) => {
      const wave = waves[current]
      current = (current + 1) % MAX_WAVES
      wave.x = x
      wave.y = y
      wave.scale = START_SCALE * power
      wave.target = START_SCALE * 4.5 * power
      wave.size = 145
      wave.opacity = 1
    }

    const localPoint = (clientX, clientY) => {
      const rect = mount.getBoundingClientRect()
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null
      return [clientX - rect.left, rect.height - (clientY - rect.top)]
    }

    let previousX = 0
    let previousY = 0
    const onMove = (event) => {
      if (reduceMotion) return
      const point = localPoint(event.clientX, event.clientY)
      if (!point) return
      if (Math.abs(point[0] - previousX) > 18 || Math.abs(point[1] - previousY) > 18) {
        setNewWave(point[0], point[1])
        previousX = point[0]
        previousY = point[1]
      }
    }
    const onDown = (event) => {
      if (reduceMotion) return
      const point = localPoint(event.clientX, event.clientY)
      if (point) setNewWave(point[0], point[1], 1.35)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })

    let raf = 0
    let previousTime = 0
    let effectAvailable = true
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (!effectAvailable) return
      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0
      previousTime = now
      const growth = reduceMotion ? 0 : 1 - Math.exp(-delta * 1.09)
      const decay = reduceMotion ? 1 : Math.exp((-delta * LIFE_CONSTANT) / 2.8)

      for (let index = 0; index < MAX_WAVES; index += 1) {
        const wave = waves[index]
        if (wave.opacity <= 0) {
          opacities[index] = 0
          continue
        }
        wave.opacity *= decay
        wave.scale += (wave.target - wave.scale) * growth
        if (wave.opacity < 0.002) {
          wave.opacity = 0
          opacities[index] = 0
          continue
        }
        const half = (wave.scale * wave.size) / 2
        offsets[index * 2] = (wave.x / width) * 2 - 1
        offsets[index * 2 + 1] = (wave.y / height) * 2 - 1
        scales[index * 2] = (half / width) * 2
        scales[index * 2 + 1] = (half / height) * 2
        opacities[index] = wave.opacity
      }

      geometry.attributes.iOffset.needsUpdate = true
      geometry.attributes.iScale.needsUpdate = true
      geometry.attributes.iOpacity.needsUpdate = true
      try {
        renderer.render({ scene: waveMesh, target: displacementTarget, clear: true })
        if (videoReady) {
          videoTexture.needsUpdate = true
          renderer.render({ scene: compositeMesh })
          // Show the composited canvas once the video texture is ready so the
          // displacement field can drive the visible hover ripple effect.
          canvas.style.opacity = '1'
        }
      } catch {
        // Keep the native video visible when this browser cannot use it as a WebGL texture.
        effectAvailable = false
        canvas.style.opacity = '0'
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      video.removeEventListener('loadeddata', onVideoReady)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      if (canvas.parentNode === mount) mount.removeChild(canvas)
      const extension = gl.getExtension('WEBGL_lose_context')
      if (extension) extension.loseContext()
    }
  }, [src])

  return (
    <div className="ripple-video">
      <video ref={videoRef} className="ripple-video__fallback" src={src} poster={poster} crossOrigin="anonymous" autoPlay muted loop playsInline />
      <div ref={mountRef} className="ripple-video__mount" />
    </div>
  )
}
