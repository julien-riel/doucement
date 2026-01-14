/**
 * Tests unitaires du service de migration
 * Couvre: needsMigration, runMigrations, formatMigrationResult, toutes les migrations v1->v10
 */

import { describe, it, expect } from 'vitest'
import { needsMigration, runMigrations, formatMigrationResult, MIGRATIONS } from './migration'
import { CURRENT_SCHEMA_VERSION, DEFAULT_NOTIFICATION_SETTINGS } from '../types'
import { createAppData } from '../test/fixtures'

// ============================================================================
// FIXTURES SPÉCIFIQUES
// ============================================================================

/**
 * Crée des données à une version spécifique pour les tests de migration
 */
function createDataAtVersion(
  version: number,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    schemaVersion: version,
    habits: [],
    entries: [],
    preferences: {
      onboardingCompleted: false,
      lastWeeklyReviewDate: null,
    },
    ...overrides,
  }
  return base
}

// ============================================================================
// needsMigration TESTS
// ============================================================================

describe('needsMigration', () => {
  describe('détection de la nécessité de migration', () => {
    it('retourne true si schemaVersion est inférieure à la version courante', () => {
      const data = createDataAtVersion(1)
      expect(needsMigration(data)).toBe(true)
    })

    it('retourne true si schemaVersion est 0', () => {
      const data = createDataAtVersion(0)
      expect(needsMigration(data)).toBe(true)
    })

    it('retourne false si schemaVersion est égale à la version courante', () => {
      const data = createDataAtVersion(CURRENT_SCHEMA_VERSION)
      expect(needsMigration(data)).toBe(false)
    })

    it('retourne false si schemaVersion est supérieure à la version courante', () => {
      const data = createDataAtVersion(CURRENT_SCHEMA_VERSION + 100)
      expect(needsMigration(data)).toBe(false)
    })

    it('retourne true si schemaVersion est manquante (undefined)', () => {
      const data = { habits: [], entries: [], preferences: {} }
      expect(needsMigration(data)).toBe(true)
    })

    it("retourne true si schemaVersion n'est pas un nombre", () => {
      const data = { schemaVersion: 'invalid', habits: [], entries: [], preferences: {} }
      expect(needsMigration(data)).toBe(true)
    })
  })
})

// ============================================================================
// runMigrations TESTS - CAS GÉNÉRAUX
// ============================================================================

