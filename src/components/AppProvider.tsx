/**
 * AppProvider Component
 * Initialise les services globaux de l'application (notifications, thème, etc.)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { loadData } from '../services/storage'
import { useNotifications } from '../hooks/useNotifications'
import { AppData, DEFAULT_APP_DATA, DailyEntry, Habit, ThemePreference } from '../types'

interface AppProviderProps {
  children: React.ReactNode
}

/**
 * Applique le thème au document
 */
function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement

  if (theme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    // Mode système : on retire l'attribut pour laisser le CSS media query agir
    root.removeAttribute('data-theme')
  }
}

/**
 * Composant Provider qui initialise les services globaux
 * - Charge les données au démarrage
 * - Initialise le thème
 * - Initialise les notifications
 */
function AppProvider({ children }: AppProviderProps) {
  const [data, setData] = useState<AppData | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Charger les données au démarrage
  useEffect(() => {
    const result = loadData()
    if (result.success && result.data) {
      setData(result.data)
      // Appliquer le thème immédiatement
      applyTheme(result.data.preferences.theme ?? 'system')
    } else {
      setData(DEFAULT_APP_DATA)
      applyTheme('system')
    }
    setIsReady(true)
  }, [])

  // Appliquer le thème quand il change
  useEffect(() => {
    if (data?.preferences.theme) {
      applyTheme(data.preferences.theme)
    }
  }, [data?.preferences.theme])

  // Garder les données à jour en écoutant les changements localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'doucement-data' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          setData(parsed)
        } catch (error) {
          console.error(
            '[AppProvider] Failed to parse localStorage data from storage event:',
            error instanceof Error ? error.message : error
          )
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Rafraîchir les données périodiquement (toutes les 30 secondes)
  // pour détecter les changements faits dans d'autres onglets
  useEffect(() => {
    const interval = setInterval(() => {
      const result = loadData()
      if (result.success && result.data) {
        setData(result.data)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Créer des fonctions stables pour le hook de notifications
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const getEntriesForDate = useCallback((date: string): DailyEntry[] => {
    return dataRef.current?.entries.filter((e) => e.date === date) || []
  }, [])

  const activeHabits = useCallback((): Habit[] => {
    return dataRef.current?.habits.filter((h) => h.archivedAt === null) || []
  }, [])

  // Initialiser les notifications
  useNotifications({
    settings: data?.preferences.notifications || DEFAULT_APP_DATA.preferences.notifications,
    getEntriesForDate,
    activeHabits: activeHabits(),
    isReady,
  })

  return <>{children}</>
}

export default AppProvider
