/**
 * Composant LanguageSelector
 * Permet de changer la langue de l'interface
 */

import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_LABELS } from '../../i18n'
import type { SupportedLanguage } from '../../i18n'
import Card from './Card'
import './LanguageSelector.css'

/**
 * Sélecteur de langue avec boutons radio visuels
 * - Affiche les langues disponibles avec drapeaux
 * - Sauvegarde le choix dans localStorage automatiquement via i18next
 * - Mise à jour instantanée de l'interface
 */
function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language as SupportedLanguage

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language)
  }

  return (
    <Card variant="default" className="language-selector">
      <div
        className="language-selector__options"
        role="radiogroup"
        aria-label={t('settings.languageSelector.title')}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            role="radio"
            aria-checked={currentLanguage === lang}
            className={`language-selector__option ${currentLanguage === lang ? 'language-selector__option--active' : ''}`}
            onClick={() => handleLanguageChange(lang)}
          >
            <span className="language-selector__flag" aria-hidden="true">
              {LANGUAGE_FLAGS[lang]}
            </span>
            <span className="language-selector__label">{LANGUAGE_LABELS[lang]}</span>
          </button>
        ))}
      </div>
      <p className="language-selector__hint">{t('settings.languageSelector.hint')}</p>
    </Card>
  )
}

export default LanguageSelector
