import { SuggestedHabit, EVIDENCE_LABELS } from '../../constants/suggestedHabits'
import { Card } from '../ui'
import './SuggestedHabitCard.css'

interface SuggestedHabitCardProps {
  habit: SuggestedHabit
  selected?: boolean
  onSelect?: (habit: SuggestedHabit) => void
  compact?: boolean
}

/**
 * Carte affichant une habitude suggérée avec ses données scientifiques
 */
function SuggestedHabitCard({
  habit,
  selected = false,
  onSelect,
  compact = false,
}: SuggestedHabitCardProps) {
  const handleClick = () => {
    onSelect?.(habit)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(habit)
    }
  }

  return (
    <Card
      variant={selected ? 'highlight' : 'default'}
      className={`suggested-habit-card ${selected ? 'suggested-habit-card--selected' : ''} ${compact ? 'suggested-habit-card--compact' : ''}`}
      onClick={onSelect ? handleClick : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
    >
      <div className="suggested-habit-card__header">
        <span className="suggested-habit-card__emoji" aria-hidden="true">
          {habit.emoji}
        </span>
        <div className="suggested-habit-card__title-group">
          <h3 className="suggested-habit-card__name">{habit.name}</h3>
          {!compact && <p className="suggested-habit-card__description">{habit.description}</p>}
        </div>
        {selected && (
          <span className="suggested-habit-card__check" aria-hidden="true">
            ✓
          </span>
        )}
      </div>

      {!compact && (
        <>
          <div className="suggested-habit-card__science">
            <span className="suggested-habit-card__science-icon" aria-hidden="true">
              🔬
            </span>
            <p className="suggested-habit-card__science-text">{habit.scienceHighlight}</p>
          </div>

          <div className="suggested-habit-card__meta">
            <div className="suggested-habit-card__benefits">
              {habit.benefits.slice(0, 3).map((benefit) => (
                <span key={benefit} className="suggested-habit-card__benefit-tag">
                  {benefit}
                </span>
              ))}
            </div>
            <span className="suggested-habit-card__evidence">
              Preuve : {EVIDENCE_LABELS[habit.evidenceLevel]}
            </span>
          </div>

          <div className="suggested-habit-card__dose">
            <span className="suggested-habit-card__dose-label">Dose de départ :</span>
            <span className="suggested-habit-card__dose-value">
              {habit.startValue} {habit.unit}
            </span>
          </div>
        </>
      )}
    </Card>
  )
}

export default SuggestedHabitCard
