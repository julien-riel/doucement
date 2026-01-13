/**
 * Configuration i18next
 * Internationalisation de l'application Doucement
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr.json'
import en from './locales/en.json'

/**
 * Langues supportées
 */
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Labels des langues
 */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  fr: 'Fran\u00e7ais',
  en: 'English',
}

/**
 * Drapeaux des langues
 */
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  fr: '\ud83c\uddeb\ud83c\uddf7',
  en: '\ud83c\uddec\ud83c\udde7',
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'doucement-language',
    },
  })

export default i18n
