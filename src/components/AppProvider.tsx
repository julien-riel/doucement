/**
 * AppProvider Component
 * Initialise les services globaux de l'application (notifications, thème, etc.)
 * Wraps children with AppDataProvider for centralized state management.
 */

import { useEffect, useCallback, useRef } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useAppData } from '../hooks/useAppData'
import { DailyEntry, Habit, ThemePreference, DEFAULT_APP_DATA } from '../types'
import { AppDataProvider } from '../contexts/AppDataContext'

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
    root.removeAttribute('data-theme')
  }
}

/**
 * Composant interne qui initialise les services globaux
 * (thème, notifications) en consommant le AppDataContext.
 */
function AppServices({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useAppData()

  // Appliquer le thème au démarrage et quand il change
  useEffect(() => {
    applyTheme(data.preferences.theme ?? 'system')
  }, [data.preferences.theme])

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
    isReady: !isLoading,
  })

  return <>{children}</>
}

/**
 * Composant Provider qui initialise les services globaux
 * - Centralise les données via AppDataProvider
 * - Initialise le thème
 * - Initialise les notifications
 * - Cross-tab sync via StorageEvent (pas de polling)
 */
function AppProvider({ children }: AppProviderProps) {
  return (
    <AppDataProvider>
      <AppServices>{children}</AppServices>
    </AppDataProvider>
  )
}

export default AppProvider
