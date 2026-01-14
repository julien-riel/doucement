/**
 * LanguageSection - Section de sélection de la langue
 */
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../../../components/ui/LanguageSelector'

/**
 * Section de sélection de la langue (Français, English)
 */
export function LanguageSection() {
  const { t } = useTranslation()

  return (
    <section className="settings__section" aria-labelledby="section-language">
      <h2 id="section-language" className="settings__section-title">
        {t('settings.sections.language')}
      </h2>

      <LanguageSelector />
    </section>
  )
}
