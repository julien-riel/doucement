/**
 * AdjustmentSuggestionCard
 * Affiche une suggestion d'ajustement de progression dans la revue hebdomadaire
 */
import { useTranslation } from 'react-i18next'
import { Card, Button } from '../ui'
import type { ProgressionAdjustmentSuggestion } from '../../services/progression'
import type { Habit } from '../../types'

export interface AdjustmentSuggestionCardProps {
  suggestion: ProgressionAdjustmentSuggestion
  habit: Habit
  onAccept: (habitId: string) => void
  onDismiss: (habitId: string) => void
}

/**
 * Carte de suggestion d'ajustement affichée dans la WeeklyReview
 */
function AdjustmentSuggestionCard({
  suggestion,
  habit,
  onAccept,
  onDismiss,
}: AdjustmentSuggestionCardProps) {
  const { t } = useTranslation()

  const key = suggestion.adjustmentDirection === 'increase' ? 'overperform' : 'slowDown'

  return (
    <Card variant="highlight" className="weekly-review__suggestion-card">
      <h3 className="weekly-review__suggestion-title">
        {t(`adjustmentSuggestions.${key}.title`, { habitName: habit.name })}
      </h3>
      <p className="weekly-review__suggestion-message">
        {t(`adjustmentSuggestions.${key}.message`, {
          weeks: suggestion.consecutiveWeeks,
          average: suggestion.averageCompletion,
        })}
      </p>
      <div className="weekly-review__suggestion-actions">
        <Button variant="primary" size="small" onClick={() => onAccept(habit.id)}>
          {t(`adjustmentSuggestions.${key}.action`)}
        </Button>
        <Button variant="ghost" size="small" onClick={() => onDismiss(habit.id)}>
          {t('adjustmentSuggestions.dismissAction')}
        </Button>
      </div>
    </Card>
  )
}

export default AdjustmentSuggestionCard
