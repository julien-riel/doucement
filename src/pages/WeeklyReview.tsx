import { useMemo, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../hooks'
import { Card, Button } from '../components/ui'
import { WeeklyReflectionInput, PatternInsights, WeeklyProgressSummary } from '../components/habits'
import {
  calculateHabitStats,
  calculateDailyCompletionPercentage,
  HabitStats,
} from '../services/progression'
import { getWeeklyMessage } from '../constants/messages'
import { analyzeGlobalPatterns } from '../utils/patternAnalysis'
import { getCurrentDate, addDays } from '../utils'
import './WeeklyReview.css'

/**
 * Calcule les dates de la semaine écoulée (lundi à dimanche)
 */
function getWeekDates(): { startDate: string; endDate: string; dates: string[] } {
  const today = getCurrentDate()
  const [year, month, day] = today.split('-').map(Number)
  const todayDate = new Date(year, month - 1, day)
  const dayOfWeek = todayDate.getDay()
  // Ajuster pour que lundi = 0
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const mondayStr = addDays(today, -adjustedDay)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(mondayStr, i))
  }

  return {
    startDate: dates[0],
    endDate: dates[6],
    dates,
  }
}

/**
 * Parse une date YYYY-MM-DD en date locale
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formate une plage de dates selon la locale active
 */
function formatDateRange(startDate: string, endDate: string, locale: string): string {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)

  const startDay = start.getDate()
  const endDay = end.getDate()
  const month = end.toLocaleDateString(locale, { month: 'long' })

  return `${startDay} - ${endDay} ${month}`
}

/**
 * Calcule l'identifiant de la semaine (format ISO: YYYY-Www)
 */
