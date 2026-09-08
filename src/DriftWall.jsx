import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './DriftWall.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1
  return 1 + variance * pseudo
}

export default function DriftWall({
  items = [],
  columns = 3,
  gap = 18,
  speed = 28,
  direction = 'up',
  variance = 0.2,
  pauseOnHover = true,
  radius = 0,
  className = '',
  style
}) {
  const containerRef = useRef(null)
  const trackRefs = useRef([])
  const cycleHeightsRef = useRef([])
  const offsetsRef = useRef([])
  const velocitiesRef = useRef([])
  const hoveredColRef = useRef(-1)
  const lastTsRef = useRef(null)
  const rafRef = useRef(null)
  const [reduced, setReduced] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const columnItems = useMemo(() => {
    const cols = Array.from({ length: columns }, () => [])
    items.forEach((item, index) => cols[index % columns].push(item))
    return cols.map((column) => column.length ? column : items.slice(0, 1))
  }, [columns, items])

  useEffect(() => {
    setReduced(prefersReducedMotion())
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event) => setReduced(event.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  const measureTracks = useCallback(() => {
    cycleHeightsRef.current = trackRefs.current.map((track) => {
      if (!track) return 1
      return Math.max(1, track.scrollHeight / 2)
    })
  }, [])

  useLayoutEffect(() => {
    measureTracks()
    const observers = trackRefs.current.filter(Boolean).map((track) => {
      const observer = new ResizeObserver(measureTracks)
      observer.observe(track)
      return observer
    })
    window.addEventListener('resize', measureTracks)
    return () => {
      observers.forEach((observer) => observer.disconnect())
      window.removeEventListener('resize', measureTracks)
    }
  }, [columnItems, gap, measureTracks])

  useEffect(() => {
    offsetsRef.current = columnItems.map((_, index) => (cycleHeightsRef.current[index] || 1) * ((index * 0.31) % 1))
    velocitiesRef.current = columnItems.map(() => 0)
  }, [columnItems])

  useEffect(() => {
    const animate = (timestamp) => {
      if (lastTsRef.current === null) lastTsRef.current = timestamp
      const delta = Math.min(0.05, Math.max(0, timestamp - lastTsRef.current) / 1000)
      lastTsRef.current = timestamp

      if (!reduced) {
        trackRefs.current.forEach((track, columnIndex) => {
          const cycleHeight = cycleHeightsRef.current[columnIndex] || 1
          const paused = pauseOnHover && hoveredColRef.current === columnIndex
          const target = paused || hoveredColRef.current === columnIndex
            ? 0
            : speed * columnFactor(columnIndex, variance) * (direction === 'up' ? 1 : -1)
          const ease = 1 - Math.exp(-delta / (target === 0 ? 0.16 : 0.3))
          velocitiesRef.current[columnIndex] = (velocitiesRef.current[columnIndex] || 0) +
            (target - (velocitiesRef.current[columnIndex] || 0)) * ease
          let offset = (offsetsRef.current[columnIndex] || 0) + velocitiesRef.current[columnIndex] * delta
          offset = ((offset % cycleHeight) + cycleHeight) % cycleHeight
          offsetsRef.current[columnIndex] = offset
          if (track) track.style.transform = `translate3d(0, ${-offset}px, 0)`
        })
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
    }
  }, [direction, pauseOnHover, reduced, speed, variance])

  const activate = (id, column) => {
    setActiveId(id)
    hoveredColRef.current = column
  }

  const release = () => {
    setActiveId(null)
    hoveredColRef.current = -1
  }

  const rootClass = ['drift-wall', reduced ? 'drift-wall--reduced' : '', className].filter(Boolean).join(' ')

  return (
    <div
      ref={containerRef}
      className={rootClass}
      style={{ '--dw-gap': `${gap}px`, '--dw-radius': `${radius}px`, '--dw-columns': columns, ...style }}
      onPointerLeave={release}
      role="region"
      aria-label="Graphic work archive"
    >
      <div className="drift-wall__plane">
        {columnItems.map((column, columnIndex) => (
          <div className="drift-wall__col" key={`column-${columnIndex}`}>
            <div
              className="drift-wall__track"
              ref={(element) => { trackRefs.current[columnIndex] = element }}
            >
              {[0, 1].flatMap((copy) => column.map((item, itemIndex) => {
                const id = `${columnIndex}-${copy}-${itemIndex}`
                return (
                  <article
                    className={`drift-wall__tile${activeId === id ? ' is-active' : ''}`}
                    data-column={columnIndex}
                    key={id}
                    style={{ '--dw-tilt': `${columnIndex % 2 === 0 ? -1.4 : 1.4}deg` }}
                    tabIndex={0}
                    onFocus={() => activate(id, columnIndex)}
                    onBlur={release}
                    onMouseEnter={() => activate(id, columnIndex)}
                    onMouseLeave={release}
                  >
                    <img src={item.image} alt={item.title || ''} loading="lazy" decoding="async" draggable="false" />
                    <span className="drift-wall__shade" aria-hidden="true" />
                  </article>
                )
              }))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
