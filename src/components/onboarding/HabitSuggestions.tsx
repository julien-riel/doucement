import { useState, useMemo } from 'react'
import {
  SuggestedHabit,
  getTopPriorityHabits,
  HABIT_CATEGORIES,
  HabitCategory,
} from '../../constants/suggestedHabits'
import SuggestedHabitCard from '../habits/SuggestedHabitCard'
import './HabitSuggestions.css'

interface HabitSuggestionsProps {
  selectedHabits: SuggestedHabit[]
  onSelectionChange: (habits: SuggestedHabit[]) => void
  maxSelection?: number
}

/**
 * Composant de sélection d'habitudes suggérées pour l'onboarding
 * Affiche les habitudes à fort impact groupées par catégorie
 */
function HabitSuggestions({
  selectedHabits,
  onSelectionChange,
  maxSelection = 3,
}: HabitSuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<HabitCategory | 'all'>('all')

  const habits = useMemo(() => getTopPriorityHabits(false), [])

  const categories = useMemo(() => {
    const cats = new Set(habits.map((h) => h.category))
    return Array.from(cats) as HabitCategory[]
  }, [habits])

  const filteredHabits = useMemo(() => {
    if (activeCategory === 'all') {
      return habits.slice(0, 6)
    }
    return habits.filter((h) => h.category === activeCategory)
  }, [habits, activeCategory])

  const handleSelect = (habit: SuggestedHabit) => {
    const isSelected = selectedHabits.some((h) => h.id === habit.id)

    if (isSelected) {
      onSelectionChange(selectedHabits.filter((h) => h.id !== habit.id))
    } else if (selectedHabits.length < maxSelection) {
      onSelectionChange([...selectedHabits, habit])
    }
  }

  const isSelected = (habit: SuggestedHabit) => {
    return selectedHabits.some((h) => h.id === habit.id)
  }

  return (
    <div className="habit-suggestions">
      <div className="habit-suggestions__header">
        <h2 className="habit-suggestions__title">Habitudes à fort impact</h2>
        <p className="habit-suggestions__subtitle">
          Basées sur la science, ces habitudes ont le plus grand effet sur ta qualité de vie.
          Choisis-en jusqu'à {maxSelection} pour commencer.
        </p>
      </div>

      {/* Category filters */}
      <div className="habit-suggestions__filters" role="tablist" aria-label="Filtrer par catégorie">
        <button
          type="button"
          className={`habit-suggestions__filter ${activeCategory === 'all' ? 'habit-suggestions__filter--active' : ''}`}
          onClick={() => setActiveCategory('all')}
          role="tab"
          aria-selected={activeCategory === 'all'}
        >
          Top 6
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`habit-suggestions__filter ${activeCategory === cat ? 'habit-suggestions__filter--active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            role="tab"
            aria-selected={activeCategory === cat}
          >
            {HABIT_CATEGORIES[cat].emoji} {HABIT_CATEGORIES[cat].name}
          </button>
        ))}
      </div>

      {/* Selection count */}
      <div className="habit-suggestions__selection-info">
        <span className="habit-suggestions__selection-count">
          {selectedHabits.length} / {maxSelection} sélectionnée
          {selectedHabits.length > 1 ? 's' : ''}
        </span>
        {selectedHabits.length === 0 && (
          <span className="habit-suggestions__selection-hint">
            Tu peux aussi passer cette étape et créer tes propres habitudes
          </span>
        )}
      </div>

      {/* Habits grid */}
      <div className="habit-suggestions__grid">
        {filteredHabits.map((habit) => (
          <SuggestedHabitCard
            key={habit.id}
            habit={habit}
            selected={isSelected(habit)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Selected habits summary */}
      {selectedHabits.length > 0 && (
        <div className="habit-suggestions__summary">
          <p className="habit-suggestions__summary-title">Tes habitudes sélectionnées :</p>
          <div className="habit-suggestions__summary-list">
            {selectedHabits.map((habit) => (
              <span key={habit.id} className="habit-suggestions__summary-item">
                {habit.emoji} {habit.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HabitSuggestions
