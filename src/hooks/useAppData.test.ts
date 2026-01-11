/**
 * Tests unitaires du hook useAppData
 * Couvre: le mode de saisie cumulative (entryMode)
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
 * Crée les données initiales pour les tests
 */
function createInitialData(habits: Habit[] = [], entries: DailyEntry[] = []) {
  return {
    success: true,
    data: {
      schemaVersion: 8,
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
