import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './ScrollStack.css'

export const ScrollStackItem = ({ children }) => <article className="scroll-stack-card">{children}</article>

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smoothStep = (value) => value * value * (3 - 2 * value)

const ScrollStack = forwardRef(function ScrollStack({ children, onActiveIndexChange }, ref) {
  const scrollerRef = useRef(null)
  const cardsRef = useRef([])
  const frameRef = useRef(null)
  const scrollAnimationRef = useRef(null)
  const activeIndexRef = useRef(0)
  const titleIndexRef = useRef(-1)
  const metricsRef = useRef([])

  const measureCards = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const stackPosition = scroller.clientHeight * .18
    metricsRef.current = cardsRef.current.map((card, index) => {
      const top = card?.offsetTop ?? 0
      return { top, trigger: top - stackPosition - index * 22 }
    })
  }, [])

  const updateCards = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const stackPosition = scroller.clientHeight * .18
    let activeIndex = 0

    cardsRef.current.forEach((card, index) => {
      if (!card) return
      const metric = metricsRef.current[index]
      if (metric && scroller.scrollTop >= metric.trigger - 1) activeIndex = index
    })
    if (activeIndexRef.current !== activeIndex) {
      activeIndexRef.current = activeIndex
      onActiveIndexChange?.(activeIndex)
      const title = cardsRef.current[activeIndex]?.querySelector('h3')
      if (title && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.killTweensOf(title)
        gsap.fromTo(title,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: .52, ease: 'power4.out', overwrite: true },
        )
      }
    }
    const activeCard = cardsRef.current[activeIndex]
    const activeTrigger = activeCard
      ? activeCard.offsetTop - stackPosition - activeIndex * 16
      : 0

    cardsRef.current.forEach((card, index) => {
      if (!card) return
      if (titleIndexRef.current !== activeIndex) {
        card.classList.toggle('is-active', index === activeIndex)
      }
      const stackGap = 22
      const metric = metricsRef.current[index]
      const cardTop = metric?.top ?? card.offsetTop
      const depth = activeIndex - index
      const translateY = scroller.scrollTop - cardTop + stackPosition + index * stackGap
      const trigger = metric?.trigger ?? (cardTop - stackPosition - index * stackGap)
      const entryProgress = Math.min(1, Math.max(0, (scroller.scrollTop - (trigger - 260)) / 260))

      if (index > activeIndex) {
        card.style.opacity = '1'
        card.style.pointerEvents = 'auto'
        const depthAhead = index - activeIndex
        const stackScale = Math.max(1.28, 1.5 - (depthAhead - 1) * .04)
        const settledScale = 1.07
        const entryScale = index === activeIndex + 1
          ? stackScale - (stackScale - settledScale) * smoothStep(entryProgress)
          : stackScale
        const stackOffset = depthAhead * 14
        const entryOffset = index === activeIndex + 1 ? stackOffset * (1 - smoothStep(entryProgress)) : stackOffset
        card.style.transform = `translate3d(0, ${entryOffset}px, 0) scale(${entryScale})`
        card.style.zIndex = String(index + 1)
        return
      }

      const pastOpacity = depth === 0 ? .8 : depth === 1 ? .5 : depth === 2 ? .2 : 0
      card.style.opacity = String(pastOpacity)
      card.style.pointerEvents = depth < 3 ? 'auto' : 'none'
      const isEnteringActive = index === activeIndex && activeIndex > 0
      const settleProgress = isEnteringActive
        ? smoothStep(clamp((scroller.scrollTop - trigger) / 240))
        : 1
      const isJustLeft = depth === 1 && activeIndex > 0
      const leaveProgress = isJustLeft
        ? smoothStep(clamp((scroller.scrollTop - activeTrigger) / 240))
        : 1
      const scale = isEnteringActive
        ? 1.07 - settleProgress * .03
        : isJustLeft
          ? 1.04 - leaveProgress * .025
          : Math.max(.88, 1.04 - depth * .025)
      card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`
      card.style.zIndex = String(index + 1)
    })
    if (titleIndexRef.current !== activeIndex) titleIndexRef.current = activeIndex
    frameRef.current = null
  }, [measureCards, onActiveIndexChange])

  const scheduleUpdate = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame(updateCards)
  }, [updateCards])

  useImperativeHandle(ref, () => ({
    scrollToIndex(index) {
      const scroller = scrollerRef.current
      const card = cardsRef.current[index]
      if (!scroller || !card) return
      if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
      const start = scroller.scrollTop
      const target = Math.max(0, card.offsetTop - scroller.clientHeight * .18 - index * 22)
      const startTime = performance.now()
      const duration = 1200
      const animate = (time) => {
        const progress = Math.min(1, (time - startTime) / duration)
        const eased = 1 - Math.pow(1 - progress, 4)
        scroller.scrollTop = start + (target - start) * eased
        if (progress < 1) {
          scrollAnimationRef.current = requestAnimationFrame(animate)
        } else {
          scrollAnimationRef.current = null
        }
      }
      scrollAnimationRef.current = requestAnimationFrame(animate)
    },
  }), [onActiveIndexChange])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return undefined
    cardsRef.current = Array.from(scroller.querySelectorAll('.scroll-stack-card'))
    measureCards()
    updateCards()
    scroller.addEventListener('scroll', scheduleUpdate, { passive: true })
    const handleResize = () => { measureCards(); scheduleUpdate() }
    window.addEventListener('resize', handleResize)
    return () => {
      scroller.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (scrollAnimationRef.current) cancelAnimationFrame(scrollAnimationRef.current)
    }
  }, [measureCards, scheduleUpdate, updateCards])

  return <div ref={scrollerRef} className="scroll-stack-scroller"><div className="scroll-stack-inner">{children}<div className="scroll-stack-end" /></div></div>
})

export default ScrollStack
