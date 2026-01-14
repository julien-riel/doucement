/**
 * Hook useTheme
 * Gère le thème de l'application (clair, sombre, système)
 */

import { useEffect, useMemo, useCallback, useState } from 'react'
import { useAppData } from './useAppData'
import { ThemePreference } from '../types'

/**
 * Thème résolu (après application des préférences système)
 */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Retour du hook useTheme
 */
export interface UseThemeReturn {
  /** Préférence de thème de l'utilisateur */
  theme: ThemePreference
  /** Thème effectivement appliqué */
  resolvedTheme: ResolvedTheme
  /** Change la préférence de thème */
  setTheme: (theme: ThemePreference) => void
  /** Indique si le mode sombre est actif */
  isDark: boolean
}

/**
 * Détecte la préférence système pour le dark mode
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Hook pour gérer le thème de l'application (clair, sombre, ou système).
 *
 * Fonctionnalités :
 * - Applique l'attribut `data-theme` sur `document.documentElement`
 * - Écoute `prefers-color-scheme` pour le mode "système"
 * - Persiste le choix utilisateur dans les préférences
 * - Expose le thème résolu (après application des préférences système)
 *
 * @returns {UseThemeReturn} État et actions pour la gestion du thème
 *
 * @example
 * ```tsx
 * function ThemeSelector() {
 *   const { theme, setTheme, isDark } = useTheme()
 *
 *   return (
 *     <div className={isDark ? 'dark-mode' : 'light-mode'}>
 *       <button onClick={() => setTheme('light')}>☀️ Clair</button>
 *       <button onClick={() => setTheme('dark')}>🌙 Sombre</button>
 *       <button onClick={() => setTheme('system')}>⚙️ Système</button>
 *       <p>Thème actuel: {theme}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  const { data, updatePreferences } = useAppData()
  const theme = data.preferences.theme ?? 'system'

  // État local pour la préférence système (pour réactivité)
  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>(getSystemPreference)

  // Calcule le thème effectif (résolu)
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return systemPreference
    }
    return theme
  }, [theme, systemPreference])

  // Applique le thème au DOM
  useEffect(() => {
    const root = document.documentElement

    // Applique le thème explicite ou laisse le CSS gérer le mode système
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      // Mode système : on retire l'attribut pour laisser le CSS media query agir
      root.removeAttribute('data-theme')
    }
  }, [theme])

  // Écoute les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPreference(event.matches ? 'dark' : 'light')
    }

    // Mise à jour initiale
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light')

    // Écoute les changements
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // Fonction pour changer le thème
  const setTheme = useCallback(
    (newTheme: ThemePreference) => {
      updatePreferences({ theme: newTheme })
    },
    [updatePreferences]
  )

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  }
}
