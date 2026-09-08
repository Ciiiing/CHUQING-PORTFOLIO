import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import './CircularGallery.css'

const lerp = (from, to, amount) => from + (to - from) * amount

class GalleryMedia {
  constructor({ geometry, gl, item, index, scene, viewport, screen, bend, onGeometryChange }) {
    this.gl = gl
    this.index = index
    this.scene = scene
    this.viewport = viewport
    this.screen = screen
    this.bend = bend
    this.extra = 0
    this.imageAspect = 16 / 9
    this.imageLoaded = false
    this.onGeometryChange = onGeometryChange
    this.createProgram(item.image)
    this.plane = new Mesh(gl, { geometry, program: this.program })
    this.plane.setParent(scene)
    this.resize(screen, viewport)
  }

  createProgram(image) {
    const texture = new Texture(this.gl, { generateMipmaps: true })
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) + cos(p.y * 2.0 + uTime)) * (0.08 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        uniform float uRadius;
        varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        void main() {
          float distance = roundedBoxSDF(vUv - .5, vec2(.5 - uRadius), uRadius);
          float alpha = 1.0 - smoothstep(-.002, .002, distance);
          gl_FragColor = vec4(texture2D(tMap, vUv).rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uTime: { value: Math.random() * 100 },
        uSpeed: { value: 0 },
        uRadius: { value: .045 },
      },
      transparent: true,
    })
    const imageElement = new Image()
    imageElement.src = image
    imageElement.onload = () => {
      texture.image = imageElement
      this.imageAspect = imageElement.naturalWidth / imageElement.naturalHeight
      this.imageLoaded = true
      this.resize(this.screen, this.viewport)
      this.onGeometryChange?.()
    }
  }

  resize(screen, viewport) {
    this.screen = screen
    this.viewport = viewport
    this.plane.scale.y = viewport.height * .756
    this.plane.scale.x = this.plane.scale.y * this.imageAspect
    this.width = this.plane.scale.x * 1.38
  }

  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra
    const x = this.plane.position.x
    const halfViewport = this.viewport.width / 2
    const bend = Math.abs(this.bend)
    const radius = (halfViewport * halfViewport + bend * bend) / (2 * bend)
    const effectiveX = Math.min(Math.abs(x), halfViewport)
    const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX)
    this.plane.position.y = this.bend > 0 ? -arc : arc
    this.plane.rotation.z = (this.bend > 0 ? -1 : 1) * Math.sign(x) * Math.asin(effectiveX / radius)
    this.program.uniforms.uTime.value += .035
    this.program.uniforms.uSpeed.value = scroll.current - scroll.last

    const halfPlane = this.plane.scale.x / 2
    // Keep the opening spread focused on three books; neighboring books enter
    // only after the gallery is scrolled far enough to bring them in.
    this.plane.visible = Math.abs(x) < halfViewport * .68 + halfPlane
    const isBefore = x + halfPlane < -halfViewport
    const isAfter = x - halfPlane > halfViewport
    if (direction === 'right' && isBefore) this.extra -= this.widthTotal
    if (direction === 'left' && isAfter) this.extra += this.widthTotal
  }
}

