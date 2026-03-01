/**
 * RestartSection - "Nouveau départ" section in EditHabit
 * Allows users to restart a habit from a new start value while preserving history
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../../../hooks'
import { Button, Input, Card } from '../../../components/ui'
import { useEditHabitContext } from '../EditHabitContext'

export function RestartSection() {
  const { t } = useTranslation()
  const { habit } = useEditHabitContext()
  const { restartHabit } = useAppData()
  const navigate = useNavigate()

  const [newStartValue, setNewStartValue] = useState<string>('')
  const [reason, setReason] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Don't show for maintain habits (no progression to restart)
  if (habit.direction === 'maintain') {
    return null
  }

  const parsedValue = Number(newStartValue)
  const isValidValue = newStartValue !== '' && !isNaN(parsedValue) && parsedValue > 0

  const handleConfirm = () => {
    if (!isValidValue) return

    const success = restartHabit(habit.id, parsedValue, reason.trim() || undefined)
    if (success) {
      navigate(`/habits/${habit.id}`)
    }
  }

  return (
    <div className="edit-habit__restart-section">
      <p className="edit-habit__field-label">{t('restart.title')}</p>
      <p className="edit-habit__restart-encouragement">{t('restart.encouragement')}</p>

      {/* Current value (read-only) */}
      <div className="edit-habit__info-card card card--default">
        <div className="edit-habit__info-row">
          <span className="edit-habit__info-label">{t('restart.currentValue')}</span>
          <span className="edit-habit__info-value edit-habit__info-value--readonly">
            {habit.startValue} {habit.unit}
          </span>
        </div>
      </div>

      {/* New start value input */}
      <Input
        type="number"
        label={t('restart.newValueLabel')}
        placeholder={t('restart.newValuePlaceholder')}
        min={1}
        value={newStartValue}
        onChange={(e) => {
          setNewStartValue(e.target.value)
          setShowConfirm(false)
        }}
        hint={t('restart.newValueHint')}
      />

      {/* Optional reason */}
      <Input
        type="text"
        label={t('restart.reasonLabel')}
        placeholder={t('restart.reasonPlaceholder')}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        hint={t('restart.reasonHint')}
      />

      {/* Restart button or confirmation */}
      {!showConfirm ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={!isValidValue}
          onClick={() => setShowConfirm(true)}
        >
          {t('restart.button')}
        </Button>
      ) : (
        <Card variant="default" className="edit-habit__restart-confirm">
          <p className="edit-habit__restart-confirm-text">
            {t('restart.confirmMessage', {
              oldValue: habit.startValue,
              newValue: parsedValue,
              unit: habit.unit,
            })}
          </p>
          <div className="edit-habit__restart-confirm-buttons">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              {t('common.confirm')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
