/**
 * IdentitySection - Identity statement
 * Handles: identity statement input with suggestions and preview
 */

import { Input } from '../../../components/ui'
import { IDENTITY_STATEMENT } from '../../../constants/messages'
import { useEditHabitContext } from '../EditHabitContext'

export function IdentitySection() {
  const { form, updateField } = useEditHabitContext()

  return (
    <div className="edit-habit__identity-section">
      <p className="edit-habit__field-label">{IDENTITY_STATEMENT.stepTitle}</p>
      <p className="edit-habit__field-hint">{IDENTITY_STATEMENT.stepSubtitle}</p>

      <Input
        label={IDENTITY_STATEMENT.inputLabel}
        placeholder={IDENTITY_STATEMENT.inputPlaceholder}
        value={form.identityStatement}
        onChange={(e) => updateField('identityStatement', e.target.value)}
        hint={IDENTITY_STATEMENT.inputHelp}
      />

      {/* Suggestions d'exemples */}
      <div className="edit-habit__identity-suggestions">
        {IDENTITY_STATEMENT.exampleStatements.map((example) => (
          <button
            key={example}
            type="button"
            className={`edit-habit__identity-suggestion ${
              form.identityStatement === example ? 'edit-habit__identity-suggestion--selected' : ''
            }`}
            onClick={() => updateField('identityStatement', example)}
          >
            {example}
          </button>
        ))}
      </div>

      {/* Aperçu de l'identité */}
      {form.identityStatement && (
        <div className="edit-habit__identity-preview">
          <p className="edit-habit__identity-preview-label">Ton identité :</p>
          <p className="edit-habit__identity-preview-text">
            « Je deviens quelqu'un qui {form.identityStatement} »
          </p>
        </div>
      )}
    </div>
  )
}
