/**
 * Hook useAppData
 * Accès réactif aux données avec auto-save
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { loadData, saveData, StorageError } from '../services/storage'
import {
  AppData,
  Habit,
  DailyEntry,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEntryInput,
  DEFAULT_APP_DATA,
  CURRENT_SCHEMA_VERSION,
  RecalibrationRecord,
  CounterOperation,
  CounterOperationType,
} from '../types'
import { calculateCounterValue, calculateTargetDose } from '../services/progression'
import { getCurrentDate } from '../utils'

/**
 * Génère un identifiant unique
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Retourne l'horodatage ISO actuel
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * État du hook useAppData
 */
export interface UseAppDataState {
  /** Données de l'application */
  data: AppData
  /** Chargement en cours */
  isLoading: boolean
  /** Erreur de stockage */
  error: StorageError | null
  /** Habitudes actives (non archivées) */
  activeHabits: Habit[]
  /** Habitudes archivées */
  archivedHabits: Habit[]
}

/**
 * Actions disponibles via useAppData
 */
export interface UseAppDataActions {
  /** Ajoute une nouvelle habitude */
  addHabit: (input: CreateHabitInput) => Habit | null
  /** Met à jour une habitude */
  updateHabit: (id: string, input: UpdateHabitInput) => boolean
  /** Archive une habitude */
  archiveHabit: (id: string) => boolean
  /** Restaure une habitude archivée */
  restoreHabit: (id: string) => boolean
  /** Recalibre la dose d'une habitude après une absence prolongée */
  recalibrateHabitDose: (id: string, newStartValue: number, level: number) => boolean
  /** Ajoute une entrée quotidienne */
  addEntry: (input: CreateEntryInput) => DailyEntry | null
  /** Ajoute une opération compteur (+1/-1) à une entrée */
  addCounterOperation: (
    habitId: string,
    date: string,
    operationType: CounterOperationType,
    value?: number,
    note?: string
  ) => DailyEntry | null
  /** Annule la dernière opération compteur d'une entrée */
  undoLastOperation: (habitId: string, date: string) => DailyEntry | null
  /** Récupère les entrées pour une date */
  getEntriesForDate: (date: string) => DailyEntry[]
  /** Récupère les entrées pour une habitude */
  getEntriesForHabit: (habitId: string) => DailyEntry[]
  /** Récupère une habitude par son id */
  getHabitById: (id: string) => Habit | undefined
  /** Met à jour les préférences */
  updatePreferences: (updates: Partial<AppData['preferences']>) => boolean
  /** Réinitialise les données */
  resetData: () => void
  /** Efface l'erreur courante */
  clearError: () => void
  /** Réessaie de charger les données */
  retryLoad: () => void
}

export type UseAppDataReturn = UseAppDataState & UseAppDataActions

/**
 * Hook principal de gestion des données de l'application.
 *
 * Fournit un accès réactif aux données persistées (habitudes, entrées, préférences)
 * avec auto-sauvegarde automatique dans localStorage.
 *
 * @returns {UseAppDataReturn} État et actions pour la gestion des données
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { activeHabits, addHabit, addEntry, isLoading } = useAppData()
 *
 *   if (isLoading) return <Loading />
 *
 *   const handleCreate = () => {
 *     const newHabit = addHabit({
 *       name: 'Méditation',
 *       emoji: '🧘',
 *       direction: 'increase',
 *       startValue: 5,
 *       unit: 'minutes',
 *       progression: { mode: 'fixed', value: 1, period: 'weekly' }
 *     })
 *   }
 *
 *   return <HabitList habits={activeHabits} />
 * }
 * ```
 */