function getWeekId(date: string): string {
  const d = parseLocalDate(date)
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  const weekNumber = Math.ceil((dayOfYear + new Date(d.getFullYear(), 0, 1).getDay()) / 7)
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Calcule les statistiques globales de la semaine pour toutes les habitudes
 */
interface WeeklyStats {
  totalActiveDays: number
  totalCompletedDays: number
  averageCompletion: number
  habitStats: Map<string, HabitStats>
}

/**
 * Écran Revue hebdomadaire
 * Bilan de la semaine avec récapitulatif des habitudes et encouragements
 */
function WeeklyReview() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { activeHabits, data, updatePreferences, isLoading } = useAppData()

  const today = getCurrentDate()
  const { startDate, endDate, dates } = useMemo(() => getWeekDates(), [])
  const weekId = useMemo(() => getWeekId(today), [today])

  // State for reflection section
  const [reflectionDismissed, setReflectionDismissed] = useState(false)

  // Get existing reflection for this week
  const existingReflection = useMemo(() => {
    return data.preferences.weeklyReflections?.find((r) => r.week === weekId)?.text
  }, [data.preferences.weeklyReflections, weekId])

  // Save weekly reflection
  const handleSaveReflection = useCallback(
    (text: string) => {
      const reflections = data.preferences.weeklyReflections ?? []
      const existingIndex = reflections.findIndex((r) => r.week === weekId)
      const newReflection = {
        week: weekId,
        text,
        createdAt: new Date().toISOString(),
      }

      const updatedReflections =
        existingIndex >= 0
          ? reflections.map((r, i) => (i === existingIndex ? newReflection : r))
          : [...reflections, newReflection]

      updatePreferences({ weeklyReflections: updatedReflections })
    },
    [data.preferences.weeklyReflections, weekId, updatePreferences]
  )

  const handleSkipReflection = useCallback(() => {
    setReflectionDismissed(true)
  }, [])

  // Marquer la revue hebdomadaire comme effectuée
  useEffect(() => {
    if (!isLoading) {
      updatePreferences({ lastWeeklyReviewDate: today })
    }
  }, [isLoading, today, updatePreferences])

  // Calculer les statistiques par habitude
  const weeklyStats = useMemo((): WeeklyStats => {
    const habitStats = new Map<string, HabitStats>()

    for (const habit of activeHabits) {
      const entries = data.entries.filter((e) => e.habitId === habit.id)
      const stats = calculateHabitStats(habit, entries, startDate, endDate)
      habitStats.set(habit.id, stats)
    }

    // Calculer le pourcentage de complétion quotidien
    const dailyCompletions = dates.map((date) => {
      const entriesForDate = data.entries.filter((e) => e.date === date)
      return calculateDailyCompletionPercentage(entriesForDate, activeHabits, date)
    })

    // Jours actifs = jours avec au moins une entrée
    const daysWithEntries = dates.filter((date) =>
      data.entries.some((e) => e.date === date && activeHabits.some((h) => h.id === e.habitId))
    ).length

    // Jours complétés = complétion >= 70%
    const completedDays = dailyCompletions.filter((c) => c >= 70).length

    // Moyenne de complétion
    const totalCompletion = dailyCompletions.reduce((sum, c) => sum + c, 0)
    const averageCompletion =
      dailyCompletions.length > 0 ? totalCompletion / dailyCompletions.length : 0

    return {
      totalActiveDays: daysWithEntries,
      totalCompletedDays: completedDays,
      averageCompletion: Math.round(averageCompletion),
      habitStats,
    }
  }, [activeHabits, data.entries, startDate, endDate, dates])

  // Message d'encouragement basé sur la performance
  const encouragingMessage = useMemo(() => {
    const ratio = activeHabits.length > 0 ? weeklyStats.totalActiveDays / 7 : 0
    return getWeeklyMessage(ratio)
  }, [weeklyStats.totalActiveDays, activeHabits.length])

  // Analyse des patterns
  const patternAnalysis = useMemo(
    () => analyzeGlobalPatterns(activeHabits, data.entries),
    [activeHabits, data.entries]
  )

  const handleContinue = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="page page-weekly-review page-weekly-review--loading">
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (activeHabits.length === 0) {
    return (
      <div className="page page-weekly-review page-weekly-review--empty">
        <div className="weekly-review__empty">
          <span className="weekly-review__empty-emoji" aria-hidden="true">
            📊
          </span>
          <h1>{t('weeklyReview.noHabits.title')}</h1>
          <p>{t('weeklyReview.noHabits.description')}</p>
          <Button variant="primary" onClick={() => navigate('/create')}>
            {t('weeklyReview.noHabits.createHabit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-weekly-review">
      {/* Header */}
      <header className="weekly-review__header">
        <h1 className="weekly-review__title">{t('weeklyReview.title')}</h1>
        <p className="weekly-review__subtitle">
          {formatDateRange(startDate, endDate, i18n.language)}
        </p>
      </header>

      {/* Message d'encouragement */}
      <section className="weekly-review__section">
        <Card variant="highlight" className="weekly-review__message">
          <span className="weekly-review__message-emoji" aria-hidden="true">
            🌱
          </span>
          <p className="weekly-review__message-text">{encouragingMessage}</p>
        </Card>
      </section>

      {/* Rappel des identités */}
      {activeHabits.some((h) => h.identityStatement) && (
        <section className="weekly-review__section" aria-label={t('weeklyReview.identityReminder')}>
          <h2 className="weekly-review__section-title">{t('weeklyReview.identityReminder')}</h2>
          <div className="weekly-review__identities">
            {activeHabits
              .filter((h) => h.identityStatement)
              .map((habit) => (
                <Card key={habit.id} variant="default" className="weekly-review__identity-card">
                  <span className="weekly-review__identity-emoji" aria-hidden="true">
                    {habit.emoji}
                  </span>
                  <p className="weekly-review__identity-text">
                    {t('weeklyReview.identityStatement', { statement: habit.identityStatement })}
                  </p>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Statistiques globales */}
      <section className="weekly-review__section" aria-label={t('weeklyReview.stats.completion')}>
        <div className="weekly-review__global-stats">
          <Card
            variant="elevated"
            className="weekly-review__stat-card weekly-review__stat-card--main"
          >
            <div className="weekly-review__stat-value">{weeklyStats.averageCompletion}%</div>
            <div className="weekly-review__stat-label">{t('weeklyReview.stats.completion')}</div>
          </Card>

          <div className="weekly-review__stat-row">
            <Card variant="default" className="weekly-review__stat-card">
              <div className="weekly-review__stat-value">{weeklyStats.totalActiveDays}</div>
              <div className="weekly-review__stat-label">{t('weeklyReview.stats.activeDays')}</div>
            </Card>

            <Card variant="default" className="weekly-review__stat-card">
              <div className="weekly-review__stat-value">{weeklyStats.totalCompletedDays}</div>
              <div className="weekly-review__stat-label">
                {t('weeklyReview.stats.completedDays')}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Calendrier de la semaine */}
      <section className="weekly-review__section" aria-label={t('weeklyReview.sections.activity')}>
        <h2 className="weekly-review__section-title">{t('weeklyReview.sections.activity')}</h2>
        <div className="weekly-review__calendar-wrapper">
          {dates.map((date) => {
            const completion = calculateDailyCompletionPercentage(
              data.entries.filter((e) => e.date === date),
              activeHabits,
              date
            )
            const parsedDate = parseLocalDate(date)
            const dayName = parsedDate.toLocaleDateString(i18n.language, { weekday: 'short' })
            const dayNumber = parsedDate.getDate()

            let status: 'empty' | 'partial' | 'completed'
            if (completion === 0) {
              status = 'empty'
            } else if (completion >= 70) {
              status = 'completed'
            } else {
              status = 'partial'
            }

            return (
              <div key={date} className={`weekly-review__day weekly-review__day--${status}`}>
                <span className="weekly-review__day-name">{dayName}</span>
                <span className="weekly-review__day-number">{dayNumber}</span>
                <span
                  className="weekly-review__day-indicator"
                  aria-label={`${Math.round(completion)}%`}
                >
                  {status === 'completed' ? '●' : status === 'partial' ? '◐' : '○'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Détails par habitude */}
      <section className="weekly-review__section" aria-label={t('weeklyReview.sections.perHabit')}>
        <h2 className="weekly-review__section-title">{t('weeklyReview.sections.perHabit')}</h2>
        <div className="weekly-review__habits">
          {activeHabits.map((habit) => {
            const stats = weeklyStats.habitStats.get(habit.id)
            if (!stats) return null

            return (
              <Card
                key={habit.id}
                variant="default"
                className="weekly-review__habit-card"
                onClick={() => navigate(`/habits/${habit.id}`)}
              >
                <div className="weekly-review__habit-header">
                  <span className="weekly-review__habit-emoji" aria-hidden="true">
                    {habit.emoji}
                  </span>
                  <span className="weekly-review__habit-name">{habit.name}</span>
                </div>
                <div className="weekly-review__habit-stats">
                  <div className="weekly-review__habit-stat">
                    <span className="weekly-review__habit-stat-value">
                      {Math.round(stats.averageCompletion)}%
                    </span>
                    <span className="weekly-review__habit-stat-label">
                      {t('weeklyReview.habitStats.average')}
                    </span>
                  </div>
                  <div className="weekly-review__habit-stat">
                    <span className="weekly-review__habit-stat-value">
                      {stats.completedDays}/{stats.totalDays}
                    </span>
                    <span className="weekly-review__habit-stat-label">
                      {t('weeklyReview.habitStats.days')}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Pattern Analysis */}
      <section className="weekly-review__section" aria-label={t('weeklyReview.sections.patterns')}>
        <h2 className="weekly-review__section-title">{t('weeklyReview.sections.patterns')}</h2>
        <PatternInsights analysis={patternAnalysis} />
      </section>

      {/* Progression depuis le début (Effet Composé) */}
      <section className="weekly-review__section">
        <WeeklyProgressSummary habits={activeHabits} referenceDate={today} />
      </section>

      {/* Guided Reflection */}
      {!reflectionDismissed && (
        <section className="weekly-review__section" aria-label={t('reflection.title')}>
          <WeeklyReflectionInput
            onSave={handleSaveReflection}
            onSkip={handleSkipReflection}
            initialValue={existingReflection}
          />
        </section>
      )}

      {/* Actions */}
      <section className="weekly-review__actions">
        <Button variant="primary" fullWidth onClick={handleContinue}>
          {t('common.continue')}
        </Button>
      </section>
    </div>
  )
}

export default WeeklyReview
