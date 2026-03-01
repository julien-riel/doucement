/**
 * Tests d'intégrité des données
 * Couvre:
 * - Migration roundtrip v1→v11 avec données réalistes
 * - Import/export roundtrip (export → import → vérifier identité)
 * - Validation de schéma sur données de chaque version
 * - Résistance aux données corrompues
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CURRENT_SCHEMA_VERSION } from '../types'
import type { AppData, Habit, DailyEntry } from '../types'
import { runMigrations, needsMigration, MIGRATIONS } from './migration'
import { validateImportData, validateHabit, validateEntry } from './validation'
import { importDataReplace } from './importExport'
import { saveData, loadData, STORAGE_KEY } from './storage'

// ============================================================================
// FIXTURES
// ============================================================================

/**
 * Données réalistes en schéma v1
 */
function createV1Data(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    habits: [
      {
        id: 'habit-1',
        name: 'Push-ups',
        emoji: '💪',
        direction: 'increase',
        startValue: 10,
        unit: 'reps',
        progression: {
          mode: 'absolute',
          value: 2,
          period: 'weekly',
        },
        createdAt: '2025-12-01',
        archivedAt: null,
      },
      {
        id: 'habit-2',
        name: 'Cigarettes',
        emoji: '🚭',
        direction: 'decrease',
        startValue: 15,
        unit: 'cigarettes',
        progression: {
          mode: 'percentage',
          value: 5,
          period: 'weekly',
        },
        createdAt: '2025-12-15',
        archivedAt: null,
      },
      {
        id: 'habit-3',
        name: 'Méditation',
        emoji: '🧘',
        direction: 'maintain',
        startValue: 10,
        unit: 'minutes',
        progression: null,
        createdAt: '2026-01-01',
        archivedAt: '2026-01-20',
      },
    ],
    entries: [
      {
        id: 'entry-1',
        habitId: 'habit-1',
        date: '2025-12-01',
        targetDose: 10,
        actualValue: 10,
        createdAt: '2025-12-01T08:00:00Z',
        updatedAt: '2025-12-01T08:00:00Z',
      },
      {
        id: 'entry-2',
        habitId: 'habit-1',
        date: '2025-12-02',
        targetDose: 10,
        actualValue: 12,
        createdAt: '2025-12-02T08:00:00Z',
        updatedAt: '2025-12-02T08:00:00Z',
      },
      {
        id: 'entry-3',
        habitId: 'habit-2',
        date: '2025-12-15',
        targetDose: 15,
        actualValue: 14,
        createdAt: '2025-12-15T10:00:00Z',
        updatedAt: '2025-12-15T10:00:00Z',
      },
    ],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: null,
    },
  }
}

/**
 * Données complètes en schéma v11 (version actuelle)
 */
function createV11Data(): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits: [
      {
        id: 'habit-1',
        name: 'Push-ups',
        emoji: '💪',
        direction: 'increase',
        startValue: 10,
        unit: 'reps',
        progression: {
          mode: 'absolute',
          value: 2,
          period: 'weekly',
        },
        createdAt: '2025-12-01',
        archivedAt: null,
        trackingMode: 'detailed',
        trackingFrequency: 'daily',
        entryMode: 'replace',
      },
      {
        id: 'habit-2',
        name: 'Eau',
        emoji: '💧',
        direction: 'increase',
        startValue: 8,
        unit: 'verres',
        progression: null,
        createdAt: '2026-01-01',
        archivedAt: null,
        trackingMode: 'counter',
        entryMode: 'cumulative',
      },
    ],
    entries: [
      {
        id: 'entry-1',
        habitId: 'habit-1',
        date: '2025-12-01',
        targetDose: 10,
        actualValue: 10,
        createdAt: '2025-12-01T08:00:00Z',
        updatedAt: '2025-12-01T08:00:00Z',
      },
      {
        id: 'entry-2',
        habitId: 'habit-2',
        date: '2026-01-01',
        targetDose: 8,
        actualValue: 5,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T18:00:00Z',
        operations: [
          { id: 'op-1', type: 'add', value: 3, timestamp: '2026-01-01T10:00:00Z' },
          { id: 'op-2', type: 'add', value: 2, timestamp: '2026-01-01T14:00:00Z' },
        ],
      },
    ],
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: '2026-02-23',
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' },
      },
      theme: 'system',
    },
  }
}

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

