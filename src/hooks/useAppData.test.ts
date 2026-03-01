/**
 * Tests unitaires du hook useAppData
 * Couvre:
 * - Mode de saisie cumulative (entryMode)
 * - Opérations compteur (addCounterOperation, undoLastOperation)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppData } from './useAppData'
import type { Habit, DailyEntry } from '../types'

// ============================================================================
// MOCKS
// ============================================================================

// Mock storage service
const mockLoadData = vi.fn()
const mockSaveData = vi.fn()

vi.mock('../services/storage', () => ({
  loadData: () => mockLoadData(),
  saveData: (data: unknown) => mockSaveData(data),
}))

// Mock getCurrentDate
vi.mock('../utils', () => ({
  getCurrentDate: () => '2026-01-11',
}))

// ============================================================================
// CONSTANTS
// ============================================================================

const TEST_TODAY = '2026-01-11'

// ============================================================================
// FIXTURES
// ============================================================================

/**
 * Crée une habitude de test avec mode replace (défaut)
 */
function createReplaceHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-replace',
    name: 'Pompes',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'répétitions',
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    createdAt: '2026-01-01',
    archivedAt: null,
    entryMode: 'replace',
    ...overrides,
  }
}

/**
 * Crée une habitude de test avec mode cumulative
 */
function createCumulativeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-cumulative',
    name: 'Verres d eau',
    emoji: '💧',
    direction: 'increase',
    startValue: 8,
    unit: 'verres',
    progression: null,
    createdAt: '2026-01-01',
    archivedAt: null,
    entryMode: 'cumulative',
    ...overrides,
  }
}

/**
 * Crée une habitude de test avec mode compteur
 */
function createCounterHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-counter',
    name: 'Cigarettes',
    emoji: '🚭',
    direction: 'decrease',
    startValue: 10,
    unit: 'cigarettes',
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    createdAt: '2026-01-01',
    archivedAt: null,
    trackingMode: 'counter',
    ...overrides,
  }
}

/**
 * Crée les données initiales pour les tests
 */
function createInitialData(habits: Habit[] = [], entries: DailyEntry[] = []) {
  return {
    success: true,
    data: {
      schemaVersion: 9,
      habits,
      entries,
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' },
        },
        theme: 'system' as const,
      },
    },
  }
}

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  mockLoadData.mockReset()
  mockSaveData.mockReset()
  mockSaveData.mockReturnValue({ success: true })
})

afterEach(() => {
  vi.clearAllMocks()
})

// ============================================================================
// HABIT MUTATION TESTS
// ============================================================================

