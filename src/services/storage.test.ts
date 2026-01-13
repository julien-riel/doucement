/**
 * Tests unitaires du service de stockage localStorage
 * Couvre: load/save/clear, gestion d'erreurs, validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadData, saveData, clearData } from './storage'
import {
  AppData,
  DEFAULT_APP_DATA,
  CURRENT_SCHEMA_VERSION,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../types'

// ============================================================================
// TEST FIXTURES
// ============================================================================

const STORAGE_KEY = 'doucement_data'

/**
 * Crée des données valides pour les tests
 */
function createValidAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits: [],
    entries: [],
    preferences: {
      onboardingCompleted: false,
      lastWeeklyReviewDate: null,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    },
    ...overrides,
  }
}

/**
 * Crée des données avec une habitude de test
 */
function createAppDataWithHabit(): AppData {
  return createValidAppData({
    habits: [
      {
        id: 'habit-1',
        name: 'Push-ups',
        emoji: '💪',
        direction: 'increase',
        startValue: 10,
        unit: 'répétitions',
        progression: { mode: 'absolute', value: 2, period: 'weekly' },
        createdAt: '2025-01-01',
        archivedAt: null,
      },
    ],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2025-01-07',
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    },
  })
}

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  localStorage.clear()
})

// ============================================================================
// LOAD DATA TESTS
// ============================================================================

describe('loadData', () => {
  describe('cas nominal', () => {
    it('retourne les données par défaut si localStorage est vide', () => {
      const result = loadData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(DEFAULT_APP_DATA)
    })

    it('charge les données existantes correctement', () => {
      const testData = createAppDataWithHabit()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))

      const result = loadData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(testData)
      expect(result.data?.habits).toHaveLength(1)
      expect(result.data?.habits[0].name).toBe('Push-ups')
    })

    it('préserve toutes les propriétés des habitudes', () => {
      const testData = createAppDataWithHabit()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))

      const result = loadData()
      const habit = result.data?.habits[0]

      expect(habit?.id).toBe('habit-1')
      expect(habit?.emoji).toBe('💪')
      expect(habit?.direction).toBe('increase')
      expect(habit?.progression?.mode).toBe('absolute')
    })

    it('préserve les préférences utilisateur', () => {
      const testData = createAppDataWithHabit()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))

      const result = loadData()

      expect(result.data?.preferences.onboardingCompleted).toBe(true)
      expect(result.data?.preferences.lastWeeklyReviewDate).toBe('2025-01-07')
    })
  })

  describe('validation des données', () => {
    it('rejette les données sans schemaVersion', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          habits: [],
          entries: [],
          preferences: { onboardingCompleted: false, lastWeeklyReviewDate: null },
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })

    it('rejette les données avec schemaVersion invalide', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 'invalid',
          habits: [],
          entries: [],
          preferences: {},
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })

    it('rejette les données avec version future', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: CURRENT_SCHEMA_VERSION + 100,
          habits: [],
          entries: [],
          preferences: {},
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Version de schéma non supportée')
    })

    it('rejette les données sans tableau habits', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: CURRENT_SCHEMA_VERSION,
          habits: 'not-an-array',
          entries: [],
          preferences: {},
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })

    it('rejette les données sans tableau entries', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: CURRENT_SCHEMA_VERSION,
          habits: [],
          entries: null,
          preferences: {},
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })

    it('rejette les données sans objet preferences', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: CURRENT_SCHEMA_VERSION,
          habits: [],
          entries: [],
          preferences: null,
        })
      )

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })
  })

  describe('gestion des erreurs', () => {
    it('gère le JSON invalide (données corrompues)', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json {{{')

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('PARSE_ERROR')
      expect(result.error?.message).toContain('corrompues')
    })

    it('gère localStorage indisponible', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage is disabled')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is disabled')
      })
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage is disabled')
      })

      const result = loadData()

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('STORAGE_UNAVAILABLE')
    })
  })
})

// ============================================================================
// SAVE DATA TESTS
// ============================================================================

