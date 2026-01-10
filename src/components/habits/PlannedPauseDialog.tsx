import { useState } from 'react'
import { PlannedPause } from '../../types'
import { PLANNED_PAUSE } from '../../constants/messages'
import { Button } from '../ui'
import './PlannedPauseDialog.css'

export interface PlannedPauseDialogProps {
  /** Si le dialog est ouvert */
  isOpen: boolean
  /** Callback pour fermer le dialog */
  onClose: () => void
  /** Callback quand la pause est confirmée */
  onConfirm: (pause: PlannedPause) => void
  /** Nom de l'habitude */
  habitName: string
}

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Ajoute des jours à une date
 */
function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * Dialog pour configurer une pause planifiée
 */
function PlannedPauseDialog({
  isOpen,
  onClose,
  onConfirm,
  habitName,
}: PlannedPauseDialogProps) {
  const today = getCurrentDate()
  const defaultEndDate = addDays(today, 7)

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [reason, setReason] = useState('')

  if (!isOpen) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      startDate,
      endDate,
      reason: reason.trim() || undefined,
    })
    // Reset form
    setStartDate(today)
    setEndDate(defaultEndDate)
    setReason('')
  }

  const handleReasonSelect = (selectedReason: string) => {
    setReason(selectedReason)
  }

  return (
    <div className="pause-dialog-overlay" onClick={onClose}>
      <div
        className="pause-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-dialog-title"
      >
        <header className="pause-dialog__header">
          <h2 id="pause-dialog-title" className="pause-dialog__title">
            {PLANNED_PAUSE.dialogTitle}
          </h2>
          <p className="pause-dialog__habit-name">{habitName}</p>
        </header>

        <p className="pause-dialog__description">
          {PLANNED_PAUSE.dialogDescription}
        </p>

        <form className="pause-dialog__form" onSubmit={handleSubmit}>
          <div className="pause-dialog__dates">
            <div className="pause-dialog__field">
              <label
                htmlFor="pause-start-date"
                className="pause-dialog__label"
              >
                {PLANNED_PAUSE.startDateLabel}
              </label>
              <input
                type="date"
                id="pause-start-date"
                className="pause-dialog__input"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) {
                    setEndDate(addDays(e.target.value, 7))
                  }
                }}
                required
              />
            </div>

            <div className="pause-dialog__field">
              <label htmlFor="pause-end-date" className="pause-dialog__label">
                {PLANNED_PAUSE.endDateLabel}
              </label>
              <input
                type="date"
                id="pause-end-date"
                className="pause-dialog__input"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pause-dialog__field">
            <label htmlFor="pause-reason" className="pause-dialog__label">
              {PLANNED_PAUSE.reasonLabel}
            </label>
            <div className="pause-dialog__reason-chips">
              {PLANNED_PAUSE.pauseReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`pause-dialog__chip ${reason === r ? 'pause-dialog__chip--active' : ''}`}
                  onClick={() => handleReasonSelect(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              id="pause-reason"
              className="pause-dialog__input"
              placeholder={PLANNED_PAUSE.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="pause-dialog__actions">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              {PLANNED_PAUSE.cancelButton}
            </Button>
            <Button type="submit" variant="primary">
              {PLANNED_PAUSE.confirmButton}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlannedPauseDialog
