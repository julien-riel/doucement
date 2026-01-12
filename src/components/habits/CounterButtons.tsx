import { HabitDirection, CounterOperation } from '../../types'
import Button from '../ui/Button'
import './CounterButtons.css'

export interface CounterButtonsProps {
  /** Dose cible du jour */
  targetDose: number
  /** Unité de mesure */
  unit: string
  /** Valeur actuelle (calculée depuis les opérations) */
  currentValue?: number
  /** Historique des opérations pour cette journée */
  operations?: CounterOperation[]
  /** Callback pour ajouter une opération +1 */
  onAdd: (value?: number) => void
  /** Callback pour soustraire -1 */
  onSubtract: (value?: number) => void
  /** Callback pour annuler la dernière opération */
  onUndo: () => void
  /** Désactiver les boutons */
  disabled?: boolean
  /** Direction de l'habitude (pour les couleurs) */
  direction?: HabitDirection
}

/**
 * Formate l'horodatage d'une opération pour l'affichage
 */
function formatOperationTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Retourne le texte descriptif de la dernière opération
 */
function getLastOperationText(operation: CounterOperation): string {
  const time = formatOperationTime(operation.timestamp)
  const sign = operation.type === 'add' ? '+' : '-'
  return `${sign}${operation.value} à ${time}`
}

/**
 * Composant CounterButtons pour les habitudes de type compteur
 *
 * Affiche:
 * - Boutons +1 / -1 pour incrémenter/décrémenter rapidement
 * - Valeur actuelle au centre
 * - Dernière opération avec heure
 * - Bouton "Annuler" pour défaire la dernière action
 *
 * Couleurs selon la direction:
 * - increase: +1 = vert (positif), -1 = orange (correction)
 * - decrease: +1 = orange (attention), -1 = vert (positif)
 */
function CounterButtons({
  targetDose,
  unit,
  currentValue = 0,
  operations = [],
  onAdd,
  onSubtract,
  onUndo,
  disabled = false,
  direction = 'increase',
}: CounterButtonsProps) {
  const lastOperation = operations.length > 0 ? operations[operations.length - 1] : null
  const canUndo = operations.length > 0

  // Détermine les classes de couleur selon la direction
  // Pour increase: +1 est positif (vert), -1 est correction (neutre)
  // Pour decrease: -1 est positif (vert), +1 est attention (neutre)
  const addButtonClass =
    direction === 'decrease' ? 'counter-buttons__btn--attention' : 'counter-buttons__btn--positive'
  const subtractButtonClass =
    direction === 'decrease' ? 'counter-buttons__btn--positive' : 'counter-buttons__btn--neutral'

  // Ne pas permettre de descendre en dessous de 0
  const canSubtract = currentValue > 0

  return (
    <div className="counter-buttons">
      <div className="counter-buttons__main">
        <button
          className={`counter-buttons__btn ${subtractButtonClass}`}
          onClick={() => onSubtract(1)}
          disabled={disabled || !canSubtract}
          aria-label={`Retirer 1 ${unit}`}
        >
          -1
        </button>

        <div className="counter-buttons__value">
          <span className="counter-buttons__current">{currentValue}</span>
          <span className="counter-buttons__target">/ {targetDose}</span>
        </div>

        <button
          className={`counter-buttons__btn ${addButtonClass}`}
          onClick={() => onAdd(1)}
          disabled={disabled}
          aria-label={`Ajouter 1 ${unit}`}
        >
          +1
        </button>
      </div>

      <div className="counter-buttons__footer">
        {lastOperation && (
          <span className="counter-buttons__last-action">
            Dernière action: {getLastOperationText(lastOperation)}
          </span>
        )}

        {canUndo && (
          <Button
            variant="ghost"
            size="small"
            onClick={onUndo}
            disabled={disabled}
            className="counter-buttons__undo"
          >
            Annuler
          </Button>
        )}
      </div>
    </div>
  )
}

export default CounterButtons
