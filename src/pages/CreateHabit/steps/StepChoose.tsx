/**
 * StepChoose - First step: Choose a suggested habit or create custom
 */

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateHabitContext } from '../CreateHabitContext'
import { HabitCarousel, FilterChips, FilterOption } from '../../../components/ui'
import { SuggestedHabitCard } from '../../../components/habits'
import {
  SuggestedHabit,
  getTopPriorityHabits,
  HABIT_CATEGORIES,
  HabitCategory,
} from '../../../constants/suggestedHabits'
import type { HabitDifficulty, TimeOfDay } from '../../../types'

/**
 * Step for choosing between suggested habits or custom creation
 */
export function StepChoose() {
  const { t } = useTranslation()
  const { updateForm, setStep, setSelectedCategory } = useCreateHabitContext()

  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all')
  const [activeDifficulty, setActiveDifficulty] = useState<HabitDifficulty | 'all'>('all')
  const [activeTimeOfDay, setActiveTimeOfDay] = useState<TimeOfDay | 'all'>('all')

  const suggestedHabits = useMemo(() => getTopPriorityHabits(true), [])
  const categories = useMemo(() => Object.keys(HABIT_CATEGORIES) as HabitCategory[], [])

  // Memoized filter options for FilterChips
  const categoryOptions = useMemo<FilterOption<HabitCategory>[]>(() => {
    return categories.map((cat) => ({
      value: cat,
      label: t(`categories.${cat}.name`, { defaultValue: HABIT_CATEGORIES[cat].name }),
      emoji: HABIT_CATEGORIES[cat].emoji,
    }))
  }, [categories, t])

  const difficultyOptions = useMemo<FilterOption<HabitDifficulty>[]>(() => {
    return [
      { value: 'easy', label: t('habits.difficulty.easy') },
      { value: 'moderate', label: t('habits.difficulty.moderate') },
      { value: 'challenging', label: t('habits.difficulty.challenging') },
    ]
  }, [t])

  const timeOfDayOptions = useMemo<FilterOption<TimeOfDay>[]>(() => {
    return [
      {
        value: 'morning',
        label: t('habits.timeOfDay.morning'),
        emoji: t('habits.timeOfDayEmojis.morning'),
      },
      {
        value: 'afternoon',
        label: t('habits.timeOfDay.afternoon'),
        emoji: t('habits.timeOfDayEmojis.afternoon'),
      },
      {
        value: 'evening',
        label: t('habits.timeOfDay.evening'),
        emoji: t('habits.timeOfDayEmojis.evening'),
      },
      {
        value: 'night',
        label: t('habits.timeOfDay.night'),
        emoji: t('habits.timeOfDayEmojis.night'),
      },
    ]
  }, [t])

  const filteredSuggestions = useMemo(() => {
    let filtered = suggestedHabits

    // Filter by category
    if (activeCategory === 'all') {
      filtered = filtered.slice(0, 6)
    } else {
      filtered = filtered.filter((h) => h.category === activeCategory)
    }

    // Filter by difficulty
    if (activeDifficulty !== 'all') {
      filtered = filtered.filter((h) => h.difficulty === activeDifficulty)
    }

    // Filter by time of day
    if (activeTimeOfDay !== 'all') {
      filtered = filtered.filter((h) => h.timeOfDay === activeTimeOfDay)
    }

    return filtered
  }, [suggestedHabits, activeCategory, activeDifficulty, activeTimeOfDay])

  /**
   * Select a suggested habit and pre-fill the form
   */
  const selectSuggestion = (habit: SuggestedHabit) => {
    const translatedName = t(`suggested.${habit.id}.name`, { defaultValue: habit.name })
    const translatedUnit = t(`units.${habit.unitKey}`, { defaultValue: habit.unit })

    updateForm('direction', habit.direction)
    updateForm('name', translatedName)
    updateForm('emoji', habit.emoji)
    updateForm('unit', translatedUnit)
    updateForm('startValue', habit.startValue)
    updateForm('progressionMode', habit.progression?.mode ?? 'percentage')
    updateForm('progressionValue', habit.progression?.value ?? 5)
    updateForm('progressionPeriod', habit.progression?.period ?? 'weekly')
    updateForm('trackingFrequency', habit.trackingFrequency ?? 'daily')
    updateForm('trackingMode', habit.trackingMode ?? 'detailed')
    updateForm('timeOfDay', habit.timeOfDay ?? null)

    setSelectedCategory(habit.category)
    setStep('intentions')
  }

  /**
   * Go to custom habit creation
   */
  const handleCustomClick = () => {
    if (activeCategory !== 'all') {
      setSelectedCategory(activeCategory)
    }
    setStep('type')
  }

  return (
    <div className="create-habit__content step-choose">
      <div className="step-choose__section">
        <h3 className="step-choose__section-title">{t('createHabit.highImpact.title')}</h3>
        <p className="step-choose__section-desc">{t('createHabit.highImpact.description')}</p>

        {/* Category filters */}
        <FilterChips
          options={categoryOptions}
          value={activeCategory}
          onChange={setActiveCategory}
          allLabel={t('createHabit.top6')}
          className="step-choose__filters"
        />

        {/* Difficulty filters */}
        <FilterChips
          options={difficultyOptions}
          value={activeDifficulty}
          onChange={setActiveDifficulty}
          allLabel={t('habits.difficulty.all')}
          variant="secondary"
          className="step-choose__filters"
        />

        {/* Time of day filters */}
        <FilterChips
          options={timeOfDayOptions}
          value={activeTimeOfDay}
          onChange={setActiveTimeOfDay}
          allLabel={t('habits.timeOfDay.all')}
          variant="secondary"
          className="step-choose__filters"
        />

        {/* Result count */}
        <p className="step-choose__result-count">
          {t('habits.resultCount', { count: filteredSuggestions.length })}
        </p>

        {/* Habit suggestions carousel */}
        <div className="step-choose__carousel-container">
          <HabitCarousel
            key={`${activeCategory}-${activeDifficulty}-${activeTimeOfDay}`}
            itemsPerViewDesktop={2}
            itemsPerViewMobile={1}
            ariaLabel={t('createHabit.highImpact.title')}
          >
            {filteredSuggestions.map((habit) => (
              <SuggestedHabitCard key={habit.id} habit={habit} onSelect={selectSuggestion} />
            ))}
          </HabitCarousel>
        </div>
      </div>

      <div className="step-choose__divider">
        <span>{t('common.or')}</span>
      </div>

      <button type="button" className="step-choose__custom-btn" onClick={handleCustomClick}>
        <span className="step-choose__custom-icon">✨</span>
        <div className="step-choose__custom-text">
          <span className="step-choose__custom-title">{t('createHabit.createCustom.title')}</span>
          <span className="step-choose__custom-desc">
            {t('createHabit.createCustom.description')}
          </span>
        </div>
        <span className="step-choose__custom-arrow">→</span>
      </button>
    </div>
  )
}
