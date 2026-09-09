import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import './DepthCarousel.css'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export default function DepthCarousel({ items, className = '', onChange, onSelect }) {
  const data = useMemo(() => Array.isArray(items) ? items : [], [items])
  const rootRef = useRef(null)
  const cardRefs = useRef([])
  const tintRefs = useRef([])
  const positionRef = useRef(0)
  const focusRef = useRef(0)
  const tweenRef = useRef(null)
  const scaleRef = useRef(1)
  const dragRef = useRef(null)
  const wheelTimerRef = useRef(null)
  const [active, setActive] = useState(0)

  const layout = useCallback((position) => {
    const count = data.length
    if (!count) return
    const cardWidth = 615 * scaleRef.current
    const depth = 248 * scaleRef.current
    const spread = 123 * scaleRef.current

    data.forEach((_, index) => {
      const card = cardRefs.current[index]
      if (!card) return
      let distance = index - position
      distance = ((distance % count) + count) % count
      if (distance > count / 2) distance -= count

      const behind = Math.max(0, distance)
      const distanceAbs = Math.abs(distance)
      const shown = distanceAbs <= 3.2
      const opacity = distance < 0 ? Math.max(0, 1 + distance) : 1
      const tint = tintRefs.current[index]

      card.style.transform = `translate(-50%, -50%) translateX(${(spread * distance).toFixed(2)}px) translateZ(${(-depth * distance).toFixed(2)}px) rotateY(${(20 * clamp(distance, 0, 1)).toFixed(2)}deg)`
      card.style.width = `${cardWidth}px`
      card.style.height = `${Math.round(cardWidth * .64)}px`
      card.style.opacity = shown ? opacity.toFixed(3) : '0'
      card.style.filter = `brightness(${Math.max(.25, 1 - behind * .2).toFixed(2)}) blur(${Math.min(5, behind * 1.6).toFixed(2)}px)`
      card.style.zIndex = String(Math.round(1000 - distance * 20))
      card.style.pointerEvents = shown && opacity > .05 ? 'auto' : 'none'
      if (tint) tint.style.opacity = clamp(behind * .18, 0, .7).toFixed(2)
    })
  }, [data])

  const changeFocus = useCallback((rawIndex, animate = true) => {
    const count = data.length
    if (!count) return
    const index = ((rawIndex % count) + count) % count
    let delta = index - positionRef.current
    delta = ((delta % count) + count) % count
    if (delta > count / 2) delta -= count
    const target = positionRef.current + delta
    tweenRef.current?.kill()
    const proxy = { position: positionRef.current }
    tweenRef.current = gsap.to(proxy, {
      position: target,
      duration: animate ? .66 : 0,
      ease: 'power3.out',
      onUpdate: () => {
        positionRef.current = proxy.position
        layout(proxy.position)
      },
      onComplete: () => {
        positionRef.current = ((target % count) + count) % count
        layout(positionRef.current)
      },
    })
    if (index !== focusRef.current) {
      focusRef.current = index
      setActive(index)
      onChange?.(index, data[index])
    }
  }, [data, layout, onChange])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const observer = new ResizeObserver(([entry]) => {
      // Let the active card fit inside a narrow viewport instead of being clipped.
      scaleRef.current = clamp(entry.contentRect.width / 720, .46, 1)
      layout(positionRef.current)
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [layout])

  useEffect(() => {
    positionRef.current = 0
    focusRef.current = 0
    setActive(0)
    layout(0)
    return () => {
      tweenRef.current?.kill()
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    }
  }, [layout])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const preload = () => root.querySelectorAll('img[data-gallery-image]').forEach((image) => { image.loading = 'eager' })
    if (!('IntersectionObserver' in window)) {
      preload()
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      preload()
      observer.disconnect()
    }, { root: root.closest('.scroll-frame') ?? null, rootMargin: '900px 0px' })
    observer.observe(root)
    return () => observer.disconnect()
  }, [data.length])

  const onWheel = useCallback((event) => {
    if (data.length < 2) return
    event.preventDefault()
    tweenRef.current?.kill()
    positionRef.current += clamp(event.deltaY / 350, -.5, .5)
    layout(positionRef.current)
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current)
    wheelTimerRef.current = setTimeout(() => changeFocus(Math.round(positionRef.current)), 120)
  }, [changeFocus, data.length, layout])

  const onPointerDown = useCallback((event) => {
    if (event.target.closest('.depth-carousel__card')) return
    tweenRef.current?.kill()
    dragRef.current = { x: event.clientX, position: positionRef.current, moved: false, pointerId: event.pointerId }
  }, [])

  const onPointerMove = useCallback((event) => {
    if (event.target.closest('.depth-carousel__card') && !dragRef.current) return
    const drag = dragRef.current
    if (!drag) return
    const delta = event.clientX - drag.x
    if (Math.abs(delta) > 4) {
      drag.moved = true
      rootRef.current?.setPointerCapture(event.pointerId)
    }
    if (!drag.moved) return
    positionRef.current = drag.position - delta / Math.max(190 * scaleRef.current, 120)
    layout(positionRef.current)
  }, [layout])

  const onPointerEnd = useCallback((event) => {
    if (event.target.closest('.depth-carousel__card') && !dragRef.current) return
    if (!dragRef.current) return
    dragRef.current = null
    changeFocus(Math.round(positionRef.current))
  }, [changeFocus])

  const activeItem = data[active] ?? data[0]
  return (
    <div
      ref={rootRef}
      className={`depth-carousel ${className}`.trim()}
      role="region"
      aria-label="Video carousel"
      tabIndex={0}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); changeFocus(active - 1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); changeFocus(active + 1) }
      }}
    >
      <div className="depth-carousel__stage">
        {data.map((item, index) => (
          <button
            className="depth-carousel__card"
            key={item.image}
            ref={(element) => { cardRefs.current[index] = element }}
            type="button"
            aria-label={item.text}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              if (onSelect) onSelect(index, data[index], event.currentTarget)
              else changeFocus(index)
            }}
          >
            <img data-gallery-image src={item.image} alt="" loading="lazy" decoding="async" draggable="false" />
            <span ref={(element) => { tintRefs.current[index] = element }} />
          </button>
        ))}
      </div>
      <div className="depth-carousel__controls">
        <button type="button" aria-label="Previous video" onClick={() => changeFocus(active - 1)}>←</button>
        <p><i>{String(active + 1).padStart(2, '0')} / {String(data.length).padStart(2, '0')}</i>{activeItem?.text}</p>
        <button type="button" aria-label="Next video" onClick={() => changeFocus(active + 1)}>→</button>
      </div>
    </div>
  )
}
