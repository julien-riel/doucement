/**
 * Doucement - Modale "Quoi de neuf ?"
 * Affichée automatiquement après une mise à jour de l'application
 */

import { Release, EMOJI_MAP } from '../../types/releaseNotes'
import Button from './Button'
import './WhatsNewModal.css'

interface WhatsNewModalProps {
  /** Release à afficher */
  release: Release
  /** Version actuelle */
  version: string
  /** Callback de fermeture */
  onDismiss: () => void
}

/**
 * Convertit un nom d'emoji en caractère unicode
 */
function getEmoji(name: string): string {
  return EMOJI_MAP[name] || '\u2728'
}

/**
 * Formate une date ISO en français
 * Parse la date en local pour éviter les décalages de timezone
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Modale affichant les nouveautés de la dernière version
 */
export function WhatsNewModal({ release, version, onDismiss }: WhatsNewModalProps) {
  return (
    <div
      className="whats-new-overlay"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
    >
      <div className="whats-new-modal" onClick={(e) => e.stopPropagation()}>
        <header className="whats-new-header">
          <span className="whats-new-emoji" aria-hidden="true">
            {'\uD83C\uDF89'}
          </span>
          <h2 id="whats-new-title" className="whats-new-title">
            Quoi de neuf ?
          </h2>
          <p className="whats-new-version">
            Version {version} — {formatDate(release.date)}
          </p>
        </header>

        <div className="whats-new-content">
          {release.title && <h3 className="whats-new-release-title">{release.title}</h3>}

          <ul className="whats-new-highlights">
            {release.highlights.map((highlight, index) => (
              <li key={index} className="whats-new-highlight">
                <span className="whats-new-highlight-emoji" aria-hidden="true">
                  {getEmoji(highlight.emoji)}
                </span>
                <span className="whats-new-highlight-text">{highlight.text}</span>
              </li>
            ))}
          </ul>

          {release.details && <p className="whats-new-details">{release.details}</p>}
        </div>

        <footer className="whats-new-footer">
          <Button variant="primary" onClick={onDismiss} fullWidth>
            C'est parti !
          </Button>
        </footer>
      </div>
    </div>
  )
}
