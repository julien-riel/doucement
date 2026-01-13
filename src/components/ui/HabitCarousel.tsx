import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  Children,
  cloneElement,
  isValidElement,
} from 'react'
import { useTranslation } from 'react-i18next'
import './HabitCarousel.css'

export interface HabitCarouselProps {
  /** Éléments à afficher dans le carrousel */
  children: ReactNode
  /** Nombre d'éléments visibles par page (desktop) */
  itemsPerViewDesktop?: number
  /** Nombre d'éléments visibles par page (mobile) */
  itemsPerViewMobile?: number
  /** Classe CSS additionnelle */
  className?: string
  /** Label pour l'accessibilité */
  ariaLabel?: string
}

/**
 * Carrousel horizontal pour les habitudes suggérées
 * - Défilement tactile sur mobile
 * - Navigation par flèches sur desktop
 * - Points de pagination
 * - Responsive (1 item mobile, 2-3 desktop)
 */
function HabitCarousel({
  children,
  itemsPerViewDesktop = 2,
  itemsPerViewMobile = 1,
  className = '',
  ariaLabel,
}: HabitCarouselProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const childrenArray = Children.toArray(children).filter(isValidElement)
  const totalItems = childrenArray.length

  // Détection responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const itemsPerView = isMobile ? itemsPerViewMobile : itemsPerViewDesktop
  const totalPages = Math.ceil(totalItems / itemsPerView)
  const currentPage = Math.floor(currentIndex / itemsPerView)

  // Navigation
  const goToPage = (page: number) => {
    const newIndex = page * itemsPerView
    setCurrentIndex(Math.min(newIndex, totalItems - itemsPerView))
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - itemsPerView))
    }
  }

  const goToNext = () => {
    if (currentIndex < totalItems - itemsPerView) {
      setCurrentIndex(Math.min(totalItems - itemsPerView, currentIndex + itemsPerView))
    }
  }

  // Gestion du swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setTranslateX(diff)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 50
    if (translateX > threshold) {
      goToPrev()
    } else if (translateX < -threshold) {
      goToNext()
    }
    setTranslateX(0)
  }

  // Gestion du swipe souris (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const diff = e.clientX - startX
    setTranslateX(diff)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 50
    if (translateX > threshold) {
      goToPrev()
    } else if (translateX < -threshold) {
      goToNext()
    }
    setTranslateX(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setTranslateX(0)
    }
  }

  // Calcul du déplacement
  const itemWidth = 100 / itemsPerView
  const baseTranslate = -(currentIndex * itemWidth)
  const dragOffset = translateX ? (translateX / (containerRef.current?.offsetWidth || 1)) * 100 : 0
  const totalTranslate = baseTranslate + dragOffset

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalItems - itemsPerView

  if (totalItems === 0) {
    return null
  }

  const effectiveAriaLabel = ariaLabel || t('carousel.habitCarouselLabel')

  return (
    <div
      className={`habit-carousel ${className}`}
      ref={containerRef}
      aria-label={effectiveAriaLabel}
      role="region"
    >
      {/* Flèche gauche (desktop) */}
      {!isMobile && totalPages > 1 && (
        <button
          className={`habit-carousel__arrow habit-carousel__arrow--prev ${!canGoPrev ? 'habit-carousel__arrow--disabled' : ''}`}
          onClick={goToPrev}
          disabled={!canGoPrev}
          aria-label={t('carousel.previous')}
        >
          ‹
        </button>
      )}

      {/* Conteneur scrollable */}
      <div
        className="habit-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`habit-carousel__track ${isDragging ? 'habit-carousel__track--dragging' : ''}`}
          ref={trackRef}
          style={{
            transform: `translateX(${totalTranslate}%)`,
          }}
        >
          {childrenArray.map((child, index) => (
            <div key={index} className="habit-carousel__item" style={{ width: `${itemWidth}%` }}>
              {cloneElement(child as React.ReactElement)}
            </div>
          ))}
        </div>
      </div>

      {/* Flèche droite (desktop) */}
      {!isMobile && totalPages > 1 && (
        <button
          className={`habit-carousel__arrow habit-carousel__arrow--next ${!canGoNext ? 'habit-carousel__arrow--disabled' : ''}`}
          onClick={goToNext}
          disabled={!canGoNext}
          aria-label={t('carousel.next')}
        >
          ›
        </button>
      )}

      {/* Points de pagination */}
      {totalPages > 1 && (
        <div
          className="habit-carousel__pagination"
          role="tablist"
          aria-label={t('carousel.pagesLabel')}
        >
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`habit-carousel__dot ${currentPage === index ? 'habit-carousel__dot--active' : ''}`}
              onClick={() => goToPage(index)}
              role="tab"
              aria-selected={currentPage === index}
              aria-label={t('carousel.pageInfo', { current: index + 1, total: totalPages })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default HabitCarousel
