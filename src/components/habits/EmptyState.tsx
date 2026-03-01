import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import './EmptyState.css'

export interface EmptyStateProps {
  /** Variante de l'état vide */
  variant?: 'today' | 'habits'
}

/**
 * État affiché quand aucune habitude n'existe
 * Messages tirés de docs/comm/banque-messages.md
 */
function EmptyState({ variant: _variant = 'today' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        🌱
      </div>
      <h2 className="empty-state__title">Tout commence par une habitude</h2>
      <p className="empty-state__description">
        Crée ta première habitude pour démarrer ta progression.
      </p>
      <Link to="/create" className="empty-state__link">
        <Button variant="primary" fullWidth>
          Créer une habitude
        </Button>
      </Link>
      <Link to="/settings" className="empty-state__settings-link">
        Paramètres
      </Link>
    </div>
  )
}

export default EmptyState