// ============================================================================
// 1. MIGRATION ROUNDTRIP v1→v11
// ============================================================================

describe('Migration roundtrip v1→v11', () => {
  it('migre des données v1 réalistes vers v11 sans perte', () => {
    const v1Data = createV1Data()

    expect(needsMigration(v1Data)).toBe(true)

    const result = runMigrations(v1Data)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.fromVersion).toBe(1)
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrationsApplied.length).toBeGreaterThan(0)
  })

  it('préserve toutes les habitudes après migration', () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    expect(data.habits).toHaveLength(3)

    const habit1 = data.habits.find((h: Habit) => h.id === 'habit-1')
    expect(habit1).toBeDefined()
    expect(habit1!.name).toBe('Push-ups')
    expect(habit1!.emoji).toBe('💪')
    expect(habit1!.direction).toBe('increase')
    expect(habit1!.startValue).toBe(10)
    expect(habit1!.unit).toBe('reps')
    expect(habit1!.progression).toEqual({
      mode: 'absolute',
      value: 2,
      period: 'weekly',
    })
    expect(habit1!.createdAt).toBe('2025-12-01')
    expect(habit1!.archivedAt).toBeNull()
  })

  it('préserve toutes les entrées après migration', () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    expect(data.entries).toHaveLength(3)

    const entry1 = data.entries.find((e: DailyEntry) => e.id === 'entry-1')
    expect(entry1).toBeDefined()
    expect(entry1!.habitId).toBe('habit-1')
    expect(entry1!.date).toBe('2025-12-01')
    expect(entry1!.targetDose).toBe(10)
    expect(entry1!.actualValue).toBe(10)
  })

  it('ajoute les préférences de notification après migration v1→v2', () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    expect(data.preferences.notifications).toBeDefined()
    expect(data.preferences.notifications.enabled).toBe(false)
    expect(data.preferences.notifications.morningReminder).toBeDefined()
  })

  it('ajoute la préférence de thème après migration v3→v4', () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    expect(data.preferences.theme).toBeDefined()
    expect(data.preferences.theme).toBe('system')
  })

  it("préserve l'habitude archivée après migration", () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    const archived = data.habits.find((h: Habit) => h.id === 'habit-3')
    expect(archived).toBeDefined()
    expect(archived!.archivedAt).toBe('2026-01-20')
  })

  it('les données migrées passent la validation', () => {
    const v1Data = createV1Data()
    const result = runMigrations(v1Data)
    const data = result.data!

    const validation = validateImportData(data)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })
})

// ============================================================================
// 2. IMPORT/EXPORT ROUNDTRIP
// ============================================================================