class GalleryApp {
  constructor(container, items, options) {
    this.container = container
    this.items = items.concat(items)
    this.options = options
    this.initialPositioned = false
    this.scroll = { current: 0, target: 0, last: 0, ease: options.scrollEase }
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 1.7) })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    container.appendChild(this.gl.canvas)
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 20
    this.scene = new Transform()
    this.geometry = new Plane(this.gl, { heightSegments: 42, widthSegments: 80 })
    this.resize()
    this.medias = this.items.map((item, index) => new GalleryMedia({
      geometry: this.geometry,
      gl: this.gl,
      item,
      index,
      scene: this.scene,
      viewport: this.viewport,
      screen: this.screen,
      bend: options.bend,
      onGeometryChange: () => this.handleGeometryChange(),
    }))
    this.layoutMedias()
    this.bindEvents()
    this.update()
  }

  handleGeometryChange() {
    this.layoutMedias()
    if (!this.initialPositioned && this.medias?.every((media) => media.imageLoaded)) {
      // Place the second item at the center so the requested three-book opening
      // starts with the first item on the left and the third on the right.
      this.scroll.current = this.medias[0].width
      this.scroll.target = this.scroll.current
      this.scroll.last = this.scroll.current
      this.initialPositioned = true
    }
  }

  resize() {
    this.screen = { width: Math.max(this.container.clientWidth, 1), height: Math.max(this.container.clientHeight, 1) }
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({ aspect: this.screen.width / this.screen.height })
    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    this.viewport = { width: height * this.camera.aspect, height }
    this.medias?.forEach((media) => media.resize(this.screen, this.viewport))
    this.layoutMedias()
  }

  layoutMedias() {
    if (!this.medias?.length) return
    let cursor = 0
    this.medias.forEach((media) => {
      media.x = cursor
      cursor += media.width
    })
    this.totalWidth = cursor
    this.medias.forEach((media) => { media.widthTotal = this.totalWidth })
  }

  closestMediaIndex(position) {
    if (!this.medias?.length || !this.totalWidth) return 0
    const normalized = ((position % this.totalWidth) + this.totalWidth) % this.totalWidth
    let closestIndex = 0
    let closestDistance = Infinity
    this.medias.forEach((media, index) => {
      const distance = Math.abs(media.x - normalized)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })
    return closestIndex
  }

  bindEvents() {
    this.onPointerDown = (event) => {
      this.isDown = true
      this.dragStart = event.clientX
      this.dragOrigin = this.scroll.current
      this.pointerMoved = false
      this.container.setPointerCapture?.(event.pointerId)
    }
    this.onPointerMove = (event) => {
      this.options.onHover?.(this.hitTest(event.clientX, event.clientY), event)
      if (!this.isDown) return
      if (Math.abs(event.clientX - this.dragStart) > 6) this.pointerMoved = true
      this.scroll.target = this.dragOrigin + (this.dragStart - event.clientX) * .028 * this.options.scrollSpeed
    }
    this.onPointerUp = (event) => {
      const wasClick = this.isDown && !this.pointerMoved
      this.isDown = false
      this.snap()
      if (wasClick) {
        const hit = this.hitTest(event.clientX, event.clientY)
        if (hit) this.options.onSelect?.(hit.index)
      }
    }
    this.onWheel = (event) => {
      if (!event.deltaY) return
      event.preventDefault()
      this.scroll.target += Math.sign(event.deltaY) * this.options.scrollSpeed * .42
    }
    this.onKeyDown = (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return
      event.preventDefault()
      if (event.key === 'Home') {
        this.scroll.target = 0
        return
      }
      this.scroll.target += (event.key === 'ArrowRight' ? 1 : -1) * this.options.scrollSpeed * 4
      this.snap()
    }
    this.container.addEventListener('pointerdown', this.onPointerDown)
    this.container.addEventListener('pointermove', this.onPointerMove)
    this.container.addEventListener('pointerup', this.onPointerUp)
    this.container.addEventListener('pointercancel', this.onPointerUp)
    this.container.addEventListener('wheel', this.onWheel, { passive: false })
    this.container.addEventListener('keydown', this.onKeyDown)
  }

  hitTest(clientX, clientY) {
    if (!this.screen?.width || !this.screen?.height || !this.viewport?.width) return null
    const rect = this.container.getBoundingClientRect()
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null
    const worldX = (localX / rect.width - .5) * this.viewport.width
    const worldY = (.5 - localY / rect.height) * this.viewport.height
    let closest = null
    let closestDistance = Infinity
    this.medias.forEach((media, mediaIndex) => {
      const x = media.plane.position.x
      const halfW = media.plane.scale.x / 2
      const halfH = media.plane.scale.y / 2
      if (Math.abs(worldX - x) <= halfW && Math.abs(worldY - media.plane.position.y) <= halfH) {
        const distance = Math.abs(worldX - x)
        if (distance < closestDistance) {
          closestDistance = distance
          closest = { index: mediaIndex % (this.items.length / 2), text: this.items[mediaIndex % (this.items.length / 2)].text }
        }
      }
    })
    return closest
  }

  snap() {
    if (!this.totalWidth) return
    const normalized = ((this.scroll.target % this.totalWidth) + this.totalWidth) % this.totalWidth
    const closest = this.medias[this.closestMediaIndex(this.scroll.target)]
    this.scroll.target += closest.x - normalized
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current === this.scroll.last ? null : this.scroll.current > this.scroll.last ? 'right' : 'left'
    this.medias?.forEach((media) => media.update(this.scroll, direction))
    if (this.medias?.[0]) {
      const index = this.closestMediaIndex(this.scroll.current) % (this.items.length / 2)
      if (index !== this.activeIndex) {
        this.activeIndex = index
        this.options.onActiveChange?.(index)
      }
    }
    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.raf = requestAnimationFrame(() => this.update())
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.container.removeEventListener('pointerdown', this.onPointerDown)
    this.container.removeEventListener('pointermove', this.onPointerMove)
    this.container.removeEventListener('pointerup', this.onPointerUp)
    this.container.removeEventListener('pointercancel', this.onPointerUp)
    this.container.removeEventListener('wheel', this.onWheel)
    this.container.removeEventListener('keydown', this.onKeyDown)
    this.renderer.gl.canvas.remove()
  }
}

export default function CircularGallery({ items, bend = 3, textColor = '#f2f5f5', font = '600 19px Space Grotesk', scrollSpeed = 2, scrollEase = .055, onSelect, ariaLabel = 'Circular gallery. Drag, scroll, or use left and right arrow keys to browse.' }) {
  const containerRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [tooltip, setTooltip] = useState(null)
  const onActiveChange = useCallback((index) => setActiveIndex(index), [])
  const handleSelect = useCallback((index) => onSelect?.(index, containerRef.current), [onSelect])
  const onHover = useCallback((hit, event) => {
    if (!hit || !containerRef.current) {
      setTooltip(null)
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ text: hit.text, x: event.clientX - rect.left + 16, y: event.clientY - rect.top + 16 })
  }, [])

  useEffect(() => {
    if (!containerRef.current || !items.length) return undefined
    const app = new GalleryApp(containerRef.current, items, { bend, textColor, font, scrollSpeed, scrollEase, onActiveChange, onHover, onSelect: handleSelect })
    const observer = new ResizeObserver(() => app.resize())
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      app.destroy()
    }
  }, [items, bend, textColor, font, scrollSpeed, scrollEase, onActiveChange, onHover, handleSelect])

  const activeItem = items[activeIndex] ?? items[0]
  return (
    <div className="circular-gallery" role="region" aria-label={ariaLabel}>
      <div ref={containerRef} className="circular-gallery__canvas" tabIndex={0} />
      {tooltip && <div className="circular-gallery__tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</div>}
      <p className="circular-gallery__caption"><span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>{activeItem?.text}</p>
    </div>
  )
}
