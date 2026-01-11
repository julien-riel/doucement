import { Habit } from '../../types'
import { SIMPLE_TRACKING, MILESTONE_MESSAGES } from '../../constants/messages'
import { getDaysSinceCreation } from '../../utils/habitDisplay'
import Card from '../ui/Card'
import Button from '../ui/Button'
import './TransitionSuggestion.css'

export interface TransitionSuggestionProps {
  /** L'habitude pour laquelle on suggère la transition */
  habit: Habit
  /** Date actuelle au format YYYY-MM-DD */
  currentDate: string
  /** Callback quand l'utilisateur accepte la transition */
  onAccept: (habitId: string) => void
  /** Callback quand l'utilisateur refuse la transition */
  onDecline: (habitId: string) => void
}

/**
 * Composant affichant une suggestion de passer du mode simple au mode détaillé
 * après 30 jours d'utilisation d'une habitude
 */
function TransitionSuggestion({
  habit,
  currentDate,
  onAccept,
  onDecline,
}: TransitionSuggestionProps) {
  const daysSinceCreation = getDaysSinceCreation(habit, currentDate)

  return (
    <Card variant="highlight" className="transition-suggestion">
      <div className="transition-suggestion__header">
        <span className="transition-suggestion__emoji">{habit.emoji}</span>
        <span className="transition-suggestion__milestone">
          {MILESTONE_MESSAGES.days(daysSinceCreation)}
        </span>
      </div>

      <p className="transition-suggestion__message">{SIMPLE_TRACKING.transitionSuggestion}</p>

      <div className="transition-suggestion__actions">
        <Button variant="primary" size="small" onClick={() => onAccept(habit.id)}>
          {SIMPLE_TRACKING.transitionYes}
        </Button>
        <Button variant="ghost" size="small" onClick={() => onDecline(habit.id)}>
          {SIMPLE_TRACKING.transitionNo}
        </Button>
      </div>
    </Card>
  )
}

export default TransitionSuggestion
