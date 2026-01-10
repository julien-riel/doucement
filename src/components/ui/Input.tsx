import { InputHTMLAttributes, forwardRef, useId } from 'react'
import './Input.css'

export type InputType = 'text' | 'number' | 'email'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Type d'input */
  type?: InputType
  /** Label affiché au-dessus du champ */
  label?: string
  /** Message d'erreur affiché en dessous */
  error?: string
  /** Texte d'aide affiché en dessous (si pas d'erreur) */
  hint?: string
}

/**
 * Composant Input réutilisable
 *
 * Types supportés :
 * - text : Texte libre
 * - number : Valeurs numériques
 * - email : Adresse email
 *
 * @example
 * <Input label="Nom de l'habitude" placeholder="Ex: Méditation" />
 * <Input type="number" label="Valeur de départ" min={1} />
 * <Input label="Email" error="Format invalide" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', label, error, hint, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId()
    const id = providedId || generatedId
    const hasError = Boolean(error)

    const inputClassNames = [
      'input',
      hasError && 'input--error',
      props.disabled && 'input--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={id} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={inputClassNames}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${id}-error`} className="input-error" role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${id}-hint`} className="input-hint">
            {hint}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
