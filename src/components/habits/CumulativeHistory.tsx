import { CounterOperation } from '../../types'
import Button from '../ui/Button'
import './CumulativeHistory.css'

export interface CumulativeHistoryProps {
  /** Historique des opérations pour cette journée */
  operations: CounterOperation[]
  /** Unité de mesure */
  unit: string
  /** Callback pour annuler la dernière opération */
  onUndo: () => void
  /** Nombre maximum d'opérations à afficher (défaut: 5) */
  maxDisplay?: number
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
 * Composant CumulativeHistory
 *
 * Affiche l'historique des saisies cumulatives avec:
 * - Liste des dernières saisies avec heure
 * - Total cumulé
 * - Bouton pour annuler la dernière saisie
 */
function CumulativeHistory({ operations, unit, onUndo, maxDisplay = 5 }: CumulativeHistoryProps) {
  if (operations.length === 0) {
    return null
  }

  // Prendre les dernières opérations
  const displayedOperations = operations.slice(-maxDisplay)
  const hasMore = operations.length > maxDisplay
  const lastOperation = operations[operations.length - 1]

  return (
    <div className="cumulative-history">
      <div className="cumulative-history__header">
        <span className="cumulative-history__label">Saisies du jour</span>
      </div>

      <div className="cumulative-history__list">
        {hasMore && (
          <span className="cumulative-history__more">
            + {operations.length - maxDisplay} autre{operations.length - maxDisplay > 1 ? 's' : ''}
          </span>
        )}
        {displayedOperations.map((op) => (
          <div key={op.id} className="cumulative-history__item">
            <span className="cumulative-history__value">
              +{op.value} {unit}
            </span>
            <span className="cumulative-history__time">{formatOperationTime(op.timestamp)}</span>
          </div>
        ))}
      </div>

      <div className="cumulative-history__footer">
        <Button variant="ghost" size="small" onClick={onUndo} className="cumulative-history__undo">
          Annuler ({lastOperation && `+${lastOperation.value}`})
        </Button>
      </div>
    </div>
  )
}

export default CumulativeHistory
