/**
 * Écran Paramètres
 * Préférences, import/export, notifications, à propos, revoir onboarding
 *
 * Structure modulaire avec sections séparées pour une meilleure maintenabilité.
 */
import { useTranslation } from 'react-i18next'
import {
  ThemeSection,
  LanguageSection,
  NotificationSection,
  DataSection,
  AboutSection,
} from './sections'
import '../Settings.css'

/**
 * Écran Paramètres principal
 * Orchestre les différentes sections de paramètres.
 */
function Settings() {
  const { t } = useTranslation()

  return (
    <div className="page page-settings">
      <header className="settings__header">
        <h1 className="settings__title">{t('settings.title')}</h1>
      </header>

      {/* Section: Données (statistiques, import/export, sauvegarde) */}
      <DataSection />

      {/* Section: Notifications */}
      <NotificationSection />

      {/* Section: Apparence (thème) */}
      <ThemeSection />

      {/* Section: Langue */}
      <LanguageSection />

      {/* Section: Installation PWA, Application, À propos, Zone de danger */}
      <AboutSection />
    </div>
  )
}

export default Settings