describe('Import/export roundtrip', () => {
  it('export → import produit des données identiques', () => {
    const originalData = createV11Data()

    // Sauvegarder les données originales
    saveData(originalData)

    // Charger et vérifier
    const loadResult = loadData()
    expect(loadResult.success).toBe(true)
    expect(loadResult.data).toBeDefined()

    // Exporter en JSON
    const jsonContent = JSON.stringify(loadResult.data!, null, 2)

    // Nettoyer le storage
    localStorage.clear()

    // Importer
    const importResult = importDataReplace(jsonContent)
    expect(importResult.success).toBe(true)

    // Charger à nouveau
    const reloadResult = loadData()
    expect(reloadResult.success).toBe(true)

    // Vérifier l'identité structurelle
    const imported = reloadResult.data!
    expect(imported.schemaVersion).toBe(originalData.schemaVersion)
    expect(imported.habits).toHaveLength(originalData.habits.length)
    expect(imported.entries).toHaveLength(originalData.entries.length)
    expect(imported.preferences.onboardingCompleted).toBe(
      originalData.preferences.onboardingCompleted
    )
    expect(imported.preferences.theme).toBe(originalData.preferences.theme)
  })

  it('les habitudes sont identiques après roundtrip', () => {
    const originalData = createV11Data()
    saveData(originalData)

    const jsonContent = JSON.stringify(originalData, null, 2)
    localStorage.clear()
    importDataReplace(jsonContent)

    const reloadResult = loadData()
    const imported = reloadResult.data!

    for (let i = 0; i < originalData.habits.length; i++) {
      const original = originalData.habits[i]
      const reimported = imported.habits.find((h: Habit) => h.id === original.id)
      expect(reimported).toBeDefined()
      expect(reimported!.name).toBe(original.name)
      expect(reimported!.emoji).toBe(original.emoji)
      expect(reimported!.direction).toBe(original.direction)
      expect(reimported!.startValue).toBe(original.startValue)
      expect(reimported!.unit).toBe(original.unit)
      expect(reimported!.createdAt).toBe(original.createdAt)
      expect(reimported!.archivedAt).toBe(original.archivedAt)
    }
  })

  it('les entrées sont identiques après roundtrip', () => {
    const originalData = createV11Data()
    saveData(originalData)

    const jsonContent = JSON.stringify(originalData, null, 2)
    localStorage.clear()
    importDataReplace(jsonContent)

    const reloadResult = loadData()
    const imported = reloadResult.data!

    for (let i = 0; i < originalData.entries.length; i++) {
      const original = originalData.entries[i]
      const reimported = imported.entries.find((e: DailyEntry) => e.id === original.id)
      expect(reimported).toBeDefined()
      expect(reimported!.habitId).toBe(original.habitId)
      expect(reimported!.date).toBe(original.date)
      expect(reimported!.targetDose).toBe(original.targetDose)
      expect(reimported!.actualValue).toBe(original.actualValue)
    }
  })

  it('les opérations compteur sont préservées après roundtrip', () => {
    const originalData = createV11Data()
    saveData(originalData)

    const jsonContent = JSON.stringify(originalData, null, 2)
    localStorage.clear()
    importDataReplace(jsonContent)

    const reloadResult = loadData()
    const imported = reloadResult.data!

    const entryWithOps = imported.entries.find((e: DailyEntry) => e.id === 'entry-2')
    expect(entryWithOps).toBeDefined()
    expect(entryWithOps!.operations).toHaveLength(2)
    expect(entryWithOps!.operations![0].type).toBe('add')
    expect(entryWithOps!.operations![0].value).toBe(3)
    expect(entryWithOps!.operations![1].value).toBe(2)
  })

  it('import de données v1 exportées, migration + import = données v11 valides', () => {
    const v1Data = createV1Data()
    const jsonContent = JSON.stringify(v1Data, null, 2)

    const importResult = importDataReplace(jsonContent)
    expect(importResult.success).toBe(true)
    expect(importResult.migration).toBeDefined()
    expect(importResult.habitsCount).toBe(3)
    expect(importResult.entriesCount).toBe(3)

    const loadResult = loadData()
    expect(loadResult.success).toBe(true)
    expect(loadResult.data!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)

    const validation = validateImportData(loadResult.data!)
    expect(validation.valid).toBe(true)
  })
})

// ============================================================================
// 3. VALIDATION DE SCHÉMA SUR DONNÉES DE CHAQUE VERSION
// ============================================================================

