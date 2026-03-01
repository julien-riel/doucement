/**
 * Hook useAppData
 * Thin wrapper around AppDataContext for backward compatibility.
 * All state management is centralized in AppDataContext.
 */

import { useAppDataContext } from '../contexts/AppDataContext'
import type { StorageError } from '../services/storage'
import type {
  AppData,
  Habit,
  DailyEntry,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEntryInput,
  CounterOperationType,
} from '../types'

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
  /** Nouveau départ : repart d'une nouvelle valeur de départ en préservant l'historique */
  restartHabit: (id: string, newStartValue: number, reason?: string) => boolean
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
 * Consomme le AppDataContext pour fournir un accès réactif aux données
 * persistées (habitudes, entrées, préférences) avec auto-sauvegarde
 * automatique dans localStorage.
 *
 * Doit être utilisé dans un composant enfant de AppDataProvider.
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
  return useAppDataContext()
}
