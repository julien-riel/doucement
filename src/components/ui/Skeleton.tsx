import './Skeleton.css'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card'

export interface SkeletonProps {
  /** Variante visuelle du skeleton */
  variant?: SkeletonVariant
  /** Largeur (valeur CSS) */
  width?: string | number
  /** Hauteur (valeur CSS) */
  height?: string | number
  /** Nombre de lignes pour variant="text" */
  lines?: number
  /** Classe CSS additionnelle */
  className?: string
}

/**
 * Composant Skeleton pour afficher un placeholder de chargement
 *
 * Suit le design system "Soft Organic" avec une animation pulse douce
 * et des coins arrondis conformes aux tokens du système.
 *
 * @example
 * <Skeleton variant="text" lines={3} />
 * <Skeleton variant="card" height={120} />
 * <Skeleton variant="circular" width={48} height={48} />
 */
function Skeleton({ variant = 'text', width, height, lines = 1, className = '' }: SkeletonProps) {
  const baseClass = `skeleton skeleton--${variant}`
  const classes = [baseClass, className].filter(Boolean).join(' ')

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-lines" role="status" aria-label="Chargement...">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={classes}
            style={{
              ...style,
              // Last line is shorter for natural text appearance
              width: index === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    )
  }

  return <div className={classes} style={style} role="status" aria-label="Chargement..." />
}

export default Skeleton
