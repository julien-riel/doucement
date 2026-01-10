/**
 * AppProvider Component
 * Initialise les services globaux de l'application (notifications, etc.)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { loadData } from '../services/storage'
import { useNotifications } from '../hooks/useNotifications'
import { AppData, DEFAULT_APP_DATA, DailyEntry, Habit } from '../types'

interface AppProviderProps {
  children: React.ReactNode
}

/**
 * Composant Provider qui initialise les services globaux
 * - Charge les données au démarrage
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
    } else {
      setData(DEFAULT_APP_DATA)
    }
    setIsReady(true)
  }, [])

  // Garder les données à jour en écoutant les changements localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'doucement-data' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          setData(parsed)
        } catch {
          // Ignorer les erreurs de parsing
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
