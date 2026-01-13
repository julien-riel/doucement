/**
 * Écran Paramètres
 * Préférences, import/export, notifications, à propos, revoir onboarding
 */
import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData, useDebugMode, useTheme } from '../hooks'
import { useWhatsNewContext } from '../contexts'
import { ThemePreference } from '../types'
import {
  exportData,
  importFromFile,
  formatImportResult,
  ImportResult,
} from '../services/importExport'
import { NotificationSettings as NotificationSettingsType } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import NotificationSettings from '../components/ui/NotificationSettings'
import LanguageSelector from '../components/ui/LanguageSelector'
import { DebugPanel } from '../components/debug'
import { getCurrentDate } from '../utils'
import './Settings.css'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, updatePreferences, resetData, getEntriesForDate, activeHabits } = useAppData()
  const { isDebugMode, handleVersionTap } = useDebugMode()
  const { theme, setTheme } = useTheme()
  const { currentVersion, showWhatsNew, release } = useWhatsNewContext()
  const appVersion = currentVersion || '1.0.0'
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
      setDebugMessage(isDebugMode ? t('settings.debug.deactivated') : t('settings.debug.activated'))
      setTimeout(() => setDebugMessage(null), 2000)
    }
  }, [handleVersionTap, isDebugMode, t])

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
      const today = getCurrentDate()
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
      setExportMessage(t('settings.data.exportSuccess'))
      setTimeout(() => setExportMessage(null), 4000)
    } else {
      setExportMessage(result.error || t('settings.data.exportError'))
      setTimeout(() => setExportMessage(null), 4000)
    }
  }, [t])

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
        <h1 className="settings__title">{t('settings.title')}</h1>
      </header>

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

      {/* Section: Notifications */}
      <section className="settings__section" aria-labelledby="section-notifications">
        <h2 id="section-notifications" className="settings__section-title">
          {t('settings.notifications.title')}
        </h2>

        <NotificationSettings
          settings={data.preferences.notifications}
          onChange={handleNotificationSettingsChange}
          checkEveningCondition={checkEveningCondition}
        />
      </section>

      {/* Section: Apparence */}
      <section className="settings__section" aria-labelledby="section-appearance">
        <h2 id="section-appearance" className="settings__section-title">
          {t('settings.appearance.title')}
        </h2>

        <Card variant="default" className="settings__card">
          <div
            className="settings__theme-options"
            role="radiogroup"
            aria-label={t('settings.appearance.themeChoice')}
          >
            {(
              [
                { value: 'light', icon: '☀️', labelKey: 'light' },
                { value: 'dark', icon: '🌙', labelKey: 'dark' },
                { value: 'system', icon: '⚙️', labelKey: 'system' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={theme === option.value}
                className={`settings__theme-option ${theme === option.value ? 'settings__theme-option--active' : ''}`}
                onClick={() => setTheme(option.value as ThemePreference)}
              >
                <span className="settings__theme-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="settings__theme-label">
                  {t(`settings.appearance.themes.${option.labelKey}`)}
                </span>
              </button>
            ))}
          </div>
          <p className="settings__theme-hint">{t(`settings.appearance.themeHints.${theme}`)}</p>
        </Card>
      </section>

      {/* Section: Langue */}
      <section className="settings__section" aria-labelledby="section-language">
        <h2 id="section-language" className="settings__section-title">
          {t('settings.sections.language')}
        </h2>

        <LanguageSelector />
      </section>

      {/* Section: Installation PWA */}
      <section className="settings__section" aria-labelledby="section-install">
        <h2 id="section-install" className="settings__section-title">
          {t('settings.install.title')}
        </h2>

        <Card variant="default" className="settings__card">
          <p className="settings__install-intro">📱 {t('settings.install.intro')}</p>

          <div className="settings__install-instructions">
            <div className="settings__install-platform">
              <strong>🍎 {t('settings.install.ios.title')}</strong>
              <ol className="settings__install-steps">
                <li>{t('settings.install.ios.step1')}</li>
                <li>
                  {t('settings.install.ios.step2')}{' '}
                  <span className="settings__install-icon">↑</span>
                </li>
                <li>{t('settings.install.ios.step3')}</li>
              </ol>
            </div>

            <div className="settings__install-platform">
              <strong>🤖 {t('settings.install.android.title')}</strong>
              <ol className="settings__install-steps">
                <li>{t('settings.install.android.step1')}</li>
                <li>{t('settings.install.android.step2')}</li>
                <li>{t('settings.install.android.step3')}</li>
              </ol>
            </div>
          </div>

          <p className="settings__install-benefit">✨ {t('settings.install.benefit')}</p>
        </Card>
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

      {/* Section: Application */}
      <section className="settings__section" aria-labelledby="section-app">
        <h2 id="section-app" className="settings__section-title">
          {t('settings.app.title')}
        </h2>

        <div className="settings__actions">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleReplayOnboarding}
            className="settings__action-button"
          >
            🎓 {t('settings.app.replayOnboarding')}
          </Button>
        </div>
      </section>

      {/* Section: À propos */}
      <section className="settings__section" aria-labelledby="section-about">
        <h2 id="section-about" className="settings__section-title">
          {t('settings.about.title')}
        </h2>

        <Card variant="default" className="settings__card settings__about-card">
          <p className="settings__about-text">
            <strong>Doucement</strong> — {t('settings.about.description')}
          </p>
          <p className="settings__about-text settings__about-privacy">
            🔒 {t('settings.about.privacy')}
          </p>
          <p
            className="settings__about-version"
            onClick={onVersionTap}
            role="button"
            tabIndex={0}
            aria-label={t('settings.about.versionLabel', { version: appVersion })}
          >
            v{appVersion} {isDebugMode && <span className="settings__debug-badge">DEBUG</span>}
          </p>
          {debugMessage && (
            <p className="settings__debug-message" role="status">
              {debugMessage}
            </p>
          )}
          {release && (
            <Button
              variant="ghost"
              size="small"
              onClick={showWhatsNew}
              className="settings__whats-new-button"
            >
              {t('settings.about.whatsNew')}
            </Button>
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
          {t('settings.danger.title')}
        </h2>

        <div className="settings__actions">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleResetClick}
            className="settings__action-button settings__action-button--danger"
          >
            🗑️ {t('settings.danger.reset')}
          </Button>
          <p className="settings__warning">{t('settings.danger.warning')}</p>
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

      {/* Modal: Confirmation de réinitialisation */}
      {modal.type === 'reset-confirm' && (
        <div className="settings__modal-overlay" onClick={handleCloseModal}>
          <div
            className="settings__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="settings__modal-title">{t('settings.modals.reset.title')}</h3>
            <p className="settings__modal-text">{t('settings.modals.reset.text')}</p>
            <p className="settings__modal-text settings__modal-text--warning">
              {t('settings.modals.reset.warning')}
            </p>
            <div className="settings__modal-actions">
              <Button variant="ghost" onClick={handleCloseModal}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReset}
                className="settings__button--danger"
              >
                {t('settings.danger.reset')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
