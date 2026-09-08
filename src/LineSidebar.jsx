import { useCallback, useEffect, useRef } from 'react'
import './LineSidebar.css'

const smooth = (value) => value * value * (3 - 2 * value)
const proximityRadius = 104
const smoothing = 100

export default function LineSidebar({ items, activeIndex, onItemClick }) {
  const listRef = useRef(null)
  const itemRefs = useRef([])
  const targetsRef = useRef([])
  const currentRef = useRef([])
  const frameRef = useRef(null)
  const lastTimeRef = useRef(null)
  const isSidebarHoveredRef = useRef(false)
  const itemCount = items.length

  const update = useCallback((time) => {
    const previous = lastTimeRef.current ?? time
    const delta = time - previous
    lastTimeRef.current = time
    const amount = 1 - Math.exp(-delta / smoothing)
    let moving = false

    itemRefs.current.forEach((element, index) => {
      if (!element) return
      const target = targetsRef.current[index] ?? 0
      const current = currentRef.current[index] ?? 0
      const next = current + (target - current) * amount
      currentRef.current[index] = next
      element.style.setProperty('--effect', next.toFixed(4))
      if (Math.abs(target - next) > .001) moving = true
    })

    frameRef.current = moving ? requestAnimationFrame(update) : null
  }, [])

  const startUpdate = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(update)
  }, [update])

  const handlePointerMove = useCallback((event) => {
    if (!listRef.current) return

    itemRefs.current.forEach((element, index) => {
      if (!element) return
      const rect = element.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const distance = Math.abs(event.clientY - center)
      const proximity = smooth(Math.max(0, 1 - distance / proximityRadius))
      targetsRef.current[index] = proximity ** 2.2
    })
    startUpdate()
  }, [startUpdate])

  const setTargets = useCallback((index) => {
    targetsRef.current = Array.from({ length: itemCount }, (_, itemIndex) => itemIndex === index ? 1 : 0)
    startUpdate()
  }, [itemCount, startUpdate])

  const handleSidebarEnter = useCallback(() => {
    isSidebarHoveredRef.current = true
    setTargets(null)
  }, [setTargets])
  const handleSidebarLeave = useCallback(() => {
    isSidebarHoveredRef.current = false
    setTargets(activeIndex)
  }, [activeIndex, setTargets])

  useEffect(() => {
    targetsRef.current = Array.from({ length: itemCount }, (_, index) => index === activeIndex ? 1 : 0)
    currentRef.current = Array.from({ length: itemCount }, (_, index) => index === activeIndex ? 1 : 0)
  }, [itemCount])

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isSidebarHoveredRef.current) setTargets(activeIndex)
  }, [activeIndex, setTargets])

  return (
    <nav className="line-sidebar line-sidebar--markers line-sidebar--scale-tick" aria-label="Skills" onPointerEnter={handleSidebarEnter} onPointerLeave={handleSidebarLeave}>
      <ul ref={listRef} className="line-sidebar__list" onPointerMove={handlePointerMove}>
        {items.map((item, index) => (
          <li key={item} ref={(element) => { itemRefs.current[index] = element }} className="line-sidebar__item" tabIndex={0} role="button" onClick={() => onItemClick?.(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onItemClick?.(index) } }}>
            <span className="line-sidebar__marker" aria-hidden="true" />
            <span className="line-sidebar__label"><span className="line-sidebar__index">{String(index + 1).padStart(2, '0')}</span>{item}</span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