describe('useAppData - Habit Mutations', () => {
  describe('addHabit', () => {
    it('ajoute une habitude avec les champs par défaut', async () => {
      mockLoadData.mockReturnValue(createInitialData())

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let newHabit: Habit | null = null
      act(() => {
        newHabit = result.current.addHabit({
          name: 'Méditation',
          emoji: '🧘',
          direction: 'increase',
          startValue: 5,
          unit: 'minutes',
          progression: { mode: 'absolute', value: 1, period: 'weekly' },
        })
      })

      expect(newHabit).not.toBeNull()
      expect(newHabit!.name).toBe('Méditation')
      expect(newHabit!.emoji).toBe('🧘')
      expect(newHabit!.direction).toBe('increase')
      expect(newHabit!.startValue).toBe(5)
      expect(newHabit!.createdAt).toBe(TEST_TODAY)
      expect(newHabit!.archivedAt).toBeNull()
      expect(newHabit!.id).toBeDefined()
      expect(result.current.data.habits).toHaveLength(1)
    })

    it('génère des ids uniques pour chaque habitude', async () => {
      mockLoadData.mockReturnValue(createInitialData())

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let habit1: Habit | null = null
      let habit2: Habit | null = null

      act(() => {
        habit1 = result.current.addHabit({
          name: 'Habit 1',
          emoji: '🏃',
          direction: 'increase',
          startValue: 10,
          unit: 'min',
          progression: null,
        })
      })

      act(() => {
        habit2 = result.current.addHabit({
          name: 'Habit 2',
          emoji: '📚',
          direction: 'increase',
          startValue: 20,
          unit: 'pages',
          progression: null,
        })
      })

      expect(habit1!.id).not.toBe(habit2!.id)
      expect(result.current.data.habits).toHaveLength(2)
    })

    it('apparaît dans activeHabits', async () => {
      mockLoadData.mockReturnValue(createInitialData())

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addHabit({
          name: 'Test',
          emoji: '✅',
          direction: 'increase',
          startValue: 1,
          unit: 'x',
          progression: null,
        })
      })

      expect(result.current.activeHabits).toHaveLength(1)
      expect(result.current.archivedHabits).toHaveLength(0)
    })
  })

  describe('updateHabit', () => {
    it('met à jour les champs spécifiés', async () => {
      const habit = createReplaceHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let updated: boolean = false
      act(() => {
        updated = result.current.updateHabit(habit.id, { name: 'Pompes modifiées', unit: 'reps' })
      })

      expect(updated).toBe(true)
      expect(result.current.data.habits[0].name).toBe('Pompes modifiées')
      expect(result.current.data.habits[0].unit).toBe('reps')
      // Les autres champs restent inchangés
      expect(result.current.data.habits[0].emoji).toBe('💪')
    })

    it('retourne false pour une habitude inexistante', async () => {
      const habit = createReplaceHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let updated: boolean = true
      act(() => {
        updated = result.current.updateHabit('inexistant', { name: 'Fail' })
      })

      expect(updated).toBe(false)
    })

    it('ne modifie pas les autres habitudes', async () => {
      const habit1 = createReplaceHabit({ id: 'h1', name: 'Habit 1' })
      const habit2 = createReplaceHabit({ id: 'h2', name: 'Habit 2' })
      mockLoadData.mockReturnValue(createInitialData([habit1, habit2]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateHabit('h1', { name: 'Modified' })
      })

      expect(result.current.data.habits[0].name).toBe('Modified')
      expect(result.current.data.habits[1].name).toBe('Habit 2')
    })
  })

  describe('archiveHabit', () => {
    it('archive une habitude active', async () => {
      const habit = createReplaceHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeHabits).toHaveLength(1)
      expect(result.current.archivedHabits).toHaveLength(0)

      let archived: boolean = false
      act(() => {
        archived = result.current.archiveHabit(habit.id)
      })

      expect(archived).toBe(true)
      expect(result.current.data.habits[0].archivedAt).toBe(TEST_TODAY)
      expect(result.current.activeHabits).toHaveLength(0)
      expect(result.current.archivedHabits).toHaveLength(1)
    })

    it('retourne false pour une habitude inexistante', async () => {
      mockLoadData.mockReturnValue(createInitialData())

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let archived: boolean = true
      act(() => {
        archived = result.current.archiveHabit('inexistant')
      })

      expect(archived).toBe(false)
    })
  })

  describe('restoreHabit', () => {
    it('restaure une habitude archivée', async () => {
      const habit = createReplaceHabit({ archivedAt: '2026-01-10' })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeHabits).toHaveLength(0)
      expect(result.current.archivedHabits).toHaveLength(1)

      let restored: boolean = false
      act(() => {
        restored = result.current.restoreHabit(habit.id)
      })

      expect(restored).toBe(true)
      expect(result.current.data.habits[0].archivedAt).toBeNull()
      expect(result.current.activeHabits).toHaveLength(1)
      expect(result.current.archivedHabits).toHaveLength(0)
    })

    it('retourne false pour une habitude inexistante', async () => {
      mockLoadData.mockReturnValue(createInitialData())

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let restored: boolean = true
      act(() => {
        restored = result.current.restoreHabit('inexistant')
      })

      expect(restored).toBe(false)
    })
  })
})

// ============================================================================
// CUMULATIVE ENTRY MODE TESTS
// ============================================================================

