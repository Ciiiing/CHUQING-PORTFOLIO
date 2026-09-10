import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import PageCurlCanvas from './PageCurlCanvas'

const ProjectPageImage = ({ page, ...props }) => (
  <picture className="project-detail-picture">
    {page?.modernImage && <source srcSet={page.modernImage} type="image/webp" />}
    <img {...props} src={page?.image} />
  </picture>
)

export default function ProjectDetailModal({ project, language = 'zh', onClose }) {
  const detail = project.detail
  const pages = detail?.brochurePages ?? detail?.bookPages ?? []
  const [pageIndex, setPageIndex] = useState(0)
  const [turn, setTurn] = useState(null)
  const panoramaRefs = useRef([])
  const modalRef = useRef(null)
  const closingRef = useRef(false)

  useEffect(() => {
    setPageIndex(0)
    setTurn(null)
  }, [project.id])

  useLayoutEffect(() => {
    const modal = modalRef.current
    if (!modal || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const target = modal.getBoundingClientRect()
    const source = project.openingRect
    const hasSource = source?.width > 0 && source?.height > 0
    const tween = gsap.fromTo(modal,
      hasSource
        ? {
            x: source.left - target.left,
            y: source.top - target.top,
            scaleX: Math.max(.08, source.width / target.width),
            scaleY: Math.max(.08, source.height / target.height),
            autoAlpha: .82,
          }
        : { scale: .9, y: 18, autoAlpha: 0 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1, duration: .68, ease: 'power4.out', transformOrigin: 'top left', overwrite: true },
    )
    return () => tween.kill()
  }, [project.id, project.openingRect])

  useEffect(() => {
    if (detail?.layout !== 'panorama-book') return
    window.requestAnimationFrame(() => {
      const second = panoramaRefs.current[1]
      if (second) second.scrollLeft = second.scrollWidth - second.clientWidth
    })
  }, [project.id, detail?.layout])

  const changePage = (direction) => {
    if (pages.length < 2) return
    if (turn) return
    const nextIndex = (pageIndex + direction + pages.length) % pages.length
    if (project.detail?.directPageSwitch) {
      setPageIndex(nextIndex)
      return
    }
    setTurn({ direction: direction > 0 ? 'next' : 'prev', nextIndex })
  }

  const bookPages = detail?.bookPages ?? []
  const panoramaPages = detail?.panoramaPages ?? []
  const localizedDetail = detail?.[language === 'en' ? 'english' : 'chinese']
  const visiblePage = turn?.direction === 'prev' ? turn.nextIndex : pageIndex
  const underPage = turn?.direction === 'prev' ? pageIndex : turn?.nextIndex
  const hasHalfCovers = project.id === 'wine'
  const pagePositionClass = hasHalfCovers && visiblePage === 0 ? ' is-cover-first' : hasHalfCovers && visiblePage === pages.length - 1 ? ' is-cover-last' : ''
  const underPositionClass = hasHalfCovers && underPage === 0 ? ' is-cover-first' : hasHalfCovers && underPage === pages.length - 1 ? ' is-cover-last' : ''
  const pageMode = (index) => index === 0 ? 'first' : index === pages.length - 1 ? 'last' : 'spread'

  const finishTurn = () => {
    if (!turn) return
    setPageIndex(turn.nextIndex)
    setTurn(null)
  }

  const handleClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    const modal = modalRef.current
    if (!modal || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    const target = modal.getBoundingClientRect()
    const source = project.openingRect
    const hasSource = source?.width > 0 && source?.height > 0
    gsap.to(modal, {
      x: hasSource ? source.left - target.left : 0,
      y: hasSource ? source.top - target.top : 14,
      scaleX: hasSource ? Math.max(.08, source.width / target.width) : .9,
      scaleY: hasSource ? Math.max(.08, source.height / target.height) : .9,
      autoAlpha: 0,
      duration: .46,
      ease: 'power3.in',
      transformOrigin: 'top left',
      overwrite: true,
      onComplete: onClose,
    })
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="project-detail-overlay" role="presentation">
      <article ref={modalRef} className={`project-detail-modal${['book', 'panorama-book'].includes(detail?.layout) ? ' is-book-detail' : ''}`} role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
        <header className="project-detail-head">
          <span>{project.id.toUpperCase()} / 04</span>
          <button type="button" className="project-detail-close" onClick={handleClose} aria-label="Close project detail"><X size={20} /></button>
        </header>

        <div className={`project-detail-scroll${detail?.layout === 'split' ? ' is-split-scroll' : ''}`}>
          {detail?.layout !== 'split' && (
            <section className={`project-detail-intro${['wine', 'pm', 'film'].includes(project.id) ? ' is-compact' : ''}`}>
              <p>{localizedDetail?.headerEyebrow ?? localizedDetail?.eyebrow ?? (language === 'en' ? 'PROJECT DETAIL' : '项目详情')}</p>
              <h1 id="project-detail-title">{localizedDetail?.headerTitle ?? localizedDetail?.title ?? project.label}</h1>
              {['book', 'panorama-book'].includes(detail?.layout) && localizedDetail?.subtitle && <span className="project-detail-book-subtitle">{localizedDetail.subtitle}</span>}
            </section>
          )}

          {detail?.layout === 'panorama-book' ? (
            <section className="project-detail-panorama-layout" aria-label="Brochure pages">
              {panoramaPages.map((src, index) => (
                <div className={`project-detail-panorama-page project-detail-panorama-page-${index + 1}`} key={src}>
                  <div className="project-detail-panorama-frame" ref={(element) => { panoramaRefs.current[index] = element }}><img src={src} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" /></div>
                </div>
              ))}
            </section>
          ) : detail?.layout === 'book' ? (
            <section className="project-detail-book-layout" aria-label="Book contents">
              <div className="project-detail-book-reader">
                <div className="project-detail-book-page-stage">
                  <ProjectPageImage
                    className={`project-detail-book-page${visiblePage === 0 ? ' is-cover-first' : visiblePage === bookPages.length - 1 ? ' is-cover-last' : ''}`}
                    page={bookPages[visiblePage]}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="project-detail-book-controls">
                  <button type="button" onClick={() => changePage(-1)} aria-label="Previous book page"><ChevronLeft size={22} /></button>
                  <div className="project-detail-book-dots" aria-label="Book pages">
                    {bookPages.map((page, index) => <span key={`${page.image}-${index}`} className={index === pageIndex ? 'is-active' : ''} />)}
                  </div>
                  <button type="button" onClick={() => changePage(1)} aria-label="Next book page"><ChevronRight size={22} /></button>
                </div>
              </div>
            </section>
          ) : detail?.layout === 'split' ? (
            <section className="project-detail-split">
                <div className="project-detail-split-media">
                <img src={detail.image} alt={localizedDetail?.title ?? project.label} loading="lazy" decoding="async" />
              </div>
              <div className="project-detail-split-copy">
                <p className="project-detail-split-eyebrow">{localizedDetail?.eyebrow}</p>
                <h1>{localizedDetail?.displayTitle ?? localizedDetail?.title ?? project.label}</h1>
                <p className="project-detail-split-disciplines">{localizedDetail?.disciplines}</p>
                <div className="project-detail-split-paragraphs">
                  {localizedDetail?.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
              </div>
            </section>
          ) : pages.length > 0 ? (
            <section className={`project-flipbook${project.id === 'film' ? ' is-cinema' : ''}`} aria-label="Project brochure">
              {turn && <ProjectPageImage className={`project-flipbook-under${underPositionClass}`} page={pages[underPage]} alt="" aria-hidden="true" loading="eager" decoding="async" />}
              {turn ? (
                <PageCurlCanvas
                  currentSrc={pages[pageIndex].modernImage || pages[pageIndex].image}
                  currentFallbackSrc={pages[pageIndex].image}
                  nextSrc={pages[turn.nextIndex].modernImage || pages[turn.nextIndex].image}
                  nextFallbackSrc={pages[turn.nextIndex].image}
                  direction={turn.direction}
                  currentMode={pageMode(pageIndex)}
                  nextMode={pageMode(turn.nextIndex)}
                  onComplete={finishTurn}
                  className={pagePositionClass}
                />
              ) : (
                <ProjectPageImage
                  className={`project-flipbook-page${pagePositionClass}`}
                  key={pages[visiblePage].modernImage || pages[visiblePage].image}
                  page={pages[visiblePage]}
                  alt={`Brochure page ${pages[visiblePage].number}`}
                  loading="eager"
                  decoding="async"
                />
              )}
              <button type="button" className="project-flipbook-arrow project-flipbook-arrow-left" onClick={() => changePage(-1)} disabled={Boolean(turn)} aria-label="Previous brochure page"><ChevronLeft size={24} /></button>
              <button type="button" className="project-flipbook-arrow project-flipbook-arrow-right" onClick={() => changePage(1)} disabled={Boolean(turn)} aria-label="Next brochure page"><ChevronRight size={24} /></button>
            </section>
          ) : (
            <div className="project-detail-cover"><img src={detail?.contentImage ?? project.image} alt="" loading="lazy" decoding="async" /></div>
          )}

          {localizedDetail && !['split', 'book', 'panorama-book'].includes(detail?.layout) ? (
            <section className="project-detail-copy">
              <div className="project-detail-lead">
                <span>{localizedDetail.title}</span>
                <p>{localizedDetail.disciplines}</p>
              </div>
              <div className="project-detail-paragraphs">
                {localizedDetail.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            </section>
          ) : !localizedDetail && !['book', 'panorama-book'].includes(detail?.layout) ? (
            <section className="project-detail-copy project-detail-empty"><p>{language === 'en' ? 'Project details are being prepared.' : '项目内容整理中。'}</p></section>
          ) : null}

          {detail?.projectLink && (
            <div className="project-detail-link-wrap">
              <a className="project-detail-link" href={detail.projectLink} target="_blank" rel="noreferrer">
                {language === 'en' ? 'VIEW THE INTERACTIVE PROJECT' : '查看交互作品'}
              </a>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
