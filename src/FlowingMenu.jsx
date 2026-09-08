import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './FlowingMenu.css'

function FlowingMenu({ items = [], speed = 15, onSelect }) {
  return <div className="flowing-menu-wrap"><nav className="flowing-menu" aria-label="Internship companies">{items.map((item) => <MenuItem key={item.id} {...item} speed={speed} onSelect={onSelect} />)}</nav></div>
}

function MenuItem({ id, text, hoverText, date, image, speed, onSelect }) {
  const itemRef = useRef(null); const marqueeRef = useRef(null); const marqueeInnerRef = useRef(null); const animationRef = useRef(null); const [repetitions, setRepetitions] = useState(4)
  const edgeFor = (x, y, width, height) => ((x - width / 2) ** 2 + y ** 2) < ((x - width / 2) ** 2 + (y - height) ** 2) ? 'top' : 'bottom'
  useEffect(() => { const calculate = () => { const first = marqueeInnerRef.current?.querySelector('.flowing-menu__part'); const width = first?.offsetWidth; if (width) setRepetitions(Math.max(4, Math.ceil(window.innerWidth / width) + 2)) }; calculate(); window.addEventListener('resize', calculate); return () => window.removeEventListener('resize', calculate) }, [text, hoverText, image])
  useEffect(() => { const timer = window.setTimeout(() => { const first = marqueeInnerRef.current?.querySelector('.flowing-menu__part'); const width = first?.offsetWidth; if (!width || !marqueeInnerRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; animationRef.current?.kill(); animationRef.current = gsap.to(marqueeInnerRef.current, { x: -width, duration: speed, ease: 'none', repeat: -1 }) }, 40); return () => { window.clearTimeout(timer); animationRef.current?.kill() } }, [hoverText, image, repetitions, speed])
  const animate = (event, entering) => { const item = itemRef.current; if (!item || !marqueeRef.current || !marqueeInnerRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const b = item.getBoundingClientRect(); const edge = edgeFor((event.clientX || b.left + b.width / 2) - b.left, (event.clientY || b.top + b.height / 2) - b.top, b.width, b.height); const out = edge === 'top' ? '-101%' : '101%'; const inverse = edge === 'top' ? '101%' : '-101%'; gsap.timeline({ defaults: { duration: .6, ease: 'expo.out' } }).set(marqueeRef.current, entering ? { y: out } : {}).set(marqueeInnerRef.current, entering ? { y: inverse } : {}).to(marqueeRef.current, { y: entering ? '0%' : out }, 0).to(marqueeInnerRef.current, { y: entering ? '0%' : inverse }, 0) }
  return <div className="flowing-menu__item" ref={itemRef}><span className="flowing-menu__date">{date}</span><a className="flowing-menu__link" href={`#experience-${id}`} onClick={(event) => { event.preventDefault(); onSelect?.(id) }} onMouseEnter={(event) => animate(event, true)} onMouseLeave={(event) => animate(event, false)} onFocus={(event) => animate(event, true)} onBlur={(event) => animate(event, false)}>{text}</a><span className="flowing-menu__index">{id}</span><div className="flowing-menu__marquee" ref={marqueeRef} aria-hidden="true"><div className="flowing-menu__inner-wrap"><div className="flowing-menu__inner" ref={marqueeInnerRef}>{Array.from({ length: repetitions }).map((_, index) => <div className="flowing-menu__part" key={index}><span>{hoverText}</span><div className="flowing-menu__image" style={{ backgroundImage: `url(${image})` }} /></div>)}</div></div></div></div>
}

export default FlowingMenu
