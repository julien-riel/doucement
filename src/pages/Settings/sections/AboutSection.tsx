/**
 * AboutSection - Section À propos et zone de danger
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData, useDebugMode } from '../../../hooks'
import { useWhatsNewContext } from '../../../contexts'
import { DebugPanel } from '../../../components/debug'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

/**
 * Section À propos, installation PWA, application et zone de danger
 */
export function AboutSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updatePreferences, resetData } = useAppData()
  const { isDebugMode, handleVersionTap } = useDebugMode()
  const { currentVersion, showWhatsNew, release } = useWhatsNewContext()
  const appVersion = currentVersion || '1.0.0'

  const [debugMessage, setDebugMessage] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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

  /**
   * Rejoue l'onboarding
   */
  const handleReplayOnboarding = useCallback(() => {
    updatePreferences({ onboardingCompleted: false })
    navigate('/onboarding')
  }, [updatePreferences, navigate])

  /**
   * Confirme la réinitialisation
   */
  const handleConfirmReset = useCallback(() => {
    resetData()
    setShowResetConfirm(false)
    navigate('/onboarding')
  }, [resetData, navigate])

  return (
    <>
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
            onClick={() => setShowResetConfirm(true)}
            className="settings__action-button settings__action-button--danger"
          >
            🗑️ {t('settings.danger.reset')}
          </Button>
          <p className="settings__warning">{t('settings.danger.warning')}</p>
        </div>
      </section>

      {/* Modal: Confirmation de réinitialisation */}
      {showResetConfirm && (
        <div className="settings__modal-overlay" onClick={() => setShowResetConfirm(false)}>
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
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
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
    </>
  )
}
