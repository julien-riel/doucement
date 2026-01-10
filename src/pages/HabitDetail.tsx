import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { StatsCards, WeeklyCalendar, ProgressChart } from '../components/habits'
import { Button, Card } from '../components/ui'
import {
  calculateTargetDose,
  calculateHabitStats,
} from '../services/progression'
import './HabitDetail.css'

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calcule les dates pour les 7 derniers jours
 */
function getLast7Days(): { startDate: string; endDate: string } {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 6)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  }
}

/**
 * Formate une date en français
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Messages de direction
 */
function getDirectionInfo(direction: 'increase' | 'decrease' | 'maintain'): {
  label: string
  color: string
} {
  switch (direction) {
    case 'increase':
      return { label: 'Augmenter', color: 'primary' }
    case 'decrease':
      return { label: 'Réduire', color: 'secondary' }
    case 'maintain':
      return { label: 'Maintenir', color: 'neutral' }
  }
}

/**
 * Écran Détail d'une habitude
 * Stats, calendrier hebdomadaire, actions
 */
function HabitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getHabitById,
    getEntriesForHabit,
    archiveHabit,
    restoreHabit,
    isLoading,
  } = useAppData()

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const habit = id ? getHabitById(id) : undefined
  const entries = useMemo(
    () => (id ? getEntriesForHabit(id) : []),
    [id, getEntriesForHabit]
  )

  const today = getCurrentDate()
  const { startDate, endDate } = getLast7Days()

  const stats = useMemo(() => {
    if (!habit) return null
    return calculateHabitStats(habit, entries, startDate, endDate)
  }, [habit, entries, startDate, endDate])

  const todayDose = useMemo(() => {
    if (!habit) return 0
    return calculateTargetDose(habit, today)
  }, [habit, today])

  const handleBack = () => {
    navigate('/habits')
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality (5.19)
    navigate(`/habits/${id}/edit`)
  }

  const handleArchive = () => {
    if (id) {
      archiveHabit(id)
      navigate('/habits')
    }
  }

  const handleRestore = () => {
    if (id) {
      restoreHabit(id)
    }
  }

  if (isLoading) {
    return (
      <div className="page page-habit-detail page-habit-detail--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!habit) {
    return (
      <div className="page page-habit-detail page-habit-detail--not-found">
        <p>Cette habitude n'existe pas.</p>
        <Button variant="primary" onClick={handleBack}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  const isArchived = habit.archivedAt !== null
  const directionInfo = getDirectionInfo(habit.direction)

  return (
    <div className="page page-habit-detail">
      {/* Header */}
      <header className="habit-detail__header">
        <button
          type="button"
          className="habit-detail__back"
          onClick={handleBack}
          aria-label="Retour à la liste"
        >
          ← Retour
        </button>
      </header>

      {/* Hero section */}
      <section className="habit-detail__hero">
        <span className="habit-detail__emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <h1 className="habit-detail__name">{habit.name}</h1>
        {habit.description && (
          <p className="habit-detail__description">{habit.description}</p>
        )}
        <div className="habit-detail__badges">
          <span className={`habit-detail__badge habit-detail__badge--${directionInfo.color}`}>
            {directionInfo.label}
          </span>
          {isArchived && (
            <span className="habit-detail__badge habit-detail__badge--archived">
              Archivée
            </span>
          )}
        </div>
      </section>

      {/* Dose du jour */}
      <Card variant="highlight" className="habit-detail__today-dose">
        <div className="habit-detail__dose-label">Dose du jour</div>
        <div className="habit-detail__dose-value">
          {todayDose} <span className="habit-detail__dose-unit">{habit.unit}</span>
        </div>
      </Card>

      {/* Stats */}
      {stats && (
        <section className="habit-detail__section" aria-label="Statistiques">
          <h2 className="habit-detail__section-title">Cette semaine</h2>
          <StatsCards stats={stats} unit={habit.unit} />
        </section>
      )}

      {/* Graphique de progression */}
      <section className="habit-detail__section" aria-label="Graphique de progression">
        <ProgressChart habit={habit} entries={entries} referenceDate={today} />
      </section>

      {/* Calendrier */}
      <section className="habit-detail__section" aria-label="Calendrier">
        <h2 className="habit-detail__section-title">Activité récente</h2>
        <WeeklyCalendar entries={entries} referenceDate={today} direction={habit.direction} />
      </section>

      {/* Infos */}
      <section className="habit-detail__section" aria-label="Informations">
        <h2 className="habit-detail__section-title">Détails</h2>
        <Card variant="default" className="habit-detail__info-card">
          <div className="habit-detail__info-row">
            <span className="habit-detail__info-label">Valeur de départ</span>
            <span className="habit-detail__info-value">
              {habit.startValue} {habit.unit}
            </span>
          </div>
          {habit.targetValue !== undefined && (
            <div className="habit-detail__info-row">
              <span className="habit-detail__info-label">Objectif final</span>
              <span className="habit-detail__info-value">
                {habit.targetValue} {habit.unit}
              </span>
            </div>
          )}
          {habit.progression && (
            <div className="habit-detail__info-row">
              <span className="habit-detail__info-label">Progression</span>
              <span className="habit-detail__info-value">
                {habit.direction === 'decrease' ? '-' : '+'}
                {habit.progression.value}
                {habit.progression.mode === 'percentage' ? '%' : ` ${habit.unit}`}
                /{habit.progression.period === 'daily' ? 'jour' : 'semaine'}
              </span>
            </div>
          )}
          <div className="habit-detail__info-row">
            <span className="habit-detail__info-label">Créée le</span>
            <span className="habit-detail__info-value">
              {formatDate(habit.createdAt)}
            </span>
          </div>
          {habit.archivedAt && (
            <div className="habit-detail__info-row">
              <span className="habit-detail__info-label">Archivée le</span>
              <span className="habit-detail__info-value">
                {formatDate(habit.archivedAt)}
              </span>
            </div>
          )}
        </Card>
      </section>

      {/* Actions */}
      <section className="habit-detail__actions">
        {isArchived ? (
          <Button variant="primary" fullWidth onClick={handleRestore}>
            Restaurer cette habitude
          </Button>
        ) : (
          <>
            <Button variant="secondary" fullWidth onClick={handleEdit}>
              Modifier
            </Button>
            {!showArchiveConfirm ? (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowArchiveConfirm(true)}
              >
                Archiver
              </Button>
            ) : (
              <Card variant="default" className="habit-detail__confirm-archive">
                <p className="habit-detail__confirm-text">
                  Tu pourras la restaurer plus tard si tu le souhaites.
                </p>
                <div className="habit-detail__confirm-buttons">
                  <Button
                    variant="ghost"
                    onClick={() => setShowArchiveConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button variant="primary" onClick={handleArchive}>
                    Confirmer
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default HabitDetail