describe('Validation de schéma par version', () => {
  it('chaque version intermédiaire est atteignable depuis v1', () => {
    // Vérifie que la chaîne de migration est complète
    for (let v = 1; v < CURRENT_SCHEMA_VERSION; v++) {
      const migration = MIGRATIONS.find((m) => m.fromVersion === v)
      expect(migration).toBeDefined()
      expect(migration!.toVersion).toBe(v + 1)
    }
  })

  it('les données v1 passent toutes les étapes de migration intermédiaires', () => {
    let currentData: Record<string, unknown> = createV1Data()

    for (const migration of MIGRATIONS) {
      if ((currentData.schemaVersion as number) !== migration.fromVersion) continue

      currentData = migration.migrate(currentData)
      expect(currentData.schemaVersion).toBe(migration.toVersion)
    }

    expect(currentData.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('les données déjà à la version actuelle ne nécessitent pas de migration', () => {
    const v11Data = createV11Data() as unknown as Record<string, unknown>
    expect(needsMigration(v11Data)).toBe(false)

    const result = runMigrations(v11Data)
    expect(result.success).toBe(true)
    expect(result.migrationsApplied).toHaveLength(0)
  })

  it('les données avec version future sont rejetées', () => {
    const futureData = {
      ...createV11Data(),
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
    }

    const result = runMigrations(futureData as unknown as Record<string, unknown>)
    expect(result.success).toBe(false)
    expect(result.error).toContain('non supportée')
  })

  it('les données sans version sont migrées depuis v0', () => {
    const noVersionData = createV1Data()
    delete noVersionData.schemaVersion

    const result = runMigrations(noVersionData)
    expect(result.success).toBe(true)
    expect(result.fromVersion).toBe(0)
    expect(result.data!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('les données v9 avec habitudes weekly reçoivent weeklyAggregation', () => {
    const v8Data: Record<string, unknown> = {
      schemaVersion: 8,
      habits: [
        {
          id: 'weekly-habit',
          name: 'Sport',
          emoji: '🏃',
          direction: 'increase',
          startValue: 3,
          unit: 'séances',
          progression: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          trackingFrequency: 'weekly',
        },
      ],
      entries: [],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' },
        },
        theme: 'system',
      },
    }

    const result = runMigrations(v8Data)
    expect(result.success).toBe(true)

    const habit = result.data!.habits[0]
    expect(habit.weeklyAggregation).toBe('sum-units')
  })
})

// ============================================================================
// 4. RÉSISTANCE AUX DONNÉES CORROMPUES
// ============================================================================

describe('Résistance aux données corrompues', () => {
  describe('Champs manquants', () => {
    it('rejette des données sans schemaVersion', () => {
      const data = { habits: [], entries: [], preferences: { onboardingCompleted: true } }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.field === 'schemaVersion')).toBe(true)
    })

    it('rejette des données sans habits', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: [],
        preferences: { onboardingCompleted: true, lastWeeklyReviewDate: null },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.field === 'habits')).toBe(true)
    })

    it('rejette des données sans entries', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        habits: [],
        preferences: { onboardingCompleted: true, lastWeeklyReviewDate: null },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.field === 'entries')).toBe(true)
    })

    it('rejette des données sans preferences', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        habits: [],
        entries: [],
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.field === 'preferences')).toBe(true)
    })

    it('rejette une habitude sans id', () => {
      const habit = {
        name: 'Test',
        emoji: '🧪',
        direction: 'increase',
        startValue: 1,
        unit: 'units',
        progression: null,
        createdAt: '2026-01-01',
        archivedAt: null,
      }
      const result = validateHabit(habit)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('id'))).toBe(true)
    })

    it('rejette une habitude sans nom', () => {
      const habit = {
        id: 'test-id',
        emoji: '🧪',
        direction: 'increase',
        startValue: 1,
        unit: 'units',
        progression: null,
        createdAt: '2026-01-01',
        archivedAt: null,
      }
      const result = validateHabit(habit)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('name'))).toBe(true)
    })

    it('rejette une entrée sans habitId', () => {
      const entry = {
        id: 'entry-id',
        date: '2026-01-01',
        targetDose: 10,
        actualValue: 5,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      }
      const result = validateEntry(entry)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('habitId'))).toBe(true)
    })
  })

  describe('Types incorrects', () => {
    it('rejette null comme données', () => {
      const validation = validateImportData(null)
      expect(validation.valid).toBe(false)
    })

    it('rejette une chaîne comme données', () => {
      const validation = validateImportData('not an object')
      expect(validation.valid).toBe(false)
    })

    it('rejette un tableau comme données', () => {
      const validation = validateImportData([])
      expect(validation.valid).toBe(false)
    })

    it("rejette une habitude qui n'est pas un objet", () => {
      const result = validateHabit('not an object')
      expect(result.valid).toBe(false)
    })

    it('rejette une habitude null', () => {
      const result = validateHabit(null)
      expect(result.valid).toBe(false)
    })

    it("rejette une entrée qui n'est pas un objet", () => {
      const result = validateEntry(42)
      expect(result.valid).toBe(false)
    })

    it('rejette schemaVersion non numérique', () => {
      const data = {
        schemaVersion: 'not a number',
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true, lastWeeklyReviewDate: null },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
    })

    it('rejette habits non tableau', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        habits: 'not an array',
        entries: [],
        preferences: { onboardingCompleted: true, lastWeeklyReviewDate: null },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
    })
  })

  describe('Valeurs extrêmes', () => {
    it('rejette une version de schéma négative', () => {
      const data = {
        schemaVersion: -1,
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true, lastWeeklyReviewDate: null },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
    })

    it('rejette une startValue négative', () => {
      const habit = {
        id: 'test',
        name: 'Test',
        emoji: '🧪',
        direction: 'increase',
        startValue: -5,
        unit: 'units',
        progression: { mode: 'absolute', value: 1, period: 'weekly' },
        createdAt: '2026-01-01',
        archivedAt: null,
      }
      const result = validateHabit(habit)
      expect(result.valid).toBe(false)
    })

    it('rejette une targetDose NaN', () => {
      const entry = {
        id: 'entry-id',
        habitId: 'habit-id',
        date: '2026-01-01',
        targetDose: NaN,
        actualValue: 5,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      }
      const result = validateEntry(entry)
      expect(result.valid).toBe(false)
    })

    it('rejette une actualValue Infinity', () => {
      const entry = {
        id: 'entry-id',
        habitId: 'habit-id',
        date: '2026-01-01',
        targetDose: 10,
        actualValue: Infinity,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      }
      const result = validateEntry(entry)
      expect(result.valid).toBe(false)
    })

    it('rejette une direction invalide', () => {
      const habit = {
        id: 'test',
        name: 'Test',
        emoji: '🧪',
        direction: 'sideways',
        startValue: 1,
        unit: 'units',
        progression: null,
        createdAt: '2026-01-01',
        archivedAt: null,
      }
      const result = validateHabit(habit)
      expect(result.valid).toBe(false)
    })

    it('rejette une date invalide', () => {
      const entry = {
        id: 'entry-id',
        habitId: 'habit-id',
        date: '2026-13-45',
        targetDose: 10,
        actualValue: 5,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      }
      const result = validateEntry(entry)
      expect(result.valid).toBe(false)
    })

    it('rejette une date au mauvais format', () => {
      const entry = {
        id: 'entry-id',
        habitId: 'habit-id',
        date: '01/15/2026',
        targetDose: 10,
        actualValue: 5,
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      }
      const result = validateEntry(entry)
      expect(result.valid).toBe(false)
    })
  })

  describe('Données corrompues dans import', () => {
    it('rejette du JSON invalide via importDataReplace', () => {
      const result = importDataReplace('not json at all')
      expect(result.success).toBe(false)
      expect(result.error).toContain('JSON invalide')
    })

    it('rejette un objet vide via importDataReplace', () => {
      const result = importDataReplace('{}')
      expect(result.success).toBe(false)
    })

    it('rejette des données avec IDs dupliqués', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        habits: [
          {
            id: 'same-id',
            name: 'Habit 1',
            emoji: '🧪',
            direction: 'increase',
            startValue: 1,
            unit: 'u',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
          {
            id: 'same-id',
            name: 'Habit 2',
            emoji: '🧪',
            direction: 'increase',
            startValue: 1,
            unit: 'u',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        entries: [],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: {
            enabled: false,
            morningReminder: { enabled: true, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
          theme: 'system',
        },
      }
      const validation = validateImportData(data)
      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.message.includes('dupliqué'))).toBe(true)
    })

    it('avertit si une entrée référence une habitude inexistante', () => {
      const data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '🧪',
            direction: 'increase',
            startValue: 1,
            unit: 'u',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        entries: [
          {
            id: 'entry-1',
            habitId: 'nonexistent-habit',
            date: '2026-01-01',
            targetDose: 10,
            actualValue: 5,
            createdAt: '2026-01-01T08:00:00Z',
            updatedAt: '2026-01-01T08:00:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: {
            enabled: false,
            morningReminder: { enabled: true, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' },
          },
          theme: 'system',
        },
      }
      const validation = validateImportData(data)
      // Should still be valid (warnings, not errors)
      expect(validation.valid).toBe(true)
      expect(validation.warnings.length).toBeGreaterThan(0)
      expect(validation.warnings.some((w) => w.includes('inexistante'))).toBe(true)
    })

    it('stockage de données corrompues dans localStorage retourne une erreur', () => {
      localStorage.setItem(STORAGE_KEY, 'not json')
      const result = loadData()
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('PARSE_ERROR')
    })

    it("stockage d'un objet invalide dans localStorage retourne une erreur", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ random: 'data' }))
      const result = loadData()
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe('VALIDATION_ERROR')
    })
  })
})
