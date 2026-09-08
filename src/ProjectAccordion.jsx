import { useRef, useState } from 'react'
function ProjectAccordion({ items, onSelect }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRefs = useRef([])

  const moveFocus = (index) => {
    const nextIndex = (index + items.length) % items.length
    setActiveIndex(nextIndex)
    panelRefs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      moveFocus(items.length - 1)
    }
  }

  const handleClick = (event, index) => {
    setActiveIndex(index)
    onSelect?.(items[index], event.currentTarget)
  }

  return (
    <div className="project-accordion" aria-label="Project gallery">
      {items.map((item, index) => {
        const isActive = index === activeIndex
        const position = index < activeIndex ? 'is-before' : index > activeIndex ? 'is-after' : ''

        return (
          <button
            ref={(element) => { panelRefs.current[index] = element }}
            className={`project-accordion-panel ${isActive ? 'is-active' : ''} ${position} project-accordion-${item.id}`}
            type="button"
            key={item.id}
            aria-pressed={isActive}
            aria-label={item.label}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={(event) => handleClick(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="project-accordion-media" aria-hidden="true">
              <img src={item.image} alt="" draggable="false" />
              <span className="project-accordion-shade" />
            </span>
            <span className="project-accordion-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="project-accordion-rail-title" aria-hidden="true">{item.label}</span>
            <span className="project-accordion-label" aria-hidden="true">
              <i />
              <strong>{item.label}</strong>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default ProjectAccordion
