import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SuggestedHabit } from '../../constants/suggestedHabits'
import { Card, DifficultyBadge, Button } from '../ui'
import SourcesModal from '../SourcesModal'
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
  const { t } = useTranslation()
  const [showSourcesModal, setShowSourcesModal] = useState(false)

  // Use translated values with fallback to original values
  const habitName = t(`suggested.${habit.id}.name`, { defaultValue: habit.name })
  const habitDescription = t(`suggested.${habit.id}.description`, {
    defaultValue: habit.description,
  })
  const habitScienceHighlight = t(`suggested.${habit.id}.scienceHighlight`, {
    defaultValue: habit.scienceHighlight,
  })
  const habitUnit = t(`units.${habit.unitKey}`, { defaultValue: habit.unit })

  const handleClick = () => {
    onSelect?.(habit)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(habit)
    }
  }

  const handleSourcesClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher la sélection de la carte
    setShowSourcesModal(true)
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
          <div className="suggested-habit-card__name-row">
            <h3 className="suggested-habit-card__name">{habitName}</h3>
            {habit.difficulty && (
              <DifficultyBadge difficulty={habit.difficulty} showLabel={!compact} />
            )}
          </div>
          {!compact && <p className="suggested-habit-card__description">{habitDescription}</p>}
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
            <p className="suggested-habit-card__science-text">{habitScienceHighlight}</p>
          </div>

          <div className="suggested-habit-card__meta">
            <div className="suggested-habit-card__benefits">
              {habit.benefitKeys.slice(0, 3).map((benefitKey) => (
                <span key={benefitKey} className="suggested-habit-card__benefit-tag">
                  {t(`benefits.${benefitKey}`, { defaultValue: benefitKey })}
                </span>
              ))}
            </div>
            <span className="suggested-habit-card__evidence">
              {t('suggestedHabits.evidence')} :{' '}
              {t(`suggestedHabits.evidenceLevels.${habit.evidenceLevel}`)}
            </span>
          </div>

          <div className="suggested-habit-card__dose">
            <span className="suggested-habit-card__dose-label">
              {t('suggestedHabits.startDose')} :
            </span>
            <span className="suggested-habit-card__dose-value">
              {habit.startValue} {habitUnit}
            </span>
          </div>

          {/* Bouton En savoir plus si des sources sont disponibles */}
          {habit.sources && habit.sources.length > 0 && (
            <div className="suggested-habit-card__sources-btn">
              <Button variant="ghost" size="small" onClick={handleSourcesClick}>
                {t('common.seeMore')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal des sources */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        habitName={habitName}
        scienceHighlight={habitScienceHighlight}
        sources={habit.sources || []}
      />
    </Card>
  )
}

export default SuggestedHabitCard
