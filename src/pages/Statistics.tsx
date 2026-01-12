import { useState, useMemo, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppData, useCelebrations } from '../hooks'
import { ErrorBanner } from '../components/ui'
import { StatsPeriod, TrendDirection } from '../types/statistics'
import { getGlobalStats, getChartData, getProjection } from '../services/statistics'
import ProgressionChart from '../components/charts/ProgressionChart'
import HeatmapCalendar from '../components/charts/HeatmapCalendar'
import ComparisonChart from '../components/charts/ComparisonChart'
import StatCard from '../components/charts/StatCard'
import ProjectionSection from '../components/charts/ProjectionSection'
import CelebrationModal from '../components/CelebrationModal'
import ExportMenu from '../components/ExportMenu'
import { getCurrentDate } from '../utils'
import './Statistics.css'

/**
 * Labels des périodes en français
 */
const PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: 'Semaine',
  month: 'Mois',
  quarter: 'Trimestre',
  year: 'Année',
  all: 'Tout',
}

/**
 * Nombre minimum de jours avec des entrées pour afficher les statistiques
 */
const MIN_ENTRIES_FOR_STATS = 3

/**
 * Calcule la direction de tendance basée sur une valeur numérique
 */
function getTrendDirection(trend: number): TrendDirection {
  if (trend > 0.1) return 'up'
  if (trend < -0.1) return 'down'
  return 'stable'
}

/**
 * Formate la valeur de tendance pour l'affichage
 */
function formatTrendValue(trend: number): string {
  const percentage = Math.round(trend * 100)
  if (percentage > 0) return `+${percentage}%`
  if (percentage < 0) return `${percentage}%`
  return '0%'
}

/**
 * Page des statistiques
 * Affiche les graphiques de progression, le calendrier heatmap et les comparaisons
 */
