/**
 * EditHabit - Habit modification page
 * Main entry point that orchestrates the form sections
 *
 * This is the refactored version that uses context for state management
 * and separate components for each form section.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../../hooks'
import { Button } from '../../components/ui'
import { EditHabitProvider, useEditHabitContext } from './EditHabitContext'
import {
  BasicInfoSection,
  DirectionSection,
  FrequencySection,
  TrackingSection,
  ProgressionSection,
  IntentionSection,
  IdentitySection,
} from './sections'
import '../EditHabit.css'

/**
 * Inner component that consumes the context
 */
function EditHabitInner() {
  const { habit, isValid, hasChanges, isSaving, handleSave, handleCancel } = useEditHabitContext()

  return (
    <div className="page page-edit-habit">
      <header className="edit-habit__header">
        <button
          type="button"
          className="edit-habit__back"
          onClick={handleCancel}
          aria-label="Annuler et retourner"
        >
          ← Annuler
        </button>
        <h1 className="edit-habit__title">Modifier l'habitude</h1>
      </header>

      <div className="edit-habit__form">
        {/* Basic information: emoji, name, unit, description, time of day */}
        <BasicInfoSection />

        {/* Habit direction: increase, decrease, maintain */}
        <DirectionSection />

        {/* Start value info card (read-only) */}
        <div className="edit-habit__info-card card card--default">
          <div className="edit-habit__info-row">
            <span className="edit-habit__info-label">Valeur de départ</span>
            <span className="edit-habit__info-value edit-habit__info-value--readonly">
              {habit.startValue} {habit.unit}
            </span>
          </div>
          <p className="edit-habit__info-note">
            Cette valeur ne peut pas être modifiée pour préserver ton historique.
          </p>
        </div>

        {/* Tracking frequency: daily vs weekly */}
        <FrequencySection />

        {/* Tracking mode and entry mode */}
        <TrackingSection />

        {/* Progression settings (not for maintain) */}
        <ProgressionSection />

        {/* Implementation intention: trigger, location, time, anchor habit */}
        <IntentionSection />

        {/* Identity statement */}
        <IdentitySection />
      </div>

      {/* Footer with buttons */}
      <footer className="edit-habit__footer">
        <div className="edit-habit__buttons">
          <Button variant="ghost" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={!isValid || !hasChanges || isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

/**
 * EditHabit page component
 * Handles loading states and wraps the inner component with the context provider
 */
function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getHabitById, isLoading } = useAppData()

  const habit = id ? getHabitById(id) : undefined

  if (isLoading) {
    return (
      <div className="page page-edit-habit page-edit-habit--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="page page-edit-habit page-edit-habit--not-found">
        <p>Cette habitude n'existe pas.</p>
        <Button variant="primary" onClick={() => navigate('/habits')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  return (
    <EditHabitProvider habit={habit}>
      <EditHabitInner />
    </EditHabitProvider>
  )
}

export default EditHabit
