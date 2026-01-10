import { HTMLAttributes, ReactNode } from 'react'
import './Card.css'

export type CardVariant = 'default' | 'elevated' | 'highlight'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante visuelle de la carte */
  variant?: CardVariant
  /** Contenu de la carte */
  children: ReactNode
  /** Padding personnalisé (utilise les spacing par défaut sinon) */
  noPadding?: boolean
}

/**
 * Composant Card réutilisable
 *
 * Variantes :
 * - default : Carte standard avec ombre légère
 * - elevated : Carte surélevée avec ombre plus prononcée
 * - highlight : Carte mise en avant avec bordure primaire
 *
 * @example
 * <Card variant="default">Contenu standard</Card>
 * <Card variant="elevated">Contenu important</Card>
 * <Card variant="highlight">Action en cours</Card>
 */
function Card({
  variant = 'default',
  noPadding = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const classNames = ['card', `card--${variant}`, noPadding && 'card--no-padding', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export default Card
