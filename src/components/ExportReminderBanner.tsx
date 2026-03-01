/**
 * ExportReminderBanner
 * Rappel mensuel bienveillant pour inciter l'utilisateur à sauvegarder ses données
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { exportData } from '../services/importExport'
import Button from './ui/Button'
import './ExportReminderBanner.css'

interface ExportReminderBannerProps {
  /** Callback quand l'utilisateur exporte ou dismiss */
  onDismiss: () => void
}

/**
 * Bannière non-intrusive rappelant d'exporter les données
 * Affichée dans Today si >30 jours depuis le dernier export/rappel
 */
function ExportReminderBanner({ onDismiss }: ExportReminderBannerProps) {
  const { t } = useTranslation()

  const handleExport = useCallback(() => {
    exportData()
    onDismiss()
  }, [onDismiss])

  return (
    <div className="export-reminder" role="status">
      <p className="export-reminder__message">{t('exportReminder.message')}</p>
      <div className="export-reminder__actions">
        <Button variant="secondary" size="small" onClick={handleExport}>
          {t('exportReminder.export')}
        </Button>
        <Button variant="ghost" size="small" onClick={onDismiss}>
          {t('exportReminder.later')}
        </Button>
      </div>
    </div>
  )
}

export default ExportReminderBanner
