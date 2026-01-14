/**
 * ThemeSection - Section de sélection du thème
 */
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../../hooks'
import { ThemePreference } from '../../../types'
import Card from '../../../components/ui/Card'

const THEME_OPTIONS = [
  { value: 'light', icon: '☀️', labelKey: 'light' },
  { value: 'dark', icon: '🌙', labelKey: 'dark' },
  { value: 'system', icon: '⚙️', labelKey: 'system' },
] as const

/**
 * Section de sélection du thème (clair, sombre, système)
 */
export function ThemeSection() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
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
          {THEME_OPTIONS.map((option) => (
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
  )
}