export function useAppData(): UseAppDataReturn {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<StorageError | null>(null)

  // Chargement initial des données
  useEffect(() => {
    const result = loadData()
    if (result.success && result.data) {
      setData(result.data)
    } else if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }, [])

  // Auto-save quand les données changent (sauf au chargement initial)
  useEffect(() => {
    if (!isLoading) {
      const result = saveData(data)
      if (!result.success && result.error) {
        setError(result.error)
      }
    }
  }, [data, isLoading])

  // Calcul des habitudes actives et archivées
  const activeHabits = useMemo(
    () => data.habits.filter((h) => h.archivedAt === null),
    [data.habits]
  )

  const archivedHabits = useMemo(
    () => data.habits.filter((h) => h.archivedAt !== null),
    [data.habits]
  )

  // ============================================================================
  // HABIT ACTIONS
  // ============================================================================

  const addHabit = useCallback((input: CreateHabitInput): Habit | null => {
    const newHabit: Habit = {
      ...input,
      id: generateId(),
      createdAt: getCurrentDate(),
      archivedAt: null,
    }

    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }))

    return newHabit
  }, [])

  const updateHabit = useCallback(
    (id: string, input: UpdateHabitInput): boolean => {
      // Check if habit exists before updating
      const habitExists = data.habits.some((habit) => habit.id === id)
      if (!habitExists) {
        return false
      }

      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((habit) => {
          if (habit.id === id) {
            return { ...habit, ...input }
          }
          return habit
        }),
      }))

      return true
    },
    [data.habits]
  )

  const archiveHabit = useCallback(
    (id: string): boolean => {
      return updateHabit(id, { archivedAt: getCurrentDate() })
    },
    [updateHabit]
  )

  const restoreHabit = useCallback(
    (id: string): boolean => {
      return updateHabit(id, { archivedAt: null })
    },
    [updateHabit]
  )

  /**
   * Recalibre la dose d'une habitude après une absence prolongée
   * Modifie startValue et createdAt, et enregistre dans l'historique
   */
  const recalibrateHabitDose = useCallback(
    (id: string, newStartValue: number, level: number): boolean => {
      let found = false
      const today = getCurrentDate()

      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((habit) => {
          if (habit.id === id) {
            found = true

            // Créer l'entrée d'historique de recalibration
            const recalibrationRecord: RecalibrationRecord = {
              date: today,
              previousStartValue: habit.startValue,
              newStartValue,
              previousStartDate: habit.createdAt,
              level,
            }

            // Ajouter à l'historique existant ou créer un nouveau tableau
            const history = habit.recalibrationHistory ?? []

            return {
              ...habit,
              startValue: newStartValue,
              createdAt: today, // Nouveau point de départ pour le calcul de progression
              recalibrationHistory: [...history, recalibrationRecord],
            }
          }
          return habit
        }),
      }))

      return found
    },
    []
  )

  const getHabitById = useCallback(
    (id: string): Habit | undefined => {
      return data.habits.find((h) => h.id === id)
    },
    [data.habits]
  )

  // ============================================================================
  // ENTRY ACTIONS
  // ============================================================================

  const addEntry = useCallback((input: CreateEntryInput): DailyEntry | null => {
    const now = getCurrentTimestamp()
    const newEntry: DailyEntry = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }

    setData((prev) => {
      // Cherche l'habitude pour vérifier son entryMode
      const habit = prev.habits.find((h) => h.id === input.habitId)
      const isCumulative = habit?.entryMode === 'cumulative'

      // Cherche une entrée existante pour le même habit/date
      const existingIndex = prev.entries.findIndex(
        (e) => e.habitId === input.habitId && e.date === input.date
      )

      if (existingIndex >= 0) {
        const existingEntry = prev.entries[existingIndex]
        const updatedEntries = [...prev.entries]

        if (isCumulative) {
          // En mode cumulative, stocker chaque saisie dans l'historique
          const newOperation: CounterOperation = {
            id: generateId(),
            type: 'add',
            value: input.actualValue,
            timestamp: now,
          }
          const operations = [...(existingEntry.operations || []), newOperation]
          // Recalculer la valeur totale depuis l'historique
          const actualValue = calculateCounterValue(operations)

          updatedEntries[existingIndex] = {
            ...existingEntry,
            actualValue,
            operations,
            updatedAt: now,
          }
        } else {
          // En mode replace, remplacer simplement la valeur
          updatedEntries[existingIndex] = {
            ...newEntry,
            actualValue: input.actualValue,
            createdAt: existingEntry.createdAt,
          }
        }
        return { ...prev, entries: updatedEntries }
      }

      // Nouvelle entrée
      if (isCumulative) {
        // Pour une nouvelle entrée en mode cumulative, initialiser l'historique
        const newOperation: CounterOperation = {
          id: generateId(),
          type: 'add',
          value: input.actualValue,
          timestamp: now,
        }
        return {
          ...prev,
          entries: [
            ...prev.entries,
            {
              ...newEntry,
              operations: [newOperation],
            },
          ],
        }
      }

      return { ...prev, entries: [...prev.entries, newEntry] }
    })

    return newEntry
  }, [])

  /**
   * Ajoute une opération compteur (+1/-1) à une entrée
   * Crée l'entrée si elle n'existe pas encore
   */
  const addCounterOperation = useCallback(
    (
      habitId: string,
      date: string,
      operationType: CounterOperationType,
      value: number = 1,
      note?: string
    ): DailyEntry | null => {
      const now = getCurrentTimestamp()
      const habit = data.habits.find((h) => h.id === habitId)

      if (!habit) {
        return null
      }

      // Créer la nouvelle opération
      const operation: CounterOperation = {
        id: generateId(),
        type: operationType,
        value: Math.abs(value), // Toujours positif
        timestamp: now,
        note,
      }

      let resultEntry: DailyEntry | null = null

      setData((prev) => {
        const existingIndex = prev.entries.findIndex(
          (e) => e.habitId === habitId && e.date === date
        )

        if (existingIndex >= 0) {
          // Entrée existante : ajouter l'opération
          const existingEntry = prev.entries[existingIndex]
          const operations = [...(existingEntry.operations || []), operation]
          const actualValue = calculateCounterValue(operations)

          const updatedEntry: DailyEntry = {
            ...existingEntry,
            actualValue,
            operations,
            updatedAt: now,
          }
          resultEntry = updatedEntry

          const updatedEntries = [...prev.entries]
          updatedEntries[existingIndex] = updatedEntry
          return { ...prev, entries: updatedEntries }
        }

        // Nouvelle entrée
        const targetDose = calculateTargetDose(habit, date)
        const operations = [operation]
        const actualValue = calculateCounterValue(operations)

        const newEntry: DailyEntry = {
          id: generateId(),
          habitId,
          date,
          targetDose,
          actualValue,
          operations,
          createdAt: now,
          updatedAt: now,
        }
        resultEntry = newEntry

        return { ...prev, entries: [...prev.entries, newEntry] }
      })

      return resultEntry
    },
    [data.habits]
  )

  /**
   * Annule la dernière opération compteur d'une entrée
   */
  const undoLastOperation = useCallback(
    (habitId: string, date: string): DailyEntry | null => {
      const existingEntry = data.entries.find((e) => e.habitId === habitId && e.date === date)

      if (!existingEntry || !existingEntry.operations?.length) {
        return null
      }

      const now = getCurrentTimestamp()
      let resultEntry: DailyEntry | null = null

      setData((prev) => {
        const entryIndex = prev.entries.findIndex((e) => e.habitId === habitId && e.date === date)

        if (entryIndex < 0) {
          return prev
        }

        const entry = prev.entries[entryIndex]
        if (!entry.operations?.length) {
          return prev
        }

        // Supprimer la dernière opération
        const operations = entry.operations.slice(0, -1)
        const actualValue = calculateCounterValue(operations)

        const updatedEntry: DailyEntry = {
          ...entry,
          actualValue,
          operations,
          updatedAt: now,
        }
        resultEntry = updatedEntry

        const updatedEntries = [...prev.entries]
        updatedEntries[entryIndex] = updatedEntry
        return { ...prev, entries: updatedEntries }
      })

      return resultEntry
    },
    [data.entries]
  )

  const getEntriesForDate = useCallback(
    (date: string): DailyEntry[] => {
      return data.entries.filter((e) => e.date === date)
    },
    [data.entries]
  )

  const getEntriesForHabit = useCallback(
    (habitId: string): DailyEntry[] => {
      return data.entries.filter((e) => e.habitId === habitId)
    },
    [data.entries]
  )

  // ============================================================================
  // PREFERENCES ACTIONS
  // ============================================================================

  const updatePreferences = useCallback((updates: Partial<AppData['preferences']>): boolean => {
    setData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }))
    return true
  }, [])

  // ============================================================================
  // RESET
  // ============================================================================

  const resetData = useCallback((): void => {
    setData({
      ...DEFAULT_APP_DATA,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
    setError(null)
  }, [])

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const retryLoad = useCallback((): void => {
    setIsLoading(true)
    setError(null)
    const result = loadData()
    if (result.success && result.data) {
      setData(result.data)
    } else if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }, [])

  return {
    data,
    isLoading,
    error,
    activeHabits,
    archivedHabits,
    addHabit,
    updateHabit,
    archiveHabit,
    restoreHabit,
    recalibrateHabitDose,
    addEntry,
    addCounterOperation,
    undoLastOperation,
    getEntriesForDate,
    getEntriesForHabit,
    getHabitById,
    updatePreferences,
    resetData,
    clearError,
    retryLoad,
  }
}