describe('useAppData - Mode Cumulative (unit.2)', () => {
  describe('addEntry avec entryMode: replace (défaut)', () => {
    it('remplace la valeur existante pour la même date', async () => {
      const habit = createReplaceHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      // Attendre le chargement
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Première entrée: 5 répétitions
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 5,
        })
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(5)

      // Deuxième entrée: 8 répétitions (remplace)
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 8,
        })
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(8)
    })

    it('crée des entrées séparées pour des dates différentes', async () => {
      const habit = createReplaceHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Entrée pour aujourd'hui
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 5,
        })
      })

      // Entrée pour demain
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: '2026-01-12',
          targetDose: 10,
          actualValue: 7,
        })
      })

      expect(result.current.data.entries).toHaveLength(2)
      expect(result.current.data.entries[0].actualValue).toBe(5)
      expect(result.current.data.entries[1].actualValue).toBe(7)
    })
  })

  describe('addEntry avec entryMode: cumulative', () => {
    it('additionne les valeurs pour la même date', async () => {
      const habit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Premier verre d'eau: 2
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(2)

      // Deuxième saisie: +3 verres
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Devrait être 2 + 3 = 5
      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(5)

      // Troisième saisie: +2 verres
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      // Devrait être 5 + 2 = 7
      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(7)
    })

    it('crée des entrées séparées pour des dates différentes', async () => {
      const habit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Entrée pour aujourd'hui
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Entrée pour demain (nouvelle entrée, pas cumulative)
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: '2026-01-12',
          targetDose: 8,
          actualValue: 2,
        })
      })

      expect(result.current.data.entries).toHaveLength(2)
      expect(result.current.data.entries[0].actualValue).toBe(3)
      expect(result.current.data.entries[1].actualValue).toBe(2)
    })

    it('fonctionne avec des valeurs décimales', async () => {
      const habit = createCumulativeHabit({ unit: 'km' })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 0.5 km le matin
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 5,
          actualValue: 0.5,
        })
      })

      // 1.5 km à midi
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 5,
          actualValue: 1.5,
        })
      })

      expect(result.current.data.entries[0].actualValue).toBe(2)
    })
  })

  describe('addEntry sans entryMode défini (comportement par défaut)', () => {
    it('utilise le mode replace quand entryMode est undefined', async () => {
      const habit = createReplaceHabit({ entryMode: undefined })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Première entrée
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 5,
        })
      })

      // Deuxième entrée (devrait remplacer)
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 8,
        })
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(8)
    })
  })

  describe('addEntry - cas limites', () => {
    it('gère correctement zéro en mode cumulative', async () => {
      const habit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Ajouter 3 verres
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Ajouter 0 (ne devrait pas changer la valeur)
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 0,
        })
      })

      expect(result.current.data.entries[0].actualValue).toBe(3)
    })

    it('cumule correctement pour des habitudes decrease', async () => {
      const habit = createCumulativeHabit({
        id: 'cigarettes',
        name: 'Cigarettes',
        emoji: '🚭',
        direction: 'decrease',
        startValue: 10,
        unit: 'cigarettes',
      })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // 2 cigarettes le matin
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      // 3 cigarettes l'après-midi
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Total: 5 cigarettes
      expect(result.current.data.entries[0].actualValue).toBe(5)
    })

    it('préserve le createdAt original lors du cumul', async () => {
      const habit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Première entrée
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      const originalCreatedAt = result.current.data.entries[0].createdAt

      // Pause pour avoir un timestamp différent
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Deuxième entrée
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Le createdAt devrait être préservé
      expect(result.current.data.entries[0].createdAt).toBe(originalCreatedAt)
    })

    it('met à jour le updatedAt lors du cumul', async () => {
      const habit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Première entrée
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      const originalUpdatedAt = result.current.data.entries[0].updatedAt

      // Pause pour avoir un timestamp différent
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Deuxième entrée
      act(() => {
        result.current.addEntry({
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      // Le updatedAt devrait être différent (plus récent)
      expect(result.current.data.entries[0].updatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('addEntry - multiples habitudes', () => {
    it('cumule correctement quand plusieurs habitudes ont des modes différents', async () => {
      const replaceHabit = createReplaceHabit()
      const cumulativeHabit = createCumulativeHabit()
      mockLoadData.mockReturnValue(createInitialData([replaceHabit, cumulativeHabit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Entrée replace: 5
      act(() => {
        result.current.addEntry({
          habitId: replaceHabit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 5,
        })
      })

      // Entrée cumulative: 2
      act(() => {
        result.current.addEntry({
          habitId: cumulativeHabit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 2,
        })
      })

      // Nouvelle entrée replace: 8 (remplace)
      act(() => {
        result.current.addEntry({
          habitId: replaceHabit.id,
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 8,
        })
      })

      // Nouvelle entrée cumulative: 3 (additionne)
      act(() => {
        result.current.addEntry({
          habitId: cumulativeHabit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 3,
        })
      })

      expect(result.current.data.entries).toHaveLength(2)

      const replaceEntry = result.current.data.entries.find((e) => e.habitId === replaceHabit.id)
      const cumulativeEntry = result.current.data.entries.find(
        (e) => e.habitId === cumulativeHabit.id
      )

      expect(replaceEntry?.actualValue).toBe(8) // Remplacé
      expect(cumulativeEntry?.actualValue).toBe(5) // 2 + 3 = 5
    })
  })
})

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('useAppData - Fonctions helper', () => {
  describe('getEntriesForDate', () => {
    it('retourne les entrées pour une date donnée', async () => {
      const habit = createCumulativeHabit()
      const existingEntry: DailyEntry = {
        id: 'entry-1',
        habitId: habit.id,
        date: TEST_TODAY,
        targetDose: 8,
        actualValue: 5,
        createdAt: '2026-01-11T10:00:00.000Z',
        updatedAt: '2026-01-11T10:00:00.000Z',
      }
      mockLoadData.mockReturnValue(createInitialData([habit], [existingEntry]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const entries = result.current.getEntriesForDate(TEST_TODAY)
      expect(entries).toHaveLength(1)
      expect(entries[0].actualValue).toBe(5)
    })
  })

  describe('getEntriesForHabit', () => {
    it('retourne les entrées pour une habitude donnée', async () => {
      const habit = createCumulativeHabit()
      const entries: DailyEntry[] = [
        {
          id: 'entry-1',
          habitId: habit.id,
          date: '2026-01-10',
          targetDose: 8,
          actualValue: 4,
          createdAt: '2026-01-10T10:00:00.000Z',
          updatedAt: '2026-01-10T10:00:00.000Z',
        },
        {
          id: 'entry-2',
          habitId: habit.id,
          date: TEST_TODAY,
          targetDose: 8,
          actualValue: 6,
          createdAt: '2026-01-11T10:00:00.000Z',
          updatedAt: '2026-01-11T10:00:00.000Z',
        },
      ]
      mockLoadData.mockReturnValue(createInitialData([habit], entries))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const habitEntries = result.current.getEntriesForHabit(habit.id)
      expect(habitEntries).toHaveLength(2)
    })
  })
})

// ============================================================================
// COUNTER OPERATION TESTS (test.1)
// ============================================================================

describe('useAppData - Counter Operations (test.1)', () => {
  describe('addCounterOperation', () => {
    it('crée une nouvelle entrée avec une opération add', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Ajouter une opération +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(1)
      expect(result.current.data.entries[0].operations).toHaveLength(1)
      expect(result.current.data.entries[0].operations![0].type).toBe('add')
      expect(result.current.data.entries[0].operations![0].value).toBe(1)
    })

    it('crée une nouvelle entrée avec une opération subtract', async () => {
      const habit = createCounterHabit({ direction: 'increase' })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Ajouter une opération -1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'subtract', 1)
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(-1)
      expect(result.current.data.entries[0].operations![0].type).toBe('subtract')
    })

    it('ajoute des opérations à une entrée existante', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      // +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      // +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      expect(result.current.data.entries).toHaveLength(1)
      expect(result.current.data.entries[0].actualValue).toBe(3)
      expect(result.current.data.entries[0].operations).toHaveLength(3)
    })

    it('calcule correctement les opérations mixtes add/subtract', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      // +1
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      // -1 (correction)
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'subtract', 1)
      })

      // +3
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 3)
      })

      // 1 + 1 - 1 + 3 = 4
      expect(result.current.data.entries[0].actualValue).toBe(4)
      expect(result.current.data.entries[0].operations).toHaveLength(4)
    })

    it('utilise la valeur absolue pour les opérations', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Passer une valeur négative - devrait être convertie en positive
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', -5)
      })

      expect(result.current.data.entries[0].actualValue).toBe(5)
      expect(result.current.data.entries[0].operations![0].value).toBe(5)
    })

    it('retourne null pour une habitude inexistante', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let entry: DailyEntry | null = null
      act(() => {
        entry = result.current.addCounterOperation('inexistant', TEST_TODAY, 'add', 1)
      })

      expect(entry).toBeNull()
      expect(result.current.data.entries).toHaveLength(0)
    })

    it('ajoute une note optionnelle à l opération', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1, 'Après le café')
      })

      expect(result.current.data.entries[0].operations![0].note).toBe('Après le café')
    })

    it('génère un id unique pour chaque opération', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      const ops = result.current.data.entries[0].operations!
      expect(ops[0].id).toBeDefined()
      expect(ops[1].id).toBeDefined()
      expect(ops[0].id).not.toBe(ops[1].id)
    })

    it('ajoute un timestamp à chaque opération', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      const timestamp = result.current.data.entries[0].operations![0].timestamp
      expect(timestamp).toBeDefined()
      expect(typeof timestamp).toBe('string')
      // Vérifier que c'est une date ISO valide
      expect(new Date(timestamp).toISOString()).toBe(timestamp)
    })
  })

  describe('undoLastOperation', () => {
    it('supprime la dernière opération', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Ajouter 3 opérations
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      expect(result.current.data.entries[0].actualValue).toBe(3)
      expect(result.current.data.entries[0].operations).toHaveLength(3)

      // Annuler la dernière
      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(result.current.data.entries[0].actualValue).toBe(2)
      expect(result.current.data.entries[0].operations).toHaveLength(2)
    })

    it('recalcule correctement la valeur après undo', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // +2, +3, -1 = 4
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 2)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 3)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'subtract', 1)
      })

      expect(result.current.data.entries[0].actualValue).toBe(4)

      // Undo le -1 -> 2 + 3 = 5
      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(result.current.data.entries[0].actualValue).toBe(5)
    })

    it('retourne null si pas d entrée existante', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let entry: DailyEntry | null = null
      act(() => {
        entry = result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(entry).toBeNull()
    })

    it('retourne null si pas d opérations', async () => {
      const habit = createCounterHabit()
      const existingEntry: DailyEntry = {
        id: 'entry-1',
        habitId: habit.id,
        date: TEST_TODAY,
        targetDose: 10,
        actualValue: 5,
        createdAt: '2026-01-11T10:00:00.000Z',
        updatedAt: '2026-01-11T10:00:00.000Z',
        // Pas d'operations
      }
      mockLoadData.mockReturnValue(createInitialData([habit], [existingEntry]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let entry: DailyEntry | null = null
      act(() => {
        entry = result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(entry).toBeNull()
    })

    it('laisse un tableau vide après undo de toutes les opérations', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Ajouter une opération
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 5)
      })

      expect(result.current.data.entries[0].actualValue).toBe(5)

      // Annuler
      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(result.current.data.entries[0].actualValue).toBe(0)
      expect(result.current.data.entries[0].operations).toHaveLength(0)
    })

    it('met à jour updatedAt après undo', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      const updatedAtBefore = result.current.data.entries[0].updatedAt

      // Petite pause pour avoir un timestamp différent
      await new Promise((resolve) => setTimeout(resolve, 10))

      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      expect(result.current.data.entries[0].updatedAt).not.toBe(updatedAtBefore)
    })
  })

  describe('opérations compteur - scénarios réels', () => {
    it('simule une journée de suivi de cigarettes', async () => {
      const habit = createCounterHabit({
        name: 'Cigarettes',
        direction: 'decrease',
        startValue: 10,
      })
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Matin: 1 cigarette
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1, 'Matin')
      })

      // Pause café: 1 cigarette
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1, 'Pause café')
      })

      // Oops, erreur de saisie, annuler
      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      // Après-midi: 2 cigarettes
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 2, 'Après-midi')
      })

      // Soirée: 1 cigarette
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1, 'Soirée')
      })

      // Total: 1 + 2 + 1 = 4 (au lieu de 1 + 1 + 2 + 1 = 5 grâce à l'undo)
      // 3 opérations: Matin, Après-midi, Soirée (Pause café a été annulé)
      expect(result.current.data.entries[0].actualValue).toBe(4)
      expect(result.current.data.entries[0].operations).toHaveLength(3)

      // Vérifier les notes
      const ops = result.current.data.entries[0].operations!
      expect(ops[0].note).toBe('Matin')
      expect(ops[1].note).toBe('Après-midi')
      expect(ops[2].note).toBe('Soirée')
    })

    it('gère des entrées sur plusieurs jours indépendamment', async () => {
      const habit = createCounterHabit()
      mockLoadData.mockReturnValue(createInitialData([habit]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Jour 1: 3 opérations
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, TEST_TODAY, 'add', 1)
      })

      // Jour 2: 2 opérations
      const tomorrow = '2026-01-12'
      act(() => {
        result.current.addCounterOperation(habit.id, tomorrow, 'add', 1)
      })
      act(() => {
        result.current.addCounterOperation(habit.id, tomorrow, 'add', 1)
      })

      expect(result.current.data.entries).toHaveLength(2)

      const todayEntry = result.current.data.entries.find((e) => e.date === TEST_TODAY)
      const tomorrowEntry = result.current.data.entries.find((e) => e.date === tomorrow)

      expect(todayEntry?.actualValue).toBe(3)
      expect(todayEntry?.operations).toHaveLength(3)

      expect(tomorrowEntry?.actualValue).toBe(2)
      expect(tomorrowEntry?.operations).toHaveLength(2)

      // Undo sur aujourd'hui ne doit pas affecter demain
      act(() => {
        result.current.undoLastOperation(habit.id, TEST_TODAY)
      })

      const todayEntryAfterUndo = result.current.data.entries.find((e) => e.date === TEST_TODAY)
      const tomorrowEntryAfterUndo = result.current.data.entries.find((e) => e.date === tomorrow)

      expect(todayEntryAfterUndo?.actualValue).toBe(2)
      expect(tomorrowEntryAfterUndo?.actualValue).toBe(2) // Inchangé
    })
  })
})

