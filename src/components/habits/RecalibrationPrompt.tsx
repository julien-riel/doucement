import { useState, useMemo } from 'react'
import { RECALIBRATION, randomMessage } from '../../constants/messages'
import type { ExtendedAbsenceInfo, RecalibrationLevel } from '../../utils/absence'
import { calculateRecalibrationDose } from '../../utils/absence'
import './RecalibrationPrompt.css'

/**
 * Props pour le composant RecalibrationPrompt
 */
export interface RecalibrationPromptProps {
  /** Information sur l'absence prolongée pour l'habitude */
  absenceInfo: ExtendedAbsenceInfo
  /** Callback appelé quand l'utilisateur confirme la recalibration */
  onRecalibrate: (newStartValue: number) => void
  /** Callback appelé quand l'utilisateur refuse la recalibration */
  onSkip: () => void
}

/**
 * Type pour le niveau sélectionné (peut être un niveau prédéfini ou 'custom')
 */
type SelectedLevel = RecalibrationLevel | 'custom'

/**
 * Option de niveau de recalibration avec son affichage
 */
interface LevelOption {
  level: SelectedLevel
  label: string
  description: string
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 0.5,
    label: RECALIBRATION.levelOptions.fifty,
    description: RECALIBRATION.levelOptions.fiftyDescription,
  },
  {
    level: 0.75,
    label: RECALIBRATION.levelOptions.seventyFive,
    description: RECALIBRATION.levelOptions.seventyFiveDescription,
  },
  {
    level: 1,
    label: RECALIBRATION.levelOptions.full,
    description: RECALIBRATION.levelOptions.fullDescription,
  },
  {
    level: 'custom',
    label: RECALIBRATION.levelOptions.custom,
    description: RECALIBRATION.levelOptions.customDescription,
  },
]

/**
 * RecalibrationPrompt - Modal proposant de recalibrer la dose après une absence prolongée
 *
 * Affiché quand l'utilisateur revient après 7+ jours sans check-in sur une habitude progressive.
 * La recalibration permet de reprendre à un niveau réaliste sans abandonner.
 *
 * Principes :
 * - Message bienveillant sans culpabilisation
 * - Quatre niveaux de reprise au choix (50%, 75%, 100%, personnalisé)
 * - Prévisualisation de la nouvelle dose
 * - Option de garder la dose actuelle
 */
function RecalibrationPrompt({ absenceInfo, onRecalibrate, onSkip }: RecalibrationPromptProps) {
  const { habit, currentTargetDose, lastActualValue } = absenceInfo

  // État pour le niveau sélectionné
  const [selectedLevel, setSelectedLevel] = useState<SelectedLevel>(0.75)

  // État pour la valeur personnalisée
  const [customValue, setCustomValue] = useState<string>('')

  // Message de bienvenue aléatoire
  const welcomeMessage = useMemo(() => randomMessage(RECALIBRATION.welcomeMessages), [])

  // Calcul des doses pour chaque niveau prédéfini
  const levelDoses = useMemo(() => {
    return LEVEL_OPTIONS.map((option) => ({
      ...option,
      dose:
        option.level === 'custom'
          ? null // Pas de dose prédéfinie pour custom
          : calculateRecalibrationDose(lastActualValue, currentTargetDose, option.level, habit),
    }))
  }, [lastActualValue, currentTargetDose, habit])

  // Dose pour le niveau sélectionné (ou valeur personnalisée)
  const selectedDose = useMemo(() => {
    if (selectedLevel === 'custom') {
      const parsed = parseInt(customValue, 10)
      return isNaN(parsed) || parsed < 1 ? 1 : parsed
    }
    return calculateRecalibrationDose(lastActualValue, currentTargetDose, selectedLevel, habit)
  }, [lastActualValue, currentTargetDose, selectedLevel, customValue, habit])

  // Handler pour la confirmation
  const handleConfirm = () => {
    onRecalibrate(selectedDose)
  }

  // Handler pour le changement de valeur personnalisée
  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value)
  }

  return (
    <div className="recalibration-prompt" role="dialog" aria-labelledby="recalibration-title">
      {/* Header avec icône et message */}
      <div className="recalibration-prompt__header">
        <span className="recalibration-prompt__icon" aria-hidden="true">
          🌱
        </span>
        <div className="recalibration-prompt__text">
          <h2 id="recalibration-title" className="recalibration-prompt__title">
            {RECALIBRATION.title}
          </h2>
          <p className="recalibration-prompt__welcome">{welcomeMessage}</p>
          <p className="recalibration-prompt__explanation">{RECALIBRATION.explanation}</p>
        </div>
      </div>

      {/* Information sur l'habitude */}
      <div className="recalibration-prompt__habit">
        <span className="recalibration-prompt__habit-emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <div className="recalibration-prompt__habit-info">
          <p className="recalibration-prompt__habit-name">{habit.name}</p>
          <div className="recalibration-prompt__dose-info">
            <span className="recalibration-prompt__dose-item">
              {RECALIBRATION.currentDoseLabel} :{' '}
              <span className="recalibration-prompt__dose-value">
                {currentTargetDose} {habit.unit}
              </span>
            </span>
            {lastActualValue !== null && (
              <span className="recalibration-prompt__dose-item">
                {RECALIBRATION.lastDoneLabel} :{' '}
                <span className="recalibration-prompt__dose-value">
                  {lastActualValue} {habit.unit}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sélection du niveau de reprise */}
      <div
        className="recalibration-prompt__levels"
        role="radiogroup"
        aria-label="Niveau de reprise"
      >
        {levelDoses.map(({ level, label, description, dose }) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selectedLevel === level}
            className={`recalibration-prompt__level ${
              selectedLevel === level ? 'recalibration-prompt__level--selected' : ''
            }`}
            onClick={() => setSelectedLevel(level)}
          >
            <span className="recalibration-prompt__level-radio" aria-hidden="true" />
            <div className="recalibration-prompt__level-content">
              <p className="recalibration-prompt__level-label">{label}</p>
              <p className="recalibration-prompt__level-description">{description}</p>
            </div>
            {level === 'custom' ? (
              <div className="recalibration-prompt__custom-input-wrapper">
                <input
                  type="number"
                  min="1"
                  value={customValue}
                  onChange={handleCustomValueChange}
                  onClick={(e) => e.stopPropagation()}
                  className="recalibration-prompt__custom-input"
                  placeholder="..."
                  aria-label="Valeur personnalisée"
                />
                <span className="recalibration-prompt__level-unit">{habit.unit}</span>
              </div>
            ) : (
              <span className="recalibration-prompt__level-dose">
                {dose} {habit.unit}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Prévisualisation de la nouvelle dose */}
      <div className="recalibration-prompt__preview">
        <span className="recalibration-prompt__preview-label">{RECALIBRATION.newDoseLabel} :</span>
        <span className="recalibration-prompt__preview-value">
          {selectedDose} {habit.unit}
        </span>
      </div>

      {/* Actions */}
      <div className="recalibration-prompt__actions">
        <button type="button" className="recalibration-prompt__confirm" onClick={handleConfirm}>
          {RECALIBRATION.confirmButton}
        </button>
        <button type="button" className="recalibration-prompt__skip" onClick={onSkip}>
          {RECALIBRATION.skipButton}
        </button>
      </div>
    </div>
  )
}

export default RecalibrationPrompt
