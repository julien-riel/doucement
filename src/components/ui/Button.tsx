import { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visuelle du bouton */
  variant?: ButtonVariant
  /** Taille du bouton */
  size?: ButtonSize
  /** Contenu du bouton */
  children: ReactNode
  /** Bouton en pleine largeur */
  fullWidth?: boolean
}

/**
 * Composant Button réutilisable
 *
 * Variantes :
 * - primary : Action principale (orange)
 * - secondary : Action secondaire (fond gris clair)
 * - ghost : Action tertiaire (transparent)
 * - success : Confirmation (vert)
 *
 * @example
 * <Button variant="primary">Continuer</Button>
 * <Button variant="ghost" size="small">Annuler</Button>
 */
function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    disabled && 'btn--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classNames} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button
