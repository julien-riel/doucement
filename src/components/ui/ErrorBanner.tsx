/**
 * ErrorBanner - Affichage des erreurs de stockage
 * Composant bienveillant pour informer l'utilisateur des problèmes techniques
 */

import { StorageError, StorageErrorType } from '../../services/storage';
import './ErrorBanner.css';

interface ErrorBannerProps {
  /** Erreur de stockage à afficher */
  error: StorageError | null;
  /** Callback pour réessayer l'opération */
  onRetry?: () => void;
  /** Callback pour réinitialiser les données */
  onReset?: () => void;
  /** Callback pour fermer la bannière */
  onDismiss?: () => void;
}

/**
 * Messages d'erreur bienveillants selon le type d'erreur
 */
const ERROR_MESSAGES: Record<StorageErrorType, { title: string; description: string }> = {
  STORAGE_UNAVAILABLE: {
    title: 'Stockage non disponible',
    description:
      'Votre navigateur ne permet pas de sauvegarder les données localement. Vérifiez vos paramètres de navigation privée.',
  },
  QUOTA_EXCEEDED: {
    title: 'Espace de stockage plein',
    description:
      'L\'espace disponible sur votre appareil est insuffisant. Essayez de libérer de l\'espace ou d\'exporter vos données.',
  },
  PARSE_ERROR: {
    title: 'Données corrompues',
    description:
      'Les données sauvegardées semblent endommagées. Vous pouvez réinitialiser l\'application ou importer une sauvegarde.',
  },
  VALIDATION_ERROR: {
    title: 'Format de données invalide',
    description:
      'Les données sauvegardées ne sont pas dans le bon format. Vous pouvez réinitialiser l\'application ou importer une sauvegarde.',
  },
  UNKNOWN_ERROR: {
    title: 'Problème technique',
    description:
      'Un problème inattendu est survenu. Vous pouvez réessayer ou réinitialiser l\'application.',
  },
};

/**
 * Bannière d'erreur bienveillante
 */
export function ErrorBanner({ error, onRetry, onReset, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  const message = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.UNKNOWN_ERROR;
  const showResetButton = error.type === 'PARSE_ERROR' || error.type === 'VALIDATION_ERROR';

  return (
    <div className="error-banner" role="alert" aria-live="polite">
      <div className="error-banner__icon">⚡</div>
      <div className="error-banner__content">
        <h3 className="error-banner__title">{message.title}</h3>
        <p className="error-banner__description">{message.description}</p>
        <div className="error-banner__actions">
          {onRetry && (
            <button
              type="button"
              className="error-banner__button error-banner__button--primary"
              onClick={onRetry}
            >
              Réessayer
            </button>
          )}
          {showResetButton && onReset && (
            <button
              type="button"
              className="error-banner__button error-banner__button--secondary"
              onClick={onReset}
            >
              Réinitialiser
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="error-banner__button error-banner__button--ghost"
              onClick={onDismiss}
              aria-label="Fermer"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
