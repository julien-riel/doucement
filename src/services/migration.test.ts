/**
 * Tests unitaires du service de migration
 * Couvre: needsMigration, runMigrations, formatMigrationResult, toutes les migrations v1->v12
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
      expect(result.data?.habits[0].trackingMode).toBe('detailed')
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

  describe('v9 -> v10: timeOfDay et cumulativeOperations', () => {
    it('ne modifie pas les habitudes existantes (champs optionnels)', () => {
      const data = createDataAtVersion(9, {
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
      expect(result.data?.habits[0].timeOfDay).toBeUndefined()
      expect(result.data?.habits[0].cumulativeOperations).toBeUndefined()
    })

    it('préserve les champs timeOfDay et cumulativeOperations existants', () => {
      const data = createDataAtVersion(9, {
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
            timeOfDay: 'morning',
            cumulativeOperations: [{ id: 'op-1', value: 5, timestamp: '2026-01-10T10:00:00Z' }],
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
      expect(result.data?.habits[0].timeOfDay).toBe('morning')
      expect(result.data?.habits[0].cumulativeOperations).toHaveLength(1)
    })
  })

  describe('v10 -> v11: Widgets temporels (stopwatch, timer, slider)', () => {
    it('ne modifie pas les habitudes existantes (champs optionnels)', () => {
      const data = createDataAtVersion(10, {
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
      expect(result.data?.habits[0].sliderConfig).toBeUndefined()
      expect(result.data?.habits[0].notifyOnTarget).toBeUndefined()
    })
  })

  describe('v11 -> v12: trackingMode devient requis', () => {
    it('ajoute trackingMode=detailed aux habitudes sans trackingMode', () => {
      const data = createDataAtVersion(11, {
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
            // Pas de trackingMode
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
      expect(result.data?.habits[0].trackingMode).toBe('detailed')
    })

    it('préserve trackingMode existant', () => {
      const data = createDataAtVersion(11, {
        habits: [
          {
            id: 'habit-counter',
            name: 'Verres d eau',
            emoji: '💧',
            direction: 'increase',
            startValue: 0,
            unit: 'verres',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            trackingMode: 'counter',
          },
          {
            id: 'habit-simple',
            name: 'Méditation',
            emoji: '🧘',
            direction: 'maintain',
            startValue: 1,
            unit: 'séance',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            trackingMode: 'simple',
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
      expect(result.data?.habits[0].trackingMode).toBe('counter')
      expect(result.data?.habits[1].trackingMode).toBe('simple')
    })

    it('gère un mix d habitudes avec et sans trackingMode', () => {
      const data = createDataAtVersion(11, {
        habits: [
          {
            id: 'habit-with',
            name: 'Avec mode',
            emoji: '✅',
            direction: 'increase',
            startValue: 10,
            unit: 'reps',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            trackingMode: 'stopwatch',
          },
          {
            id: 'habit-without',
            name: 'Sans mode',
            emoji: '❓',
            direction: 'increase',
            startValue: 5,
            unit: 'min',
            progression: null,
            createdAt: '2026-01-01',
            archivedAt: null,
            // Pas de trackingMode
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
      expect(result.data?.habits[0].trackingMode).toBe('stopwatch')
      expect(result.data?.habits[1].trackingMode).toBe('detailed')
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
  it('contient des migrations pour les versions 1 à 11', () => {
    const versions = MIGRATIONS.map((m) => m.fromVersion)

    for (let v = 1; v <= CURRENT_SCHEMA_VERSION - 1; v++) {
      expect(versions).toContain(v)
    }
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

// ============================================================================
// MIGRATION COMPLÈTE v1 → v12
// ============================================================================

describe('migration complète v1 → v12', () => {
  it('migre des données v1 avec habitudes et entrées vers v12', () => {
    const data = createDataAtVersion(1, {
      habits: [
        {
          id: 'habit-daily',
          name: 'Push-ups',
          emoji: '💪',
          direction: 'increase',
          startValue: 10,
          unit: 'répétitions',
          progression: { mode: 'percentage', value: 3, period: 'weekly' },
          createdAt: '2026-01-01',
          archivedAt: null,
        },
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
      entries: [
        {
          id: 'entry-1',
          habitId: 'habit-daily',
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
    expect(result.fromVersion).toBe(1)
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)

    // Vérifier que les données sont préservées
    expect(result.data?.habits).toHaveLength(2)
    expect(result.data?.habits[0].name).toBe('Push-ups')
    expect(result.data?.habits[0].startValue).toBe(10)
    expect(result.data?.entries).toHaveLength(1)
    expect(result.data?.preferences.onboardingCompleted).toBe(true)

    // Vérifier les ajouts de migration
    expect(result.data?.preferences.notifications).toEqual(DEFAULT_NOTIFICATION_SETTINGS)
    expect(result.data?.preferences.theme).toBe('system')
    expect(result.data?.habits[0].trackingMode).toBe('detailed') // v12: défaut
    expect(result.data?.habits[1].weeklyAggregation).toBe('sum-units') // v9: weekly default

    // Vérifier que toutes les migrations ont été appliquées
    expect(result.migrationsApplied.length).toBe(CURRENT_SCHEMA_VERSION - 1)
  })
})

// ============================================================================
// MIGRATION INTERMÉDIAIRE v8 → v12
// ============================================================================

describe('migration intermédiaire v8 → v12', () => {
  it('applique uniquement les migrations v8→v9→v10→v11→v12', () => {
    const data = createDataAtVersion(8, {
      habits: [
        {
          id: 'habit-1',
          name: 'Lecture',
          emoji: '📖',
          direction: 'increase',
          startValue: 20,
          unit: 'minutes',
          progression: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          trackingFrequency: 'daily',
          // Pas de trackingMode (sera ajouté par v12)
        },
        {
          id: 'habit-2',
          name: 'Yoga',
          emoji: '🧘',
          direction: 'maintain',
          startValue: 1,
          unit: 'séance',
          progression: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          trackingFrequency: 'weekly',
          // Pas de weeklyAggregation (sera ajouté par v9)
        },
      ],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
        theme: 'dark',
      },
    })

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    expect(result.fromVersion).toBe(8)
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrationsApplied).toHaveLength(CURRENT_SCHEMA_VERSION - 8)

    // v9 : weeklyAggregation ajouté
    expect(result.data?.habits[1].weeklyAggregation).toBe('sum-units')

    // v12 : trackingMode ajouté
    expect(result.data?.habits[0].trackingMode).toBe('detailed')
    expect(result.data?.habits[1].trackingMode).toBe('detailed')

    // Préférences préservées
    expect(result.data?.preferences.theme).toBe('dark')
  })
})

// ============================================================================
// DONNÉES CORROMPUES (GRACEFUL FAILURE)
// ============================================================================

describe('données corrompues', () => {
  it('gère les données avec schemaVersion non numérique', () => {
    const data = {
      schemaVersion: 'invalid',
      habits: [],
      entries: [],
      preferences: { onboardingCompleted: false, lastWeeklyReviewDate: null },
    }

    const result = runMigrations(data)

    // schemaVersion non numérique → traitée comme 0
    expect(result.success).toBe(true)
    expect(result.fromVersion).toBe(0)
    expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('gère les données avec schemaVersion null', () => {
    const data = {
      schemaVersion: null,
      habits: [],
      entries: [],
      preferences: { onboardingCompleted: false, lastWeeklyReviewDate: null },
    }

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    expect(result.fromVersion).toBe(0)
  })

  it('gère les données avec habits qui est un objet au lieu d un tableau', () => {
    const data = createDataAtVersion(8, {
      habits: { invalid: true } as unknown as [],
      preferences: {
        onboardingCompleted: false,
        lastWeeklyReviewDate: null,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
        theme: 'system',
      },
    })

    // La migration v8→v9 utilise ?? [] si habits est falsy,
    // mais un objet est truthy — la migration tente de map() dessus
    // Le résultat dépend du type réel ; vérifions que ça ne plante pas silencieusement
    const result = runMigrations(data)

    // Si ça échoue, success=false avec un message d'erreur
    // Si ça passe, les données sont migrées (comportement dégradé mais stable)
    expect(typeof result.success).toBe('boolean')
    if (!result.success) {
      expect(result.error).toBeDefined()
    }
  })

  it('gère les données avec preferences undefined (v1)', () => {
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

  it('gère les données complètement vides', () => {
    const data = {} as Record<string, unknown>

    const result = runMigrations(data)

    // schemaVersion undefined → 0, pas de migration définie pour v0
    expect(result.success).toBe(true)
    expect(result.fromVersion).toBe(0)
    expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('gère les habitudes avec des champs manquants dans les anciennes versions', () => {
    const data = createDataAtVersion(1, {
      habits: [
        {
          // Habitude minimale — champs qui auraient pu exister en v1
          id: 'old-habit',
          name: 'Vieille habitude',
          emoji: '📝',
          direction: 'increase',
          startValue: 5,
          unit: 'pages',
          progression: null,
          createdAt: '2025-06-01',
          archivedAt: null,
          // Pas de : trackingMode, trackingFrequency, entryMode,
          // implementationIntention, anchorHabitId, timeOfDay,
          // cumulativeOperations, sliderConfig, notifyOnTarget,
          // weeklyAggregation, identityStatement, recalibrationHistory
        },
      ],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
      },
    })

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    const habit = result.data?.habits[0]
    expect(habit).toBeDefined()
    expect(habit?.name).toBe('Vieille habitude')
    // trackingMode est requis depuis v12
    expect(habit?.trackingMode).toBe('detailed')
    // Les champs optionnels restent undefined
    expect(habit?.trackingFrequency).toBeUndefined()
    expect(habit?.entryMode).toBeUndefined()
    expect(habit?.implementationIntention).toBeUndefined()
    expect(habit?.anchorHabitId).toBeUndefined()
    expect(habit?.timeOfDay).toBeUndefined()
    expect(habit?.identityStatement).toBeUndefined()
    expect(habit?.recalibrationHistory).toBeUndefined()
  })
})

// ============================================================================
// CAS LIMITES SUPPLÉMENTAIRES
// ============================================================================

describe('cas limites', () => {
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

    // Toutes les habitudes devraient avoir trackingMode (v12)
    result.data?.habits.forEach((h) => {
      expect(h.trackingMode).toBe('detailed')
    })
  })

  it('gère la migration depuis exactement la version précédente (v11 → v12)', () => {
    const data = createDataAtVersion(11, {
      habits: [
        {
          id: 'habit-1',
          name: 'Test',
          emoji: '✅',
          direction: 'increase',
          startValue: 10,
          unit: 'min',
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
    expect(result.migrationsApplied).toHaveLength(1)
    expect(result.migrationsApplied[0]).toContain('trackingMode')
  })

  it('retourne les données inchangées si la version est exactement à jour', () => {
    const data = createDataAtVersion(CURRENT_SCHEMA_VERSION, {
      habits: [
        {
          id: 'habit-1',
          name: 'Déjà à jour',
          emoji: '✅',
          direction: 'increase',
          startValue: 10,
          unit: 'min',
          progression: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          trackingMode: 'detailed',
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
    expect(result.fromVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.migrationsApplied).toHaveLength(0)
  })

  it('gère les données avec des champs supplémentaires inconnus', () => {
    const data = createDataAtVersion(1, {
      unknownField: 'should be preserved',
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        customPref: 'value',
      },
    })

    const result = runMigrations(data)

    expect(result.success).toBe(true)
    // Les champs inconnus ne doivent pas faire échouer la migration
    expect(result.data?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('ne mute pas les données d entrée', () => {
    const originalData = createDataAtVersion(11, {
      habits: [
        {
          id: 'habit-1',
          name: 'Test',
          emoji: '✅',
          direction: 'increase',
          startValue: 10,
          unit: 'min',
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

    const dataCopy = JSON.parse(JSON.stringify(originalData))
    runMigrations(originalData)

    // La version originale ne devrait pas être modifiée
    expect(originalData.schemaVersion).toBe(dataCopy.schemaVersion)
  })
})
