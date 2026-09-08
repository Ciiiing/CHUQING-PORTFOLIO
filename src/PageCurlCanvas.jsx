import { useEffect, useRef } from 'react'
import { Camera, Mesh, Plane, Program, Renderer, Texture } from 'ogl'

const vertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgress;
uniform float uDirection;
out vec2 vUv;
out float vCurl;
out float vDepth;

void main() {
  float local = uv.x;
  float angle = uProgress * 3.14159265;
  float x;
  float z;
  if (uDirection > 0.0) {
    x = local * cos(angle) - 0.5;
    z = local * sin(angle);
  } else {
    x = 0.5 - local * cos(angle);
    z = local * sin(angle);
  }
  float edgeBend = sin(local * 3.14159265);
  float spineBend = sin(local * 1.5707963);
  float curl = edgeBend * (0.11 + 0.08 * spineBend) * sin(angle);
  z += curl;
  float y = position.y + sin(local * 3.14159265) * 0.018 * sin(angle);
  vUv = uv;
  vCurl = curl;
  vDepth = z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, z, 1.0);
}`

const fragment = `#version 300 es
precision highp float;
uniform sampler2D uCurrent;
uniform sampler2D uNext;
uniform float uProgress;
uniform float uDirection;
uniform float uCurrentMode;
uniform float uNextMode;
in vec2 vUv;
in float vCurl;
in float vDepth;
out vec4 outColor;

float sourceU(float local, float mode, bool isCurrent) {
  if (uDirection > 0.0) {
    if (isCurrent) return mode < 0.5 ? 0.5 + local * 0.5 : local;
    return mode < 0.5 ? local * 0.5 : local;
  }
  if (isCurrent) return mode < 0.5 ? local * 0.5 : local;
  return mode < 0.5 ? 0.5 + local * 0.5 : local;
}

void main() {
  vec4 current = texture(uCurrent, vec2(sourceU(vUv.x, uCurrentMode, true), vUv.y));
  vec4 next = texture(uNext, vec2(sourceU(vUv.x, uNextMode, false), vUv.y));
  float reveal = smoothstep(0.34, 0.72, uProgress);
  vec3 color = mix(current.rgb, next.rgb, reveal);
  float pageLight = 1.0 - abs(vCurl) * 1.6;
  float foldShadow = smoothstep(0.02, 0.14, abs(vCurl)) * 0.17;
  float movingShadow = smoothstep(0.0, 1.0, uProgress) * (0.07 + abs(vDepth) * 0.18);
  color *= pageLight;
  color -= foldShadow + movingShadow;
  outColor = vec4(color, 1.0);
}`

const loadTexture = (gl, source) => new Promise((resolve) => {
  const texture = new Texture(gl, { generateMipmaps: false })
  const image = new Image()
  image.decoding = 'async'
  image.onload = () => { texture.image = image; resolve(texture) }
  image.onerror = () => resolve(texture)
  image.src = source
})

export default function PageCurlCanvas({ currentSrc, nextSrc, direction, currentMode = 'spread', nextMode = 'spread', onComplete, className = '' }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    mount.appendChild(gl.canvas)
    const camera = new Camera(gl, { fov: 35 })
    camera.position.z = 5
    const geometry = new Plane(gl, { widthSegments: 64, heightSegments: 36 })
    let mesh
    let frame = 0
    let stopped = false
    const started = performance.now()

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height)
      camera.perspective({ aspect: width / height })
      const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
      const visibleWidth = visibleHeight * width / height
      if (mesh) {
        mesh.scale.set(visibleWidth * 0.5, visibleHeight, 1)
        mesh.position.x = direction === 'next' ? visibleWidth * 0.25 : -visibleWidth * 0.25
      }
    }

    Promise.all([loadTexture(gl, currentSrc), loadTexture(gl, nextSrc)]).then(([current, next]) => {
      if (stopped) return
      const modeValue = (mode) => mode === 'first' ? 1 : mode === 'last' ? 2 : 0
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uCurrent: { value: current },
          uNext: { value: next },
          uProgress: { value: 0 },
          uDirection: { value: direction === 'next' ? 1 : -1 },
          uCurrentMode: { value: modeValue(currentMode) },
          uNextMode: { value: modeValue(nextMode) },
        },
        transparent: true,
      })
      mesh = new Mesh(gl, { geometry, program })
      resize()
      const render = (time) => {
        if (stopped) return
        const progress = Math.min(1, (time - started) / 820)
        program.uniforms.uProgress.value = progress
        renderer.render({ camera, scene: mesh })
        if (progress >= 1) { onComplete?.(); return }
        frame = requestAnimationFrame(render)
      }
      frame = requestAnimationFrame(render)
    })

    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      gl.canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [currentSrc, nextSrc, direction, currentMode, nextMode, onComplete])

  return <div ref={mountRef} className={`project-flipbook-curl-canvas ${className}`} aria-hidden="true" />
}