// ============================================================================
// ENTRY INDEX TESTS (O(1) LOOKUPS)
// ============================================================================

describe('useAppData - Entry Indexes', () => {
  const habit1 = createReplaceHabit({ id: 'h1', name: 'Habit 1' })
  const habit2 = createReplaceHabit({ id: 'h2', name: 'Habit 2' })

  const entries: DailyEntry[] = [
    {
      id: 'e1',
      habitId: 'h1',
      date: '2026-01-10',
      targetDose: 10,
      actualValue: 8,
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'e2',
      habitId: 'h2',
      date: '2026-01-10',
      targetDose: 5,
      actualValue: 5,
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-01-10T09:00:00Z',
    },
    {
      id: 'e3',
      habitId: 'h1',
      date: '2026-01-11',
      targetDose: 10,
      actualValue: 10,
      createdAt: '2026-01-11T08:00:00Z',
      updatedAt: '2026-01-11T08:00:00Z',
    },
  ]

  describe('getEntriesForDate', () => {
    it('retourne les entrées pour une date donnée via index', async () => {
      mockLoadData.mockReturnValue(createInitialData([habit1, habit2], entries))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const jan10Entries = result.current.getEntriesForDate('2026-01-10')
      expect(jan10Entries).toHaveLength(2)
      expect(jan10Entries.map((e) => e.id).sort()).toEqual(['e1', 'e2'])

      const jan11Entries = result.current.getEntriesForDate('2026-01-11')
      expect(jan11Entries).toHaveLength(1)
      expect(jan11Entries[0].id).toBe('e3')
    })

    it('retourne un tableau vide pour une date sans entrées', async () => {
      mockLoadData.mockReturnValue(createInitialData([habit1], entries))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getEntriesForDate('2026-01-15')).toEqual([])
    })
  })

  describe('getEntriesForHabit', () => {
    it('retourne les entrées pour une habitude donnée via index', async () => {
      mockLoadData.mockReturnValue(createInitialData([habit1, habit2], entries))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const h1Entries = result.current.getEntriesForHabit('h1')
      expect(h1Entries).toHaveLength(2)
      expect(h1Entries.map((e) => e.id).sort()).toEqual(['e1', 'e3'])

      const h2Entries = result.current.getEntriesForHabit('h2')
      expect(h2Entries).toHaveLength(1)
      expect(h2Entries[0].id).toBe('e2')
    })

    it('retourne un tableau vide pour une habitude sans entrées', async () => {
      mockLoadData.mockReturnValue(createInitialData([habit1], entries))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getEntriesForHabit('nonexistent')).toEqual([])
    })
  })

  describe('index updates after mutations', () => {
    it("met à jour les index après ajout d'une entrée", async () => {
      mockLoadData.mockReturnValue(createInitialData([habit1]))

      const { result } = renderHook(() => useAppData())

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Initialement vide
      expect(result.current.getEntriesForDate(TEST_TODAY)).toHaveLength(0)
      expect(result.current.getEntriesForHabit('h1')).toHaveLength(0)

      // Ajouter une entrée
      act(() => {
        result.current.addEntry({
          habitId: 'h1',
          date: TEST_TODAY,
          targetDose: 10,
          actualValue: 7,
        })
      })

      // Les index doivent être à jour
      expect(result.current.getEntriesForDate(TEST_TODAY)).toHaveLength(1)
      expect(result.current.getEntriesForHabit('h1')).toHaveLength(1)
    })
  })
})