describe('saveData', () => {
  describe('cas nominal', () => {
    it('sauvegarde les données correctement', () => {
      const testData = createValidAppData()

      const result = saveData(testData)

      expect(result.success).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(testData))
    })

    it('écrase les données existantes', () => {
      const oldData = createValidAppData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldData))

      const newData = createAppDataWithHabit()
      const result = saveData(newData)

      expect(result.success).toBe(true)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.habits).toHaveLength(1)
    })

    it("préserve l'intégrité des données après sauvegarde", () => {
      const testData = createAppDataWithHabit()

      saveData(testData)
      const result = loadData()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(testData)
    })

    it('sauvegarde des données avec entrées quotidiennes', () => {
      const testData = createValidAppData({
        entries: [
          {
            id: 'entry-1',
            habitId: 'habit-1',
            date: '2025-01-15',
            targetDose: 12,
            actualValue: 10,
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
        ],
      })

      const result = saveData(testData)

      expect(result.success).toBe(true)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(stored.entries).toHaveLength(1)
      expect(stored.entries[0].actualValue).toBe(10)
    })
  })

  describe('gestion des erreurs', () => {
    it('gère localStorage indisponible', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is disabled')
      })
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage is disabled')
      })

      const testData = createValidAppData()
      const result = saveData(testData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('STORAGE_UNAVAILABLE')
    })

    it('gère le quota dépassé', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
        // Let the availability check pass, fail on actual data storage
        if (key === '__doucement_test__') {
          return
        }
        throw quotaError
      })

      const testData = createValidAppData()
      const result = saveData(testData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('QUOTA_EXCEEDED')
      expect(result.error?.message).toContain('plein')
    })

    it('gère les erreurs inattendues', () => {
      const unexpectedError = new Error('Unexpected error')
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key) => {
        // Let the availability check pass, fail on actual data storage
        if (key === '__doucement_test__') {
          return
        }
        throw unexpectedError
      })

      const testData = createValidAppData()
      const result = saveData(testData)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('UNKNOWN_ERROR')
      expect(result.error?.originalError).toBe(unexpectedError)
    })
  })
})

// ============================================================================
// CLEAR DATA TESTS
// ============================================================================

describe('clearData', () => {
  it('supprime les données stockées', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createValidAppData()))

    const result = clearData()

    expect(result.success).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("réussit même si aucune donnée n'existe", () => {
    const result = clearData()

    expect(result.success).toBe(true)
  })

  it('loadData retourne les données par défaut après clearData', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createAppDataWithHabit()))

    clearData()
    const result = loadData()

    expect(result.success).toBe(true)
    expect(result.data).toEqual(DEFAULT_APP_DATA)
  })

  it('gère localStorage indisponible', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage is disabled')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('localStorage is disabled')
    })

    const result = clearData()

    expect(result.success).toBe(false)
    expect(result.error?.type).toBe('STORAGE_UNAVAILABLE')
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('intégration load/save/clear', () => {
  it('cycle complet: save -> load -> clear -> load', () => {
    const testData = createAppDataWithHabit()

    // Save
    const saveResult = saveData(testData)
    expect(saveResult.success).toBe(true)

    // Load
    const loadResult1 = loadData()
    expect(loadResult1.success).toBe(true)
    expect(loadResult1.data).toEqual(testData)

    // Clear
    const clearResult = clearData()
    expect(clearResult.success).toBe(true)

    // Load again
    const loadResult2 = loadData()
    expect(loadResult2.success).toBe(true)
    expect(loadResult2.data).toEqual(DEFAULT_APP_DATA)
  })

  it("mutations multiples préservent l'intégrité", () => {
    const data1 = createValidAppData({
      habits: [
        {
          id: 'habit-1',
          name: 'Méditation',
          emoji: '🧘',
          direction: 'maintain',
          startValue: 5,
          unit: 'minutes',
          progression: null,
          createdAt: '2025-01-01',
          archivedAt: null,
        },
      ],
    })

    saveData(data1)

    // Ajout d'une entrée
    const result1 = loadData()
    const updatedData = {
      ...result1.data!,
      entries: [
        {
          id: 'entry-1',
          habitId: 'habit-1',
          date: '2025-01-15',
          targetDose: 5,
          actualValue: 5,
          createdAt: '2025-01-15T08:00:00Z',
          updatedAt: '2025-01-15T08:00:00Z',
        },
      ],
    }

    saveData(updatedData)

    // Modification des préférences
    const result2 = loadData()
    const finalData = {
      ...result2.data!,
      preferences: {
        ...result2.data!.preferences,
        onboardingCompleted: true,
      },
    }

    saveData(finalData)

    // Vérification finale
    const finalResult = loadData()
    expect(finalResult.data?.habits).toHaveLength(1)
    expect(finalResult.data?.entries).toHaveLength(1)
    expect(finalResult.data?.preferences.onboardingCompleted).toBe(true)
  })
})

// ============================================================================
// EDGE CASES
// ============================================================================

