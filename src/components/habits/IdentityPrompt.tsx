import { useCallback } from 'react'
import { Input } from '../ui'
import { IDENTITY_STATEMENT } from '../../constants/messages'
import './IdentityPrompt.css'

/**
 * Props pour le composant IdentityPrompt
 */
interface IdentityPromptProps {
  /** Valeur actuelle de la déclaration d'identité */
  identityStatement: string
  /** Callback pour mettre à jour la déclaration */
  onIdentityChange: (statement: string) => void
}

/**
 * IdentityPrompt - Étape optionnelle du wizard de création d'habitude
 *
 * Permet de définir une déclaration d'identité :
 * "Je deviens quelqu'un qui [description]"
 *
 * Basé sur la recherche d'Atomic Habits : le changement durable vient
 * du changement d'identité, pas seulement du comportement.
 */
function IdentityPrompt({ identityStatement, onIdentityChange }: IdentityPromptProps) {
  /**
   * Sélectionne un exemple suggéré
   */
  const selectExample = useCallback(
    (example: string) => {
      onIdentityChange(example)
    },
    [onIdentityChange]
  )

  return (
    <div className="identity-prompt">
      {/* En-tête explicatif */}
      <div className="identity-prompt__header">
        <span className="identity-prompt__icon" aria-hidden="true">
          🌱
        </span>
        <p className="identity-prompt__subtitle">{IDENTITY_STATEMENT.stepSubtitle}</p>
      </div>

      <div className="identity-prompt__form">
        {/* Champ de saisie */}
        <div className="identity-prompt__field">
          <Input
            label={IDENTITY_STATEMENT.inputLabel}
            placeholder={IDENTITY_STATEMENT.inputPlaceholder}
            value={identityStatement}
            onChange={(e) => onIdentityChange(e.target.value)}
            hint={IDENTITY_STATEMENT.inputHelp}
          />

          {/* Suggestions d'exemples */}
          <div className="identity-prompt__suggestions">
            {IDENTITY_STATEMENT.exampleStatements.map((example) => (
              <button
                key={example}
                type="button"
                className={`identity-prompt__suggestion ${
                  identityStatement === example ? 'identity-prompt__suggestion--selected' : ''
                }`}
                onClick={() => selectExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aperçu de l'identité */}
      {identityStatement && (
        <div className="identity-prompt__preview">
          <p className="identity-prompt__preview-label">Ton identité :</p>
          <p className="identity-prompt__preview-text">
            « Je deviens quelqu'un qui {identityStatement} »
          </p>
        </div>
      )}
    </div>
  )
}

export default IdentityPrompt
