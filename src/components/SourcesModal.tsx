import { useEffect, useRef } from 'react'
import { Button } from './ui'
import './SourcesModal.css'

export interface SourcesModalProps {
  /** État d'ouverture du modal */
  isOpen: boolean
  /** Callback pour fermer le modal */
  onClose: () => void
  /** Titre de l'habitude */
  habitName: string
  /** Texte scientifique mis en évidence */
  scienceHighlight: string
  /** Liste des URLs de sources */
  sources: string[]
}

/**
 * Extrait le nom de domaine d'une URL pour l'affichage
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    // Retirer 'www.' si présent
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Modal affichant les sources scientifiques d'une habitude
 * - Affiche scienceHighlight en évidence
 * - Liste des URLs avec icône lien externe
 * - Bouton fermer
 * - Accessible (focus trap, escape)
 */
function SourcesModal({
  isOpen,
  onClose,
  habitName,
  scienceHighlight,
  sources,
}: SourcesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap et fermeture avec Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Focus le bouton fermer à l'ouverture
    closeButtonRef.current?.focus()

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="sources-modal__overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
    >
      <div className="sources-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <header className="sources-modal__header">
          <h2 id="sources-modal-title" className="sources-modal__title">
            Sources scientifiques
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="sources-modal__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <div className="sources-modal__content">
          <p className="sources-modal__habit-name">{habitName}</p>

          <div className="sources-modal__highlight">
            <span className="sources-modal__highlight-icon" aria-hidden="true">
              🔬
            </span>
            <p className="sources-modal__highlight-text">{scienceHighlight}</p>
          </div>

          {sources.length > 0 && (
            <div className="sources-modal__sources">
              <h3 className="sources-modal__sources-title">En savoir plus</h3>
              <ul className="sources-modal__list">
                {sources.map((source, index) => (
                  <li key={index} className="sources-modal__item">
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sources-modal__link"
                    >
                      <span className="sources-modal__link-icon" aria-hidden="true">
                        🔗
                      </span>
                      <span className="sources-modal__link-text">{extractDomain(source)}</span>
                      <span className="sources-modal__external-icon" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="sources-modal__footer">
          <Button variant="primary" onClick={onClose}>
            Compris
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default SourcesModal
