import { useCallback, useEffect, useRef } from 'react'
import { ArrowDownRight } from 'lucide-react'

function PressureTitle({ title, accent }) {
  const titleRef = useRef(null)
  const characterRefs = useRef([])
  const frameRef = useRef(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const canAnimateRef = useRef(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const updateAnimationPreference = () => {
      canAnimateRef.current = !reducedMotion.matches && finePointer.matches
    }

    updateAnimationPreference()
    reducedMotion.addEventListener('change', updateAnimationPreference)
    finePointer.addEventListener('change', updateAnimationPreference)

    return () => {
      reducedMotion.removeEventListener('change', updateAnimationPreference)
      finePointer.removeEventListener('change', updateAnimationPreference)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const resetCharacters = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    characterRefs.current.forEach((character) => {
      if (!character) return
      character.style.removeProperty('--pressure-scale')
      character.style.removeProperty('--pressure-skew')
      character.style.removeProperty('--pressure-lift')
    })
  }, [])

  const handlePointerMove = useCallback((event) => {
    if (!canAnimateRef.current || !titleRef.current) return

    pointerRef.current = { x: event.clientX, y: event.clientY }
    if (frameRef.current) return

    frameRef.current = requestAnimationFrame(() => {
      const titleBounds = titleRef.current?.getBoundingClientRect()
      if (!titleBounds) return

      const maxDistance = Math.max(titleBounds.width * 0.42, 220)
      characterRefs.current.forEach((character) => {
        if (!character) return
        const bounds = character.getBoundingClientRect()
        const centerX = bounds.left + bounds.width / 2
        const centerY = bounds.top + bounds.height / 2
        const distance = Math.hypot(pointerRef.current.x - centerX, pointerRef.current.y - centerY)
        const proximity = Math.max(0, 1 - distance / maxDistance) ** 1.45
        const scale = 0.92 + proximity * 0.42
        const skew = proximity * -6
        const lift = proximity * -1.5

        character.style.setProperty('--pressure-scale', scale.toFixed(3))
        character.style.setProperty('--pressure-skew', `${skew.toFixed(2)}deg`)
        character.style.setProperty('--pressure-lift', `${lift.toFixed(2)}px`)
      })

      frameRef.current = null
    })
  }, [])

  const renderCharacters = (text, line, offset = 0) => (
    <span className={`section-prelude-line section-prelude-line-${line}`} aria-hidden="true">
      {Array.from(text).map((character, characterIndex) => {
        const refIndex = offset + characterIndex
        const visibleCharacter = character === ' ' ? '\u00a0' : character
        return (
          <span
            className="section-prelude-char"
            data-char={visibleCharacter}
            key={`${line}-${characterIndex}`}
            ref={(element) => { characterRefs.current[refIndex] = element }}
          >
            {visibleCharacter}
          </span>
        )
      })}
    </span>
  )

  return (
    <h2
      ref={titleRef}
      aria-label={`${title} ${accent}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetCharacters}
    >
      {renderCharacters(title, 'primary')}
      {renderCharacters(accent, 'accent', Array.from(title).length)}
    </h2>
  )
}

function SectionPrelude({ index, title, accent, label, summary, tone = 'dark', total = 4 }) {
  return (
    <header className={`section-prelude section-prelude-${tone}`}>
      <div className="section-prelude-title">
        <PressureTitle title={title} accent={accent} />
        <span className="section-prelude-code">CQ / {String(index + 1).padStart(3, '0')}</span>
      </div>

      <div className="section-prelude-meta">
        <span className="section-prelude-rule"><i /><ArrowDownRight size={17} /></span>
        <span>{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
        <strong>{label}</strong>
        <p>{summary}</p>
      </div>
    </header>
  )
}

export default SectionPrelude
