import { useCallback, useMemo } from 'react'
import { HABIT_STACKING } from '../../constants/messages'
import type { Habit } from '../../types'
import './HabitAnchorSelector.css'

/**
 * Props pour le composant HabitAnchorSelector
 */
export interface HabitAnchorSelectorProps {
  /** Liste des habitudes disponibles pour l'ancrage */
  habits: Habit[]
  /** ID de l'habitude d'ancrage sélectionnée (optionnel) */
  selectedAnchorId?: string
  /** ID de l'habitude en cours de création/édition (pour l'exclure de la liste) */
  excludeHabitId?: string
  /** Callback appelé lors du changement de sélection */
  onAnchorChange: (anchorId: string | undefined) => void
}

/**
 * HabitAnchorSelector - Sélecteur d'habitude d'ancrage pour le Habit Stacking
 *
 * Permet de lier une nouvelle habitude à une habitude existante.
 * Basé sur le concept de "habit stacking" de James Clear qui montre
 * que lier une nouvelle habitude à une existante augmente le taux
 * de réussite de 64%.
 */
function HabitAnchorSelector({
  habits,
  selectedAnchorId,
  excludeHabitId,
  onAnchorChange,
}: HabitAnchorSelectorProps) {
  /**
   * Filtre les habitudes disponibles pour l'ancrage
   * - Exclut l'habitude en cours d'édition
   * - Exclut les habitudes archivées
   */
  const availableHabits = useMemo(() => {
    return habits.filter((habit) => habit.id !== excludeHabitId && habit.archivedAt === null)
  }, [habits, excludeHabitId])

  /**
   * Gère le changement de sélection
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value
      onAnchorChange(value === '' ? undefined : value)
    },
    [onAnchorChange]
  )

  /**
   * Supprime l'ancrage sélectionné
   */
  const handleClear = useCallback(() => {
    onAnchorChange(undefined)
  }, [onAnchorChange])

  /**
   * Trouve l'habitude d'ancrage sélectionnée
   */
  const selectedHabit = useMemo(() => {
    if (!selectedAnchorId) return null
    return habits.find((h) => h.id === selectedAnchorId) || null
  }, [habits, selectedAnchorId])

  // Pas d'habitudes disponibles pour l'ancrage
  if (availableHabits.length === 0) {
    return (
      <div className="habit-anchor-selector habit-anchor-selector--empty">
        <div className="habit-anchor-selector__header">
          <span className="habit-anchor-selector__icon" aria-hidden="true">
            🔗
          </span>
          <p className="habit-anchor-selector__subtitle">{HABIT_STACKING.selectorSubtitle}</p>
        </div>
        <p className="habit-anchor-selector__empty-message">{HABIT_STACKING.noHabitsAvailable}</p>
      </div>
    )
  }

  return (
    <div className="habit-anchor-selector">
      <div className="habit-anchor-selector__header">
        <span className="habit-anchor-selector__icon" aria-hidden="true">
          🔗
        </span>
        <p className="habit-anchor-selector__subtitle">{HABIT_STACKING.selectorSubtitle}</p>
      </div>

      <div className="habit-anchor-selector__field">
        <label htmlFor="anchor-habit-select" className="habit-anchor-selector__label">
          {HABIT_STACKING.selectorLabel}
        </label>

        <div className="habit-anchor-selector__select-wrapper">
          <select
            id="anchor-habit-select"
            className="habit-anchor-selector__select"
            value={selectedAnchorId || ''}
            onChange={handleChange}
          >
            <option value="">{HABIT_STACKING.selectorPlaceholder}</option>
            {availableHabits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.emoji} {habit.name}
              </option>
            ))}
          </select>
          <span className="habit-anchor-selector__select-arrow" aria-hidden="true">
            ▼
          </span>
        </div>

        <p className="habit-anchor-selector__help">{HABIT_STACKING.selectorHelp}</p>
      </div>

      {/* Aperçu de l'ancrage sélectionné */}
      {selectedHabit && (
        <div className="habit-anchor-selector__preview">
          <div className="habit-anchor-selector__preview-content">
            <span className="habit-anchor-selector__preview-label">
              {HABIT_STACKING.afterLabel}
            </span>
            <span className="habit-anchor-selector__preview-habit">
              {selectedHabit.emoji} {selectedHabit.name}
            </span>
          </div>
          <button
            type="button"
            className="habit-anchor-selector__clear-btn"
            onClick={handleClear}
            aria-label="Supprimer l'ancrage"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default HabitAnchorSelector
