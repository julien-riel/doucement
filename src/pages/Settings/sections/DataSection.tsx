/**
 * DataSection - Section de gestion des données (import/export)
 */
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../../../hooks'
import {
  exportData,
  importFromFile,
  formatImportResult,
  ImportResult,
} from '../../../services/importExport'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

type DataModalType = 'import-confirm' | 'import-result' | null

interface DataModalState {
  type: DataModalType
  file?: File
  result?: ImportResult
}

/**
 * Section de gestion des données (statistiques, import/export, sauvegarde)
 */
export function DataSection() {
  const { t } = useTranslation()
  const { data } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modal, setModal] = useState<DataModalState>({ type: null })
  const [isImporting, setIsImporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  // Stats
  const habitsCount = data.habits.filter((h) => h.archivedAt === null).length
  const archivedCount = data.habits.filter((h) => h.archivedAt !== null).length
  const entriesCount = data.entries.length

  // Export
  const handleExport = useCallback(() => {
    const result = exportData()
    if (result.success) {
      setExportMessage(t('settings.data.exportSuccess'))
      setTimeout(() => setExportMessage(null), 4000)
    } else {
      setExportMessage(result.error || t('settings.data.exportError'))
      setTimeout(() => setExportMessage(null), 4000)
    }
  }, [t])

  // Import
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setModal({ type: 'import-confirm', file })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleConfirmImport = useCallback(async () => {
    if (!modal.file) return

    setIsImporting(true)
    const result = await importFromFile(modal.file)
    setIsImporting(false)
    setModal({ type: 'import-result', result })
  }, [modal.file])

  const handleCloseModal = useCallback(() => {
    if (modal.type === 'import-result' && modal.result?.success) {
      window.location.reload()
    }
    setModal({ type: null })
  }, [modal.type, modal.result])

  return (
    <>
      {/* Section: Données */}
      <section className="settings__section" aria-labelledby="section-data">
        <h2 id="section-data" className="settings__section-title">
          {t('settings.data.title')}
        </h2>

        <Card variant="default" className="settings__card">
          <div className="settings__stats">
            <div className="settings__stat">
              <span className="settings__stat-value">{habitsCount}</span>
              <span className="settings__stat-label">
                {t('settings.data.activeHabits', { count: habitsCount })}
              </span>
            </div>
            <div className="settings__stat">
              <span className="settings__stat-value">{archivedCount}</span>
              <span className="settings__stat-label">
                {t('settings.data.archivedHabits', { count: archivedCount })}
              </span>
            </div>
            <div className="settings__stat">
              <span className="settings__stat-value">{entriesCount}</span>
              <span className="settings__stat-label">
                {t('settings.data.entries', { count: entriesCount })}
              </span>
            </div>
          </div>
        </Card>

        <div className="settings__actions">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleExport}
            className="settings__action-button"
          >
            📥 {t('settings.data.export')}
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleImportClick}
            className="settings__action-button"
          >
            📤 {t('settings.data.import')}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-label={t('settings.data.selectFile')}
          />

          {exportMessage && (
            <p className="settings__message settings__message--success" role="status">
              {exportMessage}
            </p>
          )}
        </div>
      </section>

      {/* Section: Sauvegarde */}
      <section className="settings__section" aria-labelledby="section-backup">
        <h2 id="section-backup" className="settings__section-title">
          {t('settings.backup.title')}
        </h2>

        <Card variant="highlight" className="settings__card settings__backup-card">
          <p className="settings__backup-text">
            <strong>💡 {t('settings.backup.warning')}</strong>
          </p>
          <p className="settings__backup-text">{t('settings.backup.explanation')}</p>
          <p className="settings__backup-text">
            <strong>{t('settings.backup.recommendation')}</strong>
          </p>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleExport}
            className="settings__action-button"
          >
            📥 {t('settings.backup.exportNow')}
          </Button>
        </Card>
      </section>

      {/* Modal: Confirmation d'import */}
      {modal.type === 'import-confirm' && (
        <div className="settings__modal-overlay" onClick={handleCloseModal}>
          <div
            className="settings__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="settings__modal-title">{t('settings.modals.import.title')}</h3>
            <p className="settings__modal-text">{t('settings.modals.import.text')}</p>
            <p className="settings__modal-text settings__modal-text--warning">
              {t('settings.modals.import.warning')}
            </p>
            <div className="settings__modal-actions">
              <Button variant="ghost" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? t('settings.modals.import.importing') : t('common.import')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Résultat d'import */}
      {modal.type === 'import-result' && modal.result && (
        <div className="settings__modal-overlay" onClick={handleCloseModal}>
          <div
            className="settings__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="settings__modal-title">
              {modal.result.success
                ? t('settings.modals.importResult.success')
                : t('settings.modals.importResult.failed')}
            </h3>
            <p className="settings__modal-text settings__modal-text--pre">
              {formatImportResult(modal.result)}
            </p>
            <div className="settings__modal-actions settings__modal-actions--single">
              <Button variant="primary" onClick={handleCloseModal}>
                {modal.result.success ? t('common.continue') : t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