describe('runMigrations', () => {
  describe('cas général - pas de migration nécessaire', () => {
    it('retourne les données inchangées si déjà à la version courante', () => {
      const data = createAppData() as unknown as Record<string, unknown>
      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.fromVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.migrationsApplied).toHaveLength(0)
      expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    })
  })

  describe('cas général - version future', () => {
    it('échoue si la version est supérieure à la version courante', () => {
      const futureVersion = CURRENT_SCHEMA_VERSION + 100
      const data = createDataAtVersion(futureVersion)
      const result = runMigrations(data)

      expect(result.success).toBe(false)
      expect(result.error).toContain('non supportée')
      expect(result.error).toContain(String(futureVersion))
    })
  })

  describe('cas général - version sans migration définie', () => {
    it("met à jour la version si aucune migration spécifique n'est définie", () => {
      // Version 0 n'a pas de migration définie vers v1
      const data = createDataAtVersion(0)
      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    })
  })

  describe('cas général - chaîne de migrations', () => {
    it('applique plusieurs migrations en séquence', () => {
      // Partir de v1 pour passer par toutes les migrations
      const data = createDataAtVersion(1, {
        preferences: {
          onboardingCompleted: false,
          lastWeeklyReviewDate: null,
        },
      })
      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.fromVersion).toBe(1)
      expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(result.migrationsApplied.length).toBeGreaterThan(0)
    })

    it('préserve les données existantes pendant la migration', () => {
      const data = createDataAtVersion(1, {
        habits: [
          {
            id: 'existing-habit',
            name: 'Push-ups',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        entries: [
          {
            id: 'existing-entry',
            habitId: 'existing-habit',
            date: '2026-01-10',
            targetDose: 10,
            actualValue: 8,
            createdAt: '2026-01-10T10:00:00Z',
            updatedAt: '2026-01-10T10:00:00Z',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-05',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits).toHaveLength(1)
      expect(result.data?.habits[0].name).toBe('Push-ups')
      expect(result.data?.entries).toHaveLength(1)
      expect(result.data?.preferences.onboardingCompleted).toBe(true)
    })
  })
})

// ============================================================================
// TESTS DES MIGRATIONS SPÉCIFIQUES
// ============================================================================

describe('migrations spécifiques', () => {
  describe('v1 -> v2: Ajout des notifications', () => {
    it('ajoute les paramètres de notifications par défaut', () => {
      const data = createDataAtVersion(1, {
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.preferences.notifications).toBeDefined()
      expect(result.data?.preferences.notifications.enabled).toBe(false)
      expect(result.data?.preferences.notifications.morningReminder.enabled).toBe(true)
    })

    it('préserve les préférences existantes', () => {
      const data = createDataAtVersion(1, {
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2026-01-01',
        },
      })

      const result = runMigrations(data)

      expect(result.data?.preferences.onboardingCompleted).toBe(true)
      expect(result.data?.preferences.lastWeeklyReviewDate).toBe('2026-01-01')
    })
  })

  describe('v2 -> v3: Champs Phase 6', () => {
    it('ne modifie pas les habitudes existantes (champs optionnels)', () => {
      const data = createDataAtVersion(2, {
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].trackingMode).toBeUndefined()
      expect(result.data?.habits[0].implementationIntention).toBeUndefined()
      expect(result.data?.habits[0].anchorHabitId).toBeUndefined()
    })
  })

  describe('v3 -> v4: Préférence de thème', () => {
    it('ajoute la préférence de thème par défaut (system)', () => {
      const data = createDataAtVersion(3, {
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.preferences.theme).toBe('system')
    })

    it('préserve le thème existant si déjà défini', () => {
      const data = createDataAtVersion(3, {
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'dark',
        },
      })

      const result = runMigrations(data)

      expect(result.data?.preferences.theme).toBe('dark')
    })
  })

  describe('v4 -> v5: Fréquence hebdomadaire', () => {
    it('ne modifie pas les habitudes existantes (champ optionnel)', () => {
      const data = createDataAtVersion(4, {
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].trackingFrequency).toBeUndefined()
    })
  })

  describe("v5 -> v6: Déclaration d'identité", () => {
    it('ne modifie pas les habitudes existantes (champ optionnel)', () => {
      const data = createDataAtVersion(5, {
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].identityStatement).toBeUndefined()
    })
  })

  describe('v6 -> v7: Mode rattrapage', () => {
    it('ne modifie pas les habitudes existantes (champ optionnel)', () => {
      const data = createDataAtVersion(6, {
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].recalibrationHistory).toBeUndefined()
    })
  })

  describe('v7 -> v8: Mode saisie cumulative', () => {
    it('ne modifie pas les habitudes existantes (champ optionnel)', () => {
      const data = createDataAtVersion(7, {
        habits: [
          {
            id: 'habit-1',
            name: 'Test',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].entryMode).toBeUndefined()
    })
  })

  describe('v8 -> v9: Mode compteur et agrégation hebdomadaire', () => {
    it('ajoute weeklyAggregation aux habitudes weekly existantes', () => {
      const data = createDataAtVersion(8, {
        habits: [
          {
            id: 'habit-weekly',
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
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].weeklyAggregation).toBe('sum-units')
    })

    it('ne modifie pas les habitudes daily', () => {
      const data = createDataAtVersion(8, {
        habits: [
          {
            id: 'habit-daily',
            name: 'Push-ups',
            emoji: '💪',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            trackingFrequency: 'daily',
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].weeklyAggregation).toBeUndefined()
    })

    it('préserve weeklyAggregation si déjà défini', () => {
      const data = createDataAtVersion(8, {
        habits: [
          {
            id: 'habit-weekly',
            name: 'Sport',
            emoji: '🏃',
            direction: 'increase',
            startValue: 3,
            unit: 'séances',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            trackingFrequency: 'weekly',
            weeklyAggregation: 'count-days', // Déjà défini
          },
        ],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          theme: 'system',
        },
      })

      const result = runMigrations(data)

      expect(result.success).toBe(true)
      expect(result.data?.habits[0].weeklyAggregation).toBe('count-days')
    })
  })
})

// ============================================================================
// formatMigrationResult TESTS
// ============================================================================

describe('formatMigrationResult', () => {
  describe('formatage des résultats de migration', () => {
    it("formate un échec avec le message d'erreur", () => {
      const result = {
        success: false,
        fromVersion: 1,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: [],
        error: 'Version non supportée',
      }

      const formatted = formatMigrationResult(result)

      expect(formatted).toContain('échouée')
      expect(formatted).toContain('Version non supportée')
    })

    it('formate un succès sans migrations', () => {
      const result = {
        success: true,
        fromVersion: CURRENT_SCHEMA_VERSION,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: [],
        data: createAppData(),
      }

      const formatted = formatMigrationResult(result)

      expect(formatted).toContain('à jour')
      expect(formatted).toContain(String(CURRENT_SCHEMA_VERSION))
    })

    it('formate une mise à jour sans transformation', () => {
      const result = {
        success: true,
        fromVersion: 0,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: [],
        data: createAppData(),
      }

      const formatted = formatMigrationResult(result)

      expect(formatted).toContain('mises à jour')
      expect(formatted).toContain('0')
      expect(formatted).toContain(String(CURRENT_SCHEMA_VERSION))
    })

    it('formate un succès avec migrations appliquées', () => {
      const result = {
        success: true,
        fromVersion: 1,
        toVersion: CURRENT_SCHEMA_VERSION,
        migrationsApplied: ['Ajout des paramètres de notifications', 'Ajout du mode compteur'],
        data: createAppData(),
      }

      const formatted = formatMigrationResult(result)

      expect(formatted).toContain('Migration réussie')
      expect(formatted).toContain('1')
      expect(formatted).toContain(String(CURRENT_SCHEMA_VERSION))
      expect(formatted).toContain('2 migration(s)')
      expect(formatted).toContain('Ajout des paramètres de notifications')
      expect(formatted).toContain('Ajout du mode compteur')
    })
  })
})

// ============================================================================
// TESTS DU REGISTRY DE MIGRATIONS
// ============================================================================

describe('MIGRATIONS registry', () => {
  it('contient des migrations pour les versions 1 à 8', () => {
    const versions = MIGRATIONS.map((m) => m.fromVersion)

    expect(versions).toContain(1)
    expect(versions).toContain(2)
    expect(versions).toContain(3)
    expect(versions).toContain(4)
    expect(versions).toContain(5)
    expect(versions).toContain(6)
    expect(versions).toContain(7)
    expect(versions).toContain(8)
  })

  it('forme une chaîne continue de migrations', () => {
    // Vérifie que chaque migration.toVersion correspond au fromVersion suivant
    const sortedMigrations = [...MIGRATIONS].sort((a, b) => a.fromVersion - b.fromVersion)

    for (let i = 0; i < sortedMigrations.length - 1; i++) {
      expect(sortedMigrations[i].toVersion).toBe(sortedMigrations[i + 1].fromVersion)
    }
  })

  it('chaque migration a une description non vide', () => {
    for (const migration of MIGRATIONS) {
      expect(migration.description).toBeDefined()
      expect(migration.description.length).toBeGreaterThan(0)
    }
  })

  it('chaque migration a une fonction migrate', () => {
    for (const migration of MIGRATIONS) {
      expect(typeof migration.migrate).toBe('function')
    }
  })

  it('la dernière migration mène à CURRENT_SCHEMA_VERSION - 1', () => {
    const lastMigration = MIGRATIONS[MIGRATIONS.length - 1]
    expect(lastMigration.toVersion).toBeLessThanOrEqual(CURRENT_SCHEMA_VERSION)
  })
})

// ============================================================================
// CAS LIMITES
// ============================================================================

describe('cas limites', () => {
  it('gère les données avec preferences undefined', () => {
    const data = {
      schemaVersion: 1,
      habits: [],
      entries: [],
    }

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    expect(result.data?.preferences).toBeDefined()
  })

  it('gère les données avec habits undefined', () => {
    const data = {
      schemaVersion: 8,
      entries: [],
      preferences: {
        onboardingCompleted: false,
        lastWeeklyReviewDate: null,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
        theme: 'system',
      },
    }

    const result = runMigrations(data)

    expect(result.success).toBe(true)
  })

  it("gère un grand nombre d'habitudes", () => {
    const habits = Array.from({ length: 100 }, (_, i) => ({
      id: `habit-${i}`,
      name: `Habitude ${i}`,
      emoji: '💪',
      direction: 'increase',
      startValue: 10,
      unit: 'répétitions',
      progression: null,
      createdAt: '2026-01-01',
      archivedAt: null,
      trackingFrequency: i % 2 === 0 ? 'weekly' : 'daily',
    }))

    const data = createDataAtVersion(8, {
      habits,
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
        theme: 'system',
      },
    })

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    expect(result.data?.habits).toHaveLength(100)

    // Les habitudes weekly devraient avoir weeklyAggregation
    const weeklyHabits = result.data?.habits.filter((h) => h.trackingFrequency === 'weekly') ?? []
    weeklyHabits.forEach((h) => {
      expect(h.weeklyAggregation).toBe('sum-units')
    })
  })
})
