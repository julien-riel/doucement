/**
 * Hook useAppData
 * Accès réactif aux données avec auto-save
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadData, saveData, StorageError } from '../services/storage';
import {
  AppData,
  Habit,
  DailyEntry,
  CreateHabitInput,
  UpdateHabitInput,
  CreateEntryInput,
  DEFAULT_APP_DATA,
  CURRENT_SCHEMA_VERSION,
} from '../types';

/**
 * Génère un identifiant unique
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retourne l'horodatage ISO actuel
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * État du hook useAppData
 */
export interface UseAppDataState {
  /** Données de l'application */
  data: AppData;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur de stockage */
  error: StorageError | null;
  /** Habitudes actives (non archivées) */
  activeHabits: Habit[];
  /** Habitudes archivées */
  archivedHabits: Habit[];
}

/**
 * Actions disponibles via useAppData
 */
export interface UseAppDataActions {
  /** Ajoute une nouvelle habitude */
  addHabit: (input: CreateHabitInput) => Habit | null;
  /** Met à jour une habitude */
  updateHabit: (id: string, input: UpdateHabitInput) => boolean;
  /** Archive une habitude */
  archiveHabit: (id: string) => boolean;
  /** Restaure une habitude archivée */
  restoreHabit: (id: string) => boolean;
  /** Ajoute une entrée quotidienne */
  addEntry: (input: CreateEntryInput) => DailyEntry | null;
  /** Récupère les entrées pour une date */
  getEntriesForDate: (date: string) => DailyEntry[];
  /** Récupère les entrées pour une habitude */
  getEntriesForHabit: (habitId: string) => DailyEntry[];
  /** Récupère une habitude par son id */
  getHabitById: (id: string) => Habit | undefined;
  /** Met à jour les préférences */
  updatePreferences: (updates: Partial<AppData['preferences']>) => boolean;
  /** Réinitialise les données */
  resetData: () => void;
}

export type UseAppDataReturn = UseAppDataState & UseAppDataActions;

/**
 * Hook principal de gestion des données
 * Charge les données au montage et sauvegarde automatiquement les modifications
 */
export function useAppData(): UseAppDataReturn {
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);

  // Chargement initial des données
  useEffect(() => {
    const result = loadData();
    if (result.success && result.data) {
      setData(result.data);
    } else if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  // Auto-save quand les données changent (sauf au chargement initial)
  useEffect(() => {
    if (!isLoading) {
      const result = saveData(data);
      if (!result.success && result.error) {
        setError(result.error);
      }
    }
  }, [data, isLoading]);

  // Calcul des habitudes actives et archivées
  const activeHabits = useMemo(
    () => data.habits.filter((h) => h.archivedAt === null),
    [data.habits]
  );

  const archivedHabits = useMemo(
    () => data.habits.filter((h) => h.archivedAt !== null),
    [data.habits]
  );

  // ============================================================================
  // HABIT ACTIONS
  // ============================================================================

  const addHabit = useCallback((input: CreateHabitInput): Habit | null => {
    const newHabit: Habit = {
      ...input,
      id: generateId(),
      createdAt: getCurrentDate(),
      archivedAt: null,
    };

    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));

    return newHabit;
  }, []);

  const updateHabit = useCallback((id: string, input: UpdateHabitInput): boolean => {
    let found = false;
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) => {
        if (habit.id === id) {
          found = true;
          return { ...habit, ...input };
        }
        return habit;
      }),
    }));
    return found;
  }, []);

  const archiveHabit = useCallback((id: string): boolean => {
    return updateHabit(id, { archivedAt: getCurrentDate() });
  }, [updateHabit]);

  const restoreHabit = useCallback((id: string): boolean => {
    return updateHabit(id, { archivedAt: null });
  }, [updateHabit]);

  const getHabitById = useCallback(
    (id: string): Habit | undefined => {
      return data.habits.find((h) => h.id === id);
    },
    [data.habits]
  );

  // ============================================================================
  // ENTRY ACTIONS
  // ============================================================================

  const addEntry = useCallback((input: CreateEntryInput): DailyEntry | null => {
    const now = getCurrentTimestamp();
    const newEntry: DailyEntry = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) => {
      // Remplace une entrée existante pour le même habit/date ou ajoute une nouvelle
      const existingIndex = prev.entries.findIndex(
        (e) => e.habitId === input.habitId && e.date === input.date
      );

      if (existingIndex >= 0) {
        const updatedEntries = [...prev.entries];
        updatedEntries[existingIndex] = {
          ...newEntry,
          createdAt: prev.entries[existingIndex].createdAt,
        };
        return { ...prev, entries: updatedEntries };
      }

      return { ...prev, entries: [...prev.entries, newEntry] };
    });

    return newEntry;
  }, []);

  const getEntriesForDate = useCallback(
    (date: string): DailyEntry[] => {
      return data.entries.filter((e) => e.date === date);
    },
    [data.entries]
  );

  const getEntriesForHabit = useCallback(
    (habitId: string): DailyEntry[] => {
      return data.entries.filter((e) => e.habitId === habitId);
    },
    [data.entries]
  );

  // ============================================================================
  // PREFERENCES ACTIONS
  // ============================================================================

  const updatePreferences = useCallback(
    (updates: Partial<AppData['preferences']>): boolean => {
      setData((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates },
      }));
      return true;
    },
    []
  );

  // ============================================================================
  // RESET
  // ============================================================================

  const resetData = useCallback((): void => {
    setData({
      ...DEFAULT_APP_DATA,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }, []);

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
    addEntry,
    getEntriesForDate,
    getEntriesForHabit,
    getHabitById,
    updatePreferences,
    resetData,
  };
}
