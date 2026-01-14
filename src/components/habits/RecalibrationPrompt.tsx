/**
 * RecalibrationPrompt - Component for recalibrating habit baseline
 *
 * Shown when a user has been exceeding their targets consistently.
 * Offers options to raise the baseline by different amounts (50%, 75%, 100%).
 * Uses encouraging, non-judgmental language.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import Card from '../ui/Card'
import type { Habit, RecalibrationRecord } from '../../types'
import { getCurrentDate } from '../../utils'
import './RecalibrationPrompt.css'

export interface RecalibrationPromptProps {
  /** The habit to recalibrate */
  habit: Habit
  /** Current target dose */
  currentTargetDose: number
  /** Callback when recalibration is applied */
  onRecalibrate: (newStartValue: number, record: RecalibrationRecord) => void
  /** Callback when user dismisses the prompt */
  onDismiss: () => void
}

/**
 * Recalibration level options
 */
interface RecalibrationLevel {
  /** Level multiplier (0.5 = 50%, 0.75 = 75%, 1 = 100%) */
  level: number
  /** Translation key for the label */
  labelKey: string
  /** Translation key for the description */
  descKey: string
}

const RECALIBRATION_LEVELS: RecalibrationLevel[] = [
  {
    level: 0.5,
    labelKey: 'recalibration.levels.gentle.label',
    descKey: 'recalibration.levels.gentle.desc',
  },
  {
    level: 0.75,
    labelKey: 'recalibration.levels.balanced.label',
    descKey: 'recalibration.levels.balanced.desc',
  },
  {
    level: 1,
    labelKey: 'recalibration.levels.ambitious.label',
    descKey: 'recalibration.levels.ambitious.desc',
  },
]

/**
 * Calculate the new start value based on recalibration level
 */
function calculateNewStartValue(
  currentStartValue: number,
  currentTargetDose: number,
  level: number
): number {
  const difference = currentTargetDose - currentStartValue
  const adjustment = difference * level
  return Math.round(currentStartValue + adjustment)
}

/**
 * RecalibrationPrompt - Offers options to recalibrate a habit's baseline
 */
function RecalibrationPrompt({
  habit,
  currentTargetDose,
  onRecalibrate,
  onDismiss,
}: RecalibrationPromptProps) {
  const { t } = useTranslation()
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level)
    setIsConfirming(true)
  }

  const handleConfirm = () => {
    if (selectedLevel === null) return

    const newStartValue = calculateNewStartValue(habit.startValue, currentTargetDose, selectedLevel)
    const today = getCurrentDate()

    const record: RecalibrationRecord = {
      date: today,
      previousStartValue: habit.startValue,
      newStartValue,
      previousStartDate: habit.createdAt,
      level: selectedLevel,
    }

    onRecalibrate(newStartValue, record)
  }

  const handleCancel = () => {
    setSelectedLevel(null)
    setIsConfirming(false)
  }

  // Preview the new start values for each level
  const levelPreviews = RECALIBRATION_LEVELS.map((lvl) => ({
    ...lvl,
    newValue: calculateNewStartValue(habit.startValue, currentTargetDose, lvl.level),
  }))

  const selectedLevelInfo = selectedLevel
    ? levelPreviews.find((l) => l.level === selectedLevel)
    : null

  return (
    <Card variant="highlight" className="recalibration-prompt">
      <div className="recalibration-prompt__header">
        <span className="recalibration-prompt__emoji" aria-hidden="true">
          🎉
        </span>
        <div className="recalibration-prompt__title-group">
          <h3 className="recalibration-prompt__title">{t('recalibration.title')}</h3>
          <p className="recalibration-prompt__subtitle">{t('recalibration.subtitle')}</p>
        </div>
      </div>

      {!isConfirming ? (
        <>
          <p className="recalibration-prompt__description">{t('recalibration.description')}</p>

          <div className="recalibration-prompt__levels">
            {levelPreviews.map((level) => (
              <button
                key={level.level}
                type="button"
                className="recalibration-prompt__level-btn"
                onClick={() => handleLevelSelect(level.level)}
              >
                <span className="recalibration-prompt__level-label">{t(level.labelKey)}</span>
                <span className="recalibration-prompt__level-value">
                  {level.newValue} {habit.unit}
                </span>
                <span className="recalibration-prompt__level-desc">{t(level.descKey)}</span>
              </button>
            ))}
          </div>

          <button type="button" className="recalibration-prompt__dismiss" onClick={onDismiss}>
            {t('recalibration.dismiss')}
          </button>
        </>
      ) : (
        <div className="recalibration-prompt__confirm">
          <p className="recalibration-prompt__confirm-text">
            {t('recalibration.confirmMessage', {
              oldValue: habit.startValue,
              newValue: selectedLevelInfo?.newValue,
              unit: habit.unit,
            })}
          </p>

          <div className="recalibration-prompt__confirm-actions">
            <Button variant="ghost" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button variant="success" onClick={handleConfirm}>
              {t('recalibration.confirm')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default RecalibrationPrompt
