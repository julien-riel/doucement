import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { HabitListItem, EmptyState } from '../components/habits'
import Button from '../components/ui/Button'
import './HabitList.css'

/**
 * Écran Liste des habitudes
 * Affiche toutes les habitudes actives et archivées
 */
function HabitList() {
  const navigate = useNavigate()
  const { activeHabits, archivedHabits, isLoading, getEntriesForHabit, restoreHabit } = useAppData()

  const [showArchived, setShowArchived] = useState(true)

  // Trier les habitudes par date de création (plus récentes en premier)
  const sortedActiveHabits = useMemo(
    () => [...activeHabits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activeHabits]
  )

  const sortedArchivedHabits = useMemo(
    () =>
      [...archivedHabits].sort((a, b) => (b.archivedAt || '').localeCompare(a.archivedAt || '')),
    [archivedHabits]
  )

  const handleHabitClick = (habitId: string) => {
    navigate(`/habits/${habitId}`)
  }

  const handleRestoreHabit = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    restoreHabit(habitId)
  }

  const handleCreateHabit = () => {
    navigate('/create')
  }

  const toggleShowArchived = () => {
    setShowArchived((prev) => !prev)
  }

  if (isLoading) {
    return (
      <div className="page page-habit-list page-habit-list--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  // État vide: aucune habitude
  if (activeHabits.length === 0 && archivedHabits.length === 0) {
    return (
      <div className="page page-habit-list page-habit-list--empty">
        <EmptyState variant="habits" />
      </div>
    )
  }

  return (
    <div className="page page-habit-list">
      <header className="habit-list__header">
        <h1 className="habit-list__title">Mes habitudes</h1>
        <Button variant="primary" onClick={handleCreateHabit}>
          + Nouvelle habitude
        </Button>
      </header>

      {/* Habitudes actives */}
      <section className="habit-list__section" aria-label="Habitudes actives">
        <h2 className="habit-list__section-title">Actives ({sortedActiveHabits.length})</h2>
        {sortedActiveHabits.length > 0 ? (
          <div className="habit-list__items">
            {sortedActiveHabits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                entries={getEntriesForHabit(habit.id)}
                onClick={handleHabitClick}
              />
            ))}
          </div>
        ) : (
          <p className="habit-list__empty-message">Aucune habitude active pour le moment.</p>
        )}
      </section>

      {/* Section archivées */}
      {archivedHabits.length > 0 && (
        <section
          className="habit-list__section habit-list__section--archived"
          aria-label="Habitudes archivées"
        >
          <button
            type="button"
            className="habit-list__archived-toggle"
            onClick={toggleShowArchived}
            aria-expanded={showArchived}
          >
            <h2 className="habit-list__section-title">Archivées ({sortedArchivedHabits.length})</h2>
            <span className="habit-list__toggle-icon" aria-hidden="true">
              {showArchived ? '▼' : '▶'}
            </span>
          </button>

          {showArchived && (
            <div className="habit-list__items habit-list__items--archived">
              {sortedArchivedHabits.map((habit) => (
                <div key={habit.id} className="habit-list__archived-item">
                  <HabitListItem
                    habit={habit}
                    entries={getEntriesForHabit(habit.id)}
                    onClick={handleHabitClick}
                  />
                  <Button
                    variant="ghost"
                    size="small"
                    className="habit-list__restore-button"
                    onClick={(e) => handleRestoreHabit(habit.id, e)}
                    aria-label={`Restaurer ${habit.name}`}
                  >
                    Restaurer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default HabitList
