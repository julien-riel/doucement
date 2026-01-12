/**
 * Menu d'export pour la page Statistiques
 * Permet d'exporter les graphiques en PNG ou en PDF
 */

import { useState, useRef, useEffect } from 'react'
import { Habit, DailyEntry } from '../types'
import { StatsPeriod } from '../types/statistics'
import { exportToPng } from '../services/exportImage'
import { exportToPdf } from '../services/exportPdf'
import './ExportMenu.css'

interface ExportMenuProps {
  /** Élément DOM du graphique à exporter (pour PNG) */
  chartRef: React.RefObject<HTMLElement | null>
  /** Habitudes actives */
  habits: Habit[]
  /** Entrées quotidiennes */
  entries: DailyEntry[]
  /** Période sélectionnée */
  period: StatsPeriod
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error'

/**
 * Composant de menu d'export avec options PNG et PDF
 */
function ExportMenu({ chartRef, habits, entries, period }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fermer le menu avec Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Réinitialiser le status après un délai
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('idle')
        setErrorMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status])

  /**
   * Exporte le graphique en PNG
   */
  async function handleExportPng() {
    if (!chartRef.current) {
      setStatus('error')
      setErrorMessage("Le graphique n'est pas disponible")
      return
    }

    setStatus('exporting')
    setIsOpen(false)

    const result = await exportToPng(chartRef.current, {
      filename: `doucement-progression-${period}`,
      scale: 2,
    })

    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMessage(result.error || "Erreur lors de l'export")
    }
  }

  /**
   * Exporte les statistiques en PDF
   */
  async function handleExportPdf() {
    setStatus('exporting')
    setIsOpen(false)

    const result = await exportToPdf(habits, entries, chartRef.current, {
      period,
      includeProjections: true,
      includeStatsTable: true,
    })

    if (result.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMessage(result.error || "Erreur lors de l'export")
    }
  }

  return (
    <div className="export-menu" ref={menuRef}>
      <button
        type="button"
        className="export-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={status === 'exporting'}
      >
        {status === 'exporting' ? (
          <>
            <span className="export-menu__spinner" aria-hidden="true" />
            Export...
          </>
        ) : status === 'success' ? (
          <>
            <span aria-hidden="true">✓</span>
            Exporté
          </>
        ) : (
          <>
            <span aria-hidden="true">📤</span>
            Exporter
          </>
        )}
      </button>

      {isOpen && (
        <div className="export-menu__dropdown" role="menu" aria-label="Options d'export">
          <button
            type="button"
            className="export-menu__item"
            onClick={handleExportPng}
            role="menuitem"
          >
            <span className="export-menu__item-icon" aria-hidden="true">
              🖼️
            </span>
            <span className="export-menu__item-content">
              <span className="export-menu__item-label">Image PNG</span>
              <span className="export-menu__item-description">Exporter le graphique</span>
            </span>
          </button>

          <button
            type="button"
            className="export-menu__item"
            onClick={handleExportPdf}
            role="menuitem"
          >
            <span className="export-menu__item-icon" aria-hidden="true">
              📄
            </span>
            <span className="export-menu__item-content">
              <span className="export-menu__item-label">Document PDF</span>
              <span className="export-menu__item-description">Récapitulatif complet</span>
            </span>
          </button>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="export-menu__error" role="alert">
          {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <div className="export-menu__success" role="status">
          Téléchargement réussi
        </div>
      )}
    </div>
  )
}

export default ExportMenu
