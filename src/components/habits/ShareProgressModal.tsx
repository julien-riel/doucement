/**
 * ShareProgressModal Component
 * Modal pour prévisualiser et exporter/partager la progression
 * Phase 13 - Export Visuel Partageable
 */

import { useState, useRef, useCallback } from 'react'
import { Button, Card } from '../ui'
import ShareableProgressCard from './ShareableProgressCard'
import { exportElementAsImage, shareImage, canShareFiles } from '../../services/imageExport'
import type { Habit, DailyEntry } from '../../types'
import './ShareProgressModal.css'

export interface ShareProgressModalProps {
  /** Modal ouverte */
  isOpen: boolean
  /** Callback de fermeture */
  onClose: () => void
  /** Habitude à partager */
  habit: Habit
  /** Entrées de l'habitude */
  entries: DailyEntry[]
  /** Date de référence (YYYY-MM-DD) */
  referenceDate: string
}

type Template = 'default' | 'minimal' | 'detailed'

const TEMPLATE_LABELS: Record<Template, string> = {
  default: 'Standard',
  minimal: 'Minimaliste',
  detailed: 'Détaillé',
}

/**
 * Modal de prévisualisation et partage de la progression
 */
function ShareProgressModal({
  isOpen,
  onClose,
  habit,
  entries,
  referenceDate,
}: ShareProgressModalProps) {
  const [template, setTemplate] = useState<Template>('default')
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState<boolean | null>(null)

  // Ref pour la carte à exporter (pas celle en preview)
  const exportCardRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(async () => {
    if (!exportCardRef.current) return

    setIsExporting(true)
    setExportSuccess(null)

    try {
      await exportElementAsImage(exportCardRef.current, {
        filename: `doucement-${habit.name.toLowerCase().replace(/\s+/g, '-')}`,
      })
      setExportSuccess(true)
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      setExportSuccess(false)
    } finally {
      setIsExporting(false)
    }
  }, [habit.name])

  const handleShare = useCallback(async () => {
    if (!exportCardRef.current) return

    setIsExporting(true)
    setExportSuccess(null)

    try {
      const shared = await shareImage(
        exportCardRef.current,
        `Ma progression avec ${habit.emoji} ${habit.name}`,
        {
          filename: `doucement-${habit.name.toLowerCase().replace(/\s+/g, '-')}`,
        }
      )
      setExportSuccess(shared)
    } catch (error) {
      console.error('Erreur lors du partage:', error)
      setExportSuccess(false)
    } finally {
      setIsExporting(false)
    }
  }, [habit.name, habit.emoji])

  const handleClose = useCallback(() => {
    setExportSuccess(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  const canShare = canShareFiles()

  return (
    <div className="share-modal__overlay" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal__header">
          <h2 className="share-modal__title">Partager ma progression</h2>
          <button
            type="button"
            className="share-modal__close"
            onClick={handleClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Sélecteur de template */}
        <div className="share-modal__templates">
          {(Object.keys(TEMPLATE_LABELS) as Template[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`share-modal__template-btn ${template === t ? 'share-modal__template-btn--active' : ''}`}
              onClick={() => setTemplate(t)}
            >
              {TEMPLATE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Preview de la carte */}
        <div className="share-modal__preview">
          <ShareableProgressCard
            habit={habit}
            entries={entries}
            referenceDate={referenceDate}
            template={template}
          />
        </div>

        {/* Carte cachée pour l'export (taille réelle) */}
        <div className="share-modal__export-container" aria-hidden="true">
          <ShareableProgressCard
            ref={exportCardRef}
            habit={habit}
            entries={entries}
            referenceDate={referenceDate}
            template={template}
          />
        </div>

        {/* Message de succès/erreur */}
        {exportSuccess !== null && (
          <Card variant={exportSuccess ? 'highlight' : 'default'} className="share-modal__feedback">
            {exportSuccess
              ? 'Image générée avec succès !'
              : 'Erreur lors de la génération. Réessayez.'}
          </Card>
        )}

        {/* Actions */}
        <div className="share-modal__actions">
          <Button variant="secondary" onClick={handleClose} disabled={isExporting}>
            Annuler
          </Button>

          {canShare ? (
            <Button variant="primary" onClick={handleShare} disabled={isExporting}>
              {isExporting ? 'Génération...' : 'Partager'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleDownload} disabled={isExporting}>
              {isExporting ? 'Génération...' : 'Télécharger'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareProgressModal
