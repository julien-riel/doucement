/**
 * Écran Paramètres
 * Préférences, import/export, notifications, à propos, revoir onboarding
 */
import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData, useDebugMode } from '../hooks'
import {
  exportData,
  importFromFile,
  formatImportResult,
  ImportResult,
} from '../services/importExport'
import { EXPORT_SUCCESS, ABOUT_TEXT } from '../constants/messages'
import { NotificationSettings as NotificationSettingsType } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import NotificationSettings from '../components/ui/NotificationSettings'
import { DebugPanel } from '../components/debug'
import './Settings.css'

/**
 * Version de l'application
 */
const APP_VERSION = '1.0.0'

type ModalType = 'import-confirm' | 'import-result' | 'reset-confirm' | null

interface ModalState {
  type: ModalType
  file?: File
  result?: ImportResult
}

/**
 * Écran Paramètres
 */
function Settings() {
  const navigate = useNavigate()
  const { data, updatePreferences, resetData, getEntriesForDate, activeHabits } = useAppData()
  const { isDebugMode, handleVersionTap } = useDebugMode()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modal, setModal] = useState<ModalState>({ type: null })
  const [isImporting, setIsImporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [debugMessage, setDebugMessage] = useState<string | null>(null)

  /**
   * Gère le tap sur la version pour activer/désactiver le mode debug
   */
  const onVersionTap = useCallback(() => {
    const activated = handleVersionTap()
    if (activated) {
      setDebugMessage(isDebugMode ? 'Mode debug désactivé' : 'Mode debug activé')
      setTimeout(() => setDebugMessage(null), 2000)
    }
  }, [handleVersionTap, isDebugMode])

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Met à jour les paramètres de notifications
   */
  const handleNotificationSettingsChange = useCallback(
    (settings: NotificationSettingsType) => {
      updatePreferences({
        notifications: settings,
      })
    },
    [updatePreferences]
  )

  /**
   * Vérifie si le rappel du soir doit être envoyé
   * (si aucune entrée enregistrée pour aujourd'hui)
   */
  const checkEveningCondition = useMemo(() => {
    return () => {
      const today = new Date().toISOString().split('T')[0]
      const todayEntries = getEntriesForDate(today)
      // Envoyer le rappel si moins d'entrées que d'habitudes actives
      return todayEntries.length < activeHabits.length
    }
  }, [getEntriesForDate, activeHabits.length])

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = useCallback(() => {
    const result = exportData()
    if (result.success) {
      setExportMessage(EXPORT_SUCCESS)
      setTimeout(() => setExportMessage(null), 4000)
    } else {
      setExportMessage(result.error || "Erreur lors de l'export")
      setTimeout(() => setExportMessage(null), 4000)
    }
  }, [])

  // ============================================================================
  // IMPORT
  // ============================================================================

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setModal({ type: 'import-confirm', file })
    }
    // Reset input to allow selecting the same file again
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
    setModal({ type: null })
    // If import was successful, reload the page to reflect new data
    if (modal.type === 'import-result' && modal.result?.success) {
      window.location.reload()
    }
  }, [modal.type, modal.result])

  // ============================================================================
  // ONBOARDING
  // ============================================================================

  const handleReplayOnboarding = useCallback(() => {
    updatePreferences({ onboardingCompleted: false })
    navigate('/onboarding')
  }, [updatePreferences, navigate])

  // ============================================================================
  // RESET
  // ============================================================================

  const handleResetClick = useCallback(() => {
    setModal({ type: 'reset-confirm' })
  }, [])

  const handleConfirmReset = useCallback(() => {
    resetData()
    setModal({ type: null })
    navigate('/onboarding')
  }, [resetData, navigate])

  // ============================================================================
  // STATS
  // ============================================================================

  const habitsCount = data.habits.filter((h) => h.archivedAt === null).length
  const archivedCount = data.habits.filter((h) => h.archivedAt !== null).length
  const entriesCount = data.entries.length

  return (
    <div className="page page-settings">
      <header className="settings__header">
        <h1 className="settings__title">Paramètres</h1>
      </header>

      {/* Section: Données */}
      <section className="settings__section" aria-labelledby="section-data">
        <h2 id="section-data" className="settings__section-title">
          Tes données
        </h2>

        <Card variant="default" className="settings__card">
          <div className="settings__stats">
            <div className="settings__stat">
              <span className="settings__stat-value">{habitsCount}</span>
              <span className="settings__stat-label">
                habitude{habitsCount !== 1 ? 's' : ''} active{habitsCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="settings__stat">
              <span className="settings__stat-value">{archivedCount}</span>
              <span className="settings__stat-label">archivée{archivedCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="settings__stat">
              <span className="settings__stat-value">{entriesCount}</span>
              <span className="settings__stat-label">entrée{entriesCount !== 1 ? 's' : ''}</span>
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
            📥 Exporter mes données
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleImportClick}
            className="settings__action-button"
          >
            📤 Importer des données
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-label="Sélectionner un fichier JSON à importer"
          />

          {exportMessage && (
            <p className="settings__message settings__message--success" role="status">
              {exportMessage}
            </p>
          )}
        </div>
      </section>

      {/* Section: Notifications */}
      <section className="settings__section" aria-labelledby="section-notifications">
        <h2 id="section-notifications" className="settings__section-title">
          Rappels
        </h2>

        <NotificationSettings
          settings={data.preferences.notifications}
          onChange={handleNotificationSettingsChange}
          checkEveningCondition={checkEveningCondition}
        />
      </section>

      {/* Section: Application */}
      <section className="settings__section" aria-labelledby="section-app">
        <h2 id="section-app" className="settings__section-title">
          Application
        </h2>

        <div className="settings__actions">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleReplayOnboarding}
            className="settings__action-button"
          >
            🎓 Revoir l'introduction
          </Button>
        </div>
      </section>

      {/* Section: À propos */}
      <section className="settings__section" aria-labelledby="section-about">
        <h2 id="section-about" className="settings__section-title">
          À propos
        </h2>

        <Card variant="default" className="settings__card settings__about-card">
          <p className="settings__about-text">
            <strong>Doucement</strong> — {ABOUT_TEXT.description}
          </p>
          <p className="settings__about-text settings__about-privacy">🔒 {ABOUT_TEXT.privacy}</p>
          <p
            className="settings__about-version"
            onClick={onVersionTap}
            role="button"
            tabIndex={0}
            aria-label={`Version ${APP_VERSION}. Tapez 7 fois pour activer le mode debug.`}
          >
            v{APP_VERSION} {isDebugMode && <span className="settings__debug-badge">DEBUG</span>}
          </p>
          {debugMessage && (
            <p className="settings__debug-message" role="status">
              {debugMessage}
            </p>
          )}
        </Card>
      </section>

      {/* Section: Debug Panel (visible only in debug mode) */}
      {isDebugMode && (
        <section className="settings__section" aria-labelledby="section-debug">
          <DebugPanel />
        </section>
      )}

      {/* Section: Zone de danger */}
      <section
        className="settings__section settings__section--danger"
        aria-labelledby="section-danger"
      >
        <h2 id="section-danger" className="settings__section-title">
          Zone sensible
        </h2>

        <div className="settings__actions">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleResetClick}
            className="settings__action-button settings__action-button--danger"
          >
            🗑️ Réinitialiser l'application
          </Button>
          <p className="settings__warning">
            Cette action supprimera toutes tes données. Elle est irréversible.
          </p>
        </div>
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
            <h3 className="settings__modal-title">Importer des données</h3>
            <p className="settings__modal-text">
              L'import remplacera toutes tes données actuelles par celles du fichier.
            </p>
            <p className="settings__modal-text settings__modal-text--warning">
              Cette action est irréversible. Pense à exporter tes données actuelles avant si tu veux
              les conserver.
            </p>
            <div className="settings__modal-actions">
              <Button variant="ghost" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleConfirmImport} disabled={isImporting}>
                {isImporting ? 'Import en cours...' : 'Importer'}
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
              {modal.result.success ? '✓ Import réussi' : 'Import échoué'}
            </h3>
            <p className="settings__modal-text settings__modal-text--pre">
              {formatImportResult(modal.result)}
            </p>
            <div className="settings__modal-actions settings__modal-actions--single">
              <Button variant="primary" onClick={handleCloseModal}>
                {modal.result.success ? 'Continuer' : 'Fermer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de réinitialisation */}
      {modal.type === 'reset-confirm' && (
        <div className="settings__modal-overlay" onClick={handleCloseModal}>
          <div
            className="settings__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="settings__modal-title">Réinitialiser l'application</h3>
            <p className="settings__modal-text">
              Tu vas supprimer toutes tes habitudes et ton historique.
            </p>
            <p className="settings__modal-text settings__modal-text--warning">
              Cette action est irréversible.
            </p>
            <div className="settings__modal-actions">
              <Button variant="ghost" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReset}
                className="settings__button--danger"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
