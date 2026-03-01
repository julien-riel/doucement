/**
 * DataSection - Section de gestion des données (import/export)
 */
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../../../hooks'
import {
  exportData,
  importFromFile,
  importFromFileMerge,
  previewImportFile,
  formatImportResult,
  formatMergeImportResult,
  ImportResult,
  MergeImportResult,
  ImportPreviewData,
} from '../../../services/importExport'
import { getDataSizeKB, cleanupArchivedEntries, saveData } from '../../../services/storage'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

type ImportMode = 'replace' | 'merge'
type DataModalType = 'import-confirm' | 'import-result' | null

interface DataModalState {
  type: DataModalType
  file?: File
  result?: ImportResult | MergeImportResult
  preview?: ImportPreviewData
}

/**
 * Section de gestion des données (statistiques, import/export, sauvegarde)
 */
export function DataSection() {
  const { t } = useTranslation()
  const { data } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modal, setModal] = useState<DataModalState>({ type: null })
  const [importMode, setImportMode] = useState<ImportMode>('replace')
  const [isImporting, setIsImporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null)

  // Stats
  const habitsCount = data.habits.filter((h) => h.archivedAt === null).length
  const archivedCount = data.habits.filter((h) => h.archivedAt !== null).length
  const entriesCount = data.entries.length
  const dataSizeKB = getDataSizeKB()

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
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setModal({ type: 'import-confirm', file })
      // Generate preview in the background
      const previewResult = await previewImportFile(file)
      if (previewResult.success && previewResult.preview) {
        setModal((prev) => ({ ...prev, preview: previewResult.preview }))
      }
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
    const result =
      importMode === 'merge'
        ? await importFromFileMerge(modal.file)
        : await importFromFile(modal.file)
    setIsImporting(false)
    setModal({ type: 'import-result', result })
  }, [modal.file, importMode])

  const handleCloseModal = useCallback(() => {
    if (modal.type === 'import-result' && modal.result?.success) {
      window.location.reload()
    }
    setModal({ type: null })
  }, [modal.type, modal.result])

  const handleCleanupArchived = useCallback(() => {
    const { cleaned, removedCount } = cleanupArchivedEntries(data)
    if (removedCount === 0) {
      setCleanupMessage(t('settings.data.cleanupArchivedNone'))
    } else {
      saveData(cleaned)
      setCleanupMessage(t('settings.data.cleanupArchivedSuccess', { count: removedCount }))
      window.location.reload()
    }
    setTimeout(() => setCleanupMessage(null), 5000)
  }, [data, t])

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
          <p className="settings__stat-label" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            {t('settings.data.storageSize', { size: dataSizeKB })}
          </p>
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

          {archivedCount > 0 && (
            <>
              <Button
                variant="ghost"
                fullWidth
                onClick={handleCleanupArchived}
                className="settings__action-button"
              >
                🧹 {t('settings.data.cleanupArchived')}
              </Button>
              <p className="settings__stat-label" style={{ textAlign: 'center' }}>
                {t('settings.data.cleanupArchivedDesc')}
              </p>
            </>
          )}

          {cleanupMessage && (
            <p className="settings__message settings__message--success" role="status">
              {cleanupMessage}
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

            <fieldset className="settings__import-mode" role="radiogroup">
              <legend className="settings__import-mode-legend">
                {t('settings.modals.import.modeLabel')}
              </legend>
              <label
                className={`settings__import-mode-option ${importMode === 'replace' ? 'settings__import-mode-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="settings__import-mode-radio"
                />
                <span className="settings__import-mode-label">
                  {t('settings.modals.import.modeReplace')}
                </span>
                <span className="settings__import-mode-desc">
                  {t('settings.modals.import.modeReplaceDesc')}
                </span>
              </label>
              <label
                className={`settings__import-mode-option ${importMode === 'merge' ? 'settings__import-mode-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="settings__import-mode-radio"
                />
                <span className="settings__import-mode-label">
                  {t('settings.modals.import.modeMerge')}
                </span>
                <span className="settings__import-mode-desc">
                  {t('settings.modals.import.modeMergeDesc')}
                </span>
              </label>
            </fieldset>

            {/* Aperçu du fichier */}
            {modal.preview ? (
              <div className="settings__import-preview">
                <h4 className="settings__import-preview-title">
                  {t('settings.modals.import.preview.title')}
                </h4>
                <div className="settings__import-preview-stats">
                  <div className="settings__import-preview-stat">
                    <span className="settings__import-preview-value">
                      {modal.preview.habitsCount}
                    </span>
                    <span className="settings__import-preview-label">
                      {t('settings.modals.import.preview.habits', {
                        count: modal.preview.habitsCount,
                      })}
                      {' ('}
                      {t('settings.modals.import.preview.activeHabits', {
                        count: modal.preview.activeHabitsCount,
                      })}
                      {modal.preview.archivedHabitsCount > 0 && (
                        <>
                          ,{' '}
                          {t('settings.modals.import.preview.archivedHabits', {
                            count: modal.preview.archivedHabitsCount,
                          })}
                        </>
                      )}
                      {')'}
                    </span>
                  </div>
                  <div className="settings__import-preview-stat">
                    <span className="settings__import-preview-value">
                      {modal.preview.entriesCount}
                    </span>
                    <span className="settings__import-preview-label">
                      {t('settings.modals.import.preview.entries', {
                        count: modal.preview.entriesCount,
                      })}
                    </span>
                  </div>
                  {modal.preview.oldestDate && modal.preview.newestDate && (
                    <div className="settings__import-preview-stat">
                      <span className="settings__import-preview-label">
                        {t('settings.modals.import.preview.dateRange', {
                          oldest: modal.preview.oldestDate,
                          newest: modal.preview.newestDate,
                        })}
                      </span>
                    </div>
                  )}
                  {modal.preview.needsMigration && (
                    <div className="settings__import-preview-stat">
                      <span className="settings__import-preview-label settings__import-preview-label--info">
                        ℹ️ {t('settings.modals.import.preview.migrationNeeded')} (
                        {t('settings.modals.import.preview.schemaVersion', {
                          version: modal.preview.schemaVersion,
                        })}
                        )
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="settings__modal-text settings__modal-text--muted">
                {t('settings.modals.import.preview.loading')}
              </p>
            )}

            <p className="settings__modal-text settings__modal-text--warning">
              {importMode === 'replace'
                ? t('settings.modals.import.warning')
                : t('settings.modals.import.mergeWarning')}
            </p>
            {importMode === 'replace' && (
              <Button
                variant="secondary"
                fullWidth
                onClick={handleExport}
                className="settings__action-button"
              >
                📥 {t('settings.modals.import.backupFirst')}
              </Button>
            )}
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
              {'habitsAdded' in modal.result
                ? formatMergeImportResult(modal.result as MergeImportResult)
                : formatImportResult(modal.result)}
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