describe('cas limites', () => {
  it("gère les caractères spéciaux dans les noms d'habitudes", () => {
    const testData = createValidAppData({
      habits: [
        {
          id: 'habit-special',
          name: 'Habitude avec émojis 🎉 et "guillemets" et \\backslash',
          emoji: '🏃',
          direction: 'increase',
          startValue: 1,
          unit: 'fois',
          progression: null,
          createdAt: '2025-01-01',
          archivedAt: null,
        },
      ],
    })

    saveData(testData)
    const result = loadData()

    expect(result.success).toBe(true)
    expect(result.data?.habits[0].name).toBe(
      'Habitude avec émojis 🎉 et "guillemets" et \\backslash'
    )
  })

  it('gère les grandes quantités de données', () => {
    const manyHabits = Array.from({ length: 100 }, (_, i) => ({
      id: `habit-${i}`,
      name: `Habitude ${i}`,
      emoji: '📝',
      direction: 'increase' as const,
      startValue: i,
      unit: 'unités',
      progression: null,
      createdAt: '2025-01-01',
      archivedAt: null,
    }))

    const manyEntries = Array.from({ length: 1000 }, (_, i) => ({
      id: `entry-${i}`,
      habitId: `habit-${i % 100}`,
      date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
      targetDose: 10,
      actualValue: 8,
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    }))

    const testData = createValidAppData({
      habits: manyHabits,
      entries: manyEntries,
    })

    const saveResult = saveData(testData)
    expect(saveResult.success).toBe(true)

    const loadResult = loadData()
    expect(loadResult.success).toBe(true)
    expect(loadResult.data?.habits).toHaveLength(100)
    expect(loadResult.data?.entries).toHaveLength(1000)
  })

  it('gère les valeurs null et undefined correctement', () => {
    const testData = createValidAppData({
      habits: [
        {
          id: 'habit-null',
          name: 'Sans description',
          emoji: '📝',
          direction: 'maintain',
          startValue: 5,
          unit: 'minutes',
          progression: null,
          description: undefined,
          targetValue: undefined,
          createdAt: '2025-01-01',
          archivedAt: null,
        },
      ],
    })

    saveData(testData)
    const result = loadData()

    expect(result.success).toBe(true)
    expect(result.data?.habits[0].progression).toBeNull()
    expect(result.data?.habits[0].archivedAt).toBeNull()
  })

  it('préserve les nouveaux champs timeOfDay et cumulativeOperations', () => {
    const testData = createValidAppData({
      habits: [
        {
          id: 'habit-with-new-fields',
          name: 'Habitude du matin',
          emoji: '🌅',
          direction: 'increase',
          startValue: 10,
          unit: 'minutes',
          progression: { mode: 'absolute', value: 1, period: 'weekly' },
          createdAt: '2025-01-01',
          archivedAt: null,
          timeOfDay: 'morning',
          cumulativeOperations: [
            { id: 'op-1', value: 5, timestamp: '2025-01-15T08:00:00Z' },
            { id: 'op-2', value: 3, timestamp: '2025-01-15T12:00:00Z' },
          ],
        },
      ],
    })

    saveData(testData)
    const result = loadData()

    expect(result.success).toBe(true)
    expect(result.data?.habits[0].timeOfDay).toBe('morning')
    expect(result.data?.habits[0].cumulativeOperations).toHaveLength(2)
    expect(result.data?.habits[0].cumulativeOperations?.[0].value).toBe(5)
    expect(result.data?.habits[0].cumulativeOperations?.[1].value).toBe(3)
  })

  it('préserve les données existantes sans nouveaux champs optionnels', () => {
    const testData = createValidAppData({
      habits: [
        {
          id: 'habit-legacy',
          name: 'Habitude existante',
          emoji: '💪',
          direction: 'increase',
          startValue: 10,
          unit: 'répétitions',
          progression: { mode: 'percentage', value: 5, period: 'weekly' },
          createdAt: '2025-01-01',
          archivedAt: null,
          // Pas de timeOfDay ni cumulativeOperations
        },
      ],
    })

    saveData(testData)
    const result = loadData()

    expect(result.success).toBe(true)
    expect(result.data?.habits[0].timeOfDay).toBeUndefined()
    expect(result.data?.habits[0].cumulativeOperations).toBeUndefined()
    // Vérifier que les autres champs sont préservés
    expect(result.data?.habits[0].name).toBe('Habitude existante')
    expect(result.data?.habits[0].startValue).toBe(10)
  })
})