function Statistics() {
  const {
    activeHabits,
    data,
    isLoading,
    error,
    retryLoad,
    resetData,
    clearError,
    updatePreferences,
  } = useAppData()

  // Hook de célébrations pour détecter les jalons non encore célébrés
  const {
    currentMilestone,
    currentHabit,
    uncelebratedMilestones,
    isModalOpen,
    detectAllNewMilestones,
    showCelebration,
    closeCelebration,
  } = useCelebrations({
    initialMilestones: data.preferences.milestones,
    onMilestonesUpdate: (milestones) => updatePreferences({ milestones }),
  })

  const [period, setPeriod] = useState<StatsPeriod>('month')
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [hasDetectedMilestones, setHasDetectedMilestones] = useState(false)
  const [hasShownCelebration, setHasShownCelebration] = useState(false)

  // Ref pour le graphique (export PNG)
  const chartSectionRef = useRef<HTMLElement>(null)

  const today = getCurrentDate()

  // Statistiques globales
  const globalStats = useMemo(() => {
    return getGlobalStats(activeHabits, data.entries, period, today)
  }, [activeHabits, data.entries, period, today])

  // Habitude sélectionnée ou la première par défaut
  const selectedHabit = useMemo(() => {
    if (selectedHabitId) {
      return activeHabits.find((h) => h.id === selectedHabitId) || activeHabits[0]
    }
    return activeHabits[0]
  }, [selectedHabitId, activeHabits])

  // Données du graphique pour l'habitude sélectionnée
  const chartData = useMemo(() => {
    if (!selectedHabit) return null
    return getChartData(selectedHabit, data.entries, period, today)
  }, [selectedHabit, data.entries, period, today])

  // Projection pour l'habitude sélectionnée
  const projection = useMemo(() => {
    if (!selectedHabit) return null
    return getProjection(selectedHabit, data.entries, today)
  }, [selectedHabit, data.entries, today])

  // Statistiques de l'habitude sélectionnée
  const selectedHabitStats = useMemo(() => {
    if (!selectedHabit) return null
    return globalStats.habitStats.find((s) => s.habitId === selectedHabit.id)
  }, [selectedHabit, globalStats.habitStats])

  // Vérifie s'il y a assez de données
  const hasEnoughData = globalStats.totalActiveDays >= MIN_ENTRIES_FOR_STATS

  // Détecter les nouveaux jalons au chargement de la page
  useEffect(() => {
    if (!isLoading && !hasDetectedMilestones && activeHabits.length > 0) {
      // Détecter et ajouter les nouveaux jalons
      detectAllNewMilestones(activeHabits, data.entries)
      setHasDetectedMilestones(true)
    }
  }, [isLoading, hasDetectedMilestones, activeHabits, data.entries, detectAllNewMilestones])

  // Afficher la célébration pour le premier jalon non célébré (une seule fois par visite)
  useEffect(() => {
    if (hasDetectedMilestones && !hasShownCelebration && uncelebratedMilestones.length > 0) {
      const firstUncelebrated = uncelebratedMilestones[0]
      const habit = activeHabits.find((h) => h.id === firstUncelebrated.habitId)
      if (habit) {
        setHasShownCelebration(true)
        showCelebration(firstUncelebrated, habit)
      }
    }
  }, [
    hasDetectedMilestones,
    hasShownCelebration,
    uncelebratedMilestones,
    activeHabits,
    showCelebration,
  ])

  if (isLoading) {
    return (
      <div className="page page-statistics page-statistics--loading">
        <p>Chargement...</p>
      </div>
    )
  }

  // Redirection vers l'onboarding si pas encore complété
  if (!data.preferences.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="page page-statistics page-statistics--error">
        <ErrorBanner error={error} onRetry={retryLoad} onReset={resetData} onDismiss={clearError} />
      </div>
    )
  }

  // État vide: aucune habitude
  if (activeHabits.length === 0) {
    return (
      <div className="page page-statistics page-statistics--empty">
        <div className="statistics__empty-state">
          <span className="statistics__empty-icon" aria-hidden="true">
            📊
          </span>
          <h2 className="statistics__empty-title">Pas encore de statistiques</h2>
          <p className="statistics__empty-text">
            Créez votre première habitude pour commencer à voir vos statistiques.
          </p>
        </div>
      </div>
    )
  }

  // Pas assez de données
  if (!hasEnoughData) {
    return (
      <div className="page page-statistics page-statistics--not-enough-data">
        <header className="statistics__header">
          <h1 className="statistics__title">Mes statistiques</h1>
        </header>

        <div className="statistics__empty-state">
          <span className="statistics__empty-icon" aria-hidden="true">
            📈
          </span>
          <h2 className="statistics__empty-title">Continue encore quelques jours</h2>
          <p className="statistics__empty-text">
            Tes statistiques apparaîtront après {MIN_ENTRIES_FOR_STATS} jours d'activité.
            <br />
            Tu en es à {globalStats.totalActiveDays} jour
            {globalStats.totalActiveDays > 1 ? 's' : ''}.
          </p>
        </div>

        {/* Modale de célébration (même avec peu de données) */}
        {currentMilestone && currentHabit && (
          <CelebrationModal
            isOpen={isModalOpen}
            onClose={closeCelebration}
            milestone={currentMilestone}
            habitName={currentHabit.name}
            habitEmoji={currentHabit.emoji}
          />
        )}
      </div>
    )
  }

  return (
    <div className="page page-statistics">
      <header className="statistics__header">
        <h1 className="statistics__title">Mes statistiques</h1>

        {/* Sélecteur de période */}
        <div
          className="statistics__period-selector"
          role="tablist"
          aria-label="Période d'affichage"
        >
          {(['week', 'month', 'quarter', 'year', 'all'] as StatsPeriod[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              className={`statistics__period-button ${period === p ? 'statistics__period-button--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </header>

      {/* Cartes de statistiques globales */}
      <section className="statistics__stat-cards" aria-label="Résumé statistique">
        <StatCard
          label="Moyenne"
          value={Math.round(globalStats.averageCompletion)}
          unit="%"
          trend={selectedHabitStats ? getTrendDirection(selectedHabitStats.weeklyTrend) : 'stable'}
          trendValue={
            selectedHabitStats ? formatTrendValue(selectedHabitStats.weeklyTrend) : undefined
          }
        />
        <StatCard label="Jours actifs" value={globalStats.totalActiveDays} unit="j" />
        <StatCard label="Habitudes" value={globalStats.totalHabits} />
        {selectedHabitStats && (
          <StatCard
            label="Série"
            value={selectedHabitStats.currentStreak}
            unit="j"
            trend={
              selectedHabitStats.currentStreak >= selectedHabitStats.bestStreak ? 'up' : 'stable'
            }
            trendValue={
              selectedHabitStats.currentStreak >= selectedHabitStats.bestStreak &&
              selectedHabitStats.bestStreak > 0
                ? 'Record !'
                : undefined
            }
          />
        )}
      </section>

      {/* Sélecteur d'habitude */}
      <section className="statistics__habit-selector">
        <label htmlFor="habit-select" className="statistics__habit-label">
          Habitude :
        </label>
        <select
          id="habit-select"
          className="statistics__habit-select"
          value={selectedHabit?.id || ''}
          onChange={(e) => setSelectedHabitId(e.target.value)}
        >
          {activeHabits.map((habit) => (
            <option key={habit.id} value={habit.id}>
              {habit.emoji} {habit.name}
            </option>
          ))}
        </select>
      </section>

      {/* Graphique de progression */}
      {chartData && (
        <section
          ref={chartSectionRef}
          className="statistics__chart-section"
          aria-label="Graphique de progression"
        >
          <ProgressionChart data={chartData} period={period} showProjection={true} />
        </section>
      )}

      {/* Bouton d'export */}
      <section className="statistics__export-section">
        <ExportMenu
          chartRef={chartSectionRef}
          habits={activeHabits}
          entries={data.entries}
          period={period}
        />
      </section>

      {/* Calendrier heatmap */}
      {selectedHabit && (
        <section className="statistics__heatmap-section" aria-label="Calendrier de progression">
          <HeatmapCalendar
            habit={selectedHabit}
            entries={data.entries}
            monthsToShow={period === 'week' ? 1 : period === 'month' ? 2 : 3}
          />
        </section>
      )}

      {/* Section Projection */}
      {projection && selectedHabit?.targetValue && (
        <ProjectionSection projection={projection} habit={selectedHabit} />
      )}

      {/* Graphique de comparaison (si plusieurs habitudes) */}
      {activeHabits.length > 1 && (
        <section className="statistics__comparison-section" aria-label="Comparaison des habitudes">
          <h2 className="statistics__section-title">Comparaison</h2>
          <ComparisonChart
            habits={activeHabits}
            entries={data.entries}
            period={period}
            normalized={true}
          />
        </section>
      )}

      {/* Modale de célébration */}
      {currentMilestone && currentHabit && (
        <CelebrationModal
          isOpen={isModalOpen}
          onClose={closeCelebration}
          milestone={currentMilestone}
          habitName={currentHabit.name}
          habitEmoji={currentHabit.emoji}
        />
      )}
    </div>
  )
}

export default Statistics
