import { useCallback } from 'react'
import { Input } from '../ui'
import { IMPLEMENTATION_INTENTION } from '../../constants/messages'
import type { ImplementationIntention } from '../../types'
import './StepIntentions.css'

/**
 * Props pour le composant StepIntentions
 */
interface StepIntentionsProps {
  /** Valeurs actuelles de l'intention */
  intention: ImplementationIntention
  /** Callback pour mettre à jour l'intention */
  onIntentionChange: (intention: ImplementationIntention) => void
}

/**
 * StepIntentions - Étape optionnelle du wizard de création d'habitude
 *
 * Permet de définir une Implementation Intention (si-alors) :
 * - Déclencheur: "Après quoi ?"
 * - Lieu: "Où ?"
 * - Heure: "À quelle heure ?" (optionnel)
 *
 * Basé sur la recherche de Gollwitzer (1999) qui montre que définir
 * le moment et le lieu augmente les chances de succès de 2 à 3 fois.
 */
function StepIntentions({ intention, onIntentionChange }: StepIntentionsProps) {
  /**
   * Met à jour un champ de l'intention
   */
  const updateField = useCallback(
    <K extends keyof ImplementationIntention>(key: K, value: ImplementationIntention[K]) => {
      onIntentionChange({ ...intention, [key]: value })
    },
    [intention, onIntentionChange]
  )

  /**
   * Sélectionne un déclencheur suggéré
   */
  const selectSuggestedTrigger = useCallback(
    (trigger: string) => {
      updateField('trigger', trigger)
    },
    [updateField]
  )

  return (
    <div className="step-intentions">
      {/* En-tête explicatif */}
      <div className="step-intentions__header">
        <span className="step-intentions__icon" aria-hidden="true">
          🎯
        </span>
        <p className="step-intentions__subtitle">{IMPLEMENTATION_INTENTION.stepSubtitle}</p>
      </div>

      <div className="step-intentions__form">
        {/* Déclencheur */}
        <div className="step-intentions__field">
          <Input
            label={IMPLEMENTATION_INTENTION.triggerLabel}
            placeholder={IMPLEMENTATION_INTENTION.triggerPlaceholder}
            value={intention.trigger || ''}
            onChange={(e) => updateField('trigger', e.target.value)}
            hint={IMPLEMENTATION_INTENTION.triggerHelp}
          />

          {/* Suggestions de déclencheurs */}
          <div className="step-intentions__suggestions">
            {IMPLEMENTATION_INTENTION.exampleTriggers.map((trigger) => (
              <button
                key={trigger}
                type="button"
                className={`step-intentions__suggestion ${
                  intention.trigger === trigger ? 'step-intentions__suggestion--selected' : ''
                }`}
                onClick={() => selectSuggestedTrigger(trigger)}
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        {/* Lieu */}
        <div className="step-intentions__field">
          <Input
            label={IMPLEMENTATION_INTENTION.locationLabel}
            placeholder={IMPLEMENTATION_INTENTION.locationPlaceholder}
            value={intention.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            hint={IMPLEMENTATION_INTENTION.locationHelp}
          />
        </div>

        {/* Heure (optionnel) */}
        <div className="step-intentions__field">
          <Input
            type="time"
            label={IMPLEMENTATION_INTENTION.timeLabel}
            value={intention.time || ''}
            onChange={(e) => updateField('time', e.target.value)}
            hint={IMPLEMENTATION_INTENTION.timeHelp}
          />
        </div>
      </div>

      {/* Aperçu de l'intention */}
      {(intention.trigger || intention.location) && (
        <div className="step-intentions__preview">
          <p className="step-intentions__preview-label">Ton plan :</p>
          <p className="step-intentions__preview-text">
            {intention.trigger && <span>« {intention.trigger}</span>}
            {intention.trigger && intention.location && (
              <span>, je ferai cette habitude {intention.location.toLowerCase()}</span>
            )}
            {intention.trigger && !intention.location && <span>, je ferai cette habitude</span>}
            {!intention.trigger && intention.location && (
              <span>Je ferai cette habitude {intention.location.toLowerCase()}</span>
            )}
            {intention.time && <span> vers {intention.time}</span>}
            <span> »</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default StepIntentions
