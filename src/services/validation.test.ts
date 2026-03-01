/**
 * Tests unitaires pour validation.ts
 * Couvre: validateHabit, validateEntry, validateImportData, formatValidationErrors
 * Focus sur les cas limites et la couverture exhaustive
 */

import { describe, it, expect } from 'vitest'
import {
  validateHabit,
  validateEntry,
  validateImportData,
  formatValidationErrors,
  type ValidationResult,
} from './validation'
import { CURRENT_SCHEMA_VERSION, DEFAULT_NOTIFICATION_SETTINGS } from '../types'

// ============================================================================
// FIXTURES
// ============================================================================

function validHabit(overrides: Record<string, unknown> = {}) {
  return {
    id: 'h1',
    name: 'Push-ups',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'reps',
    progression: { mode: 'absolute', value: 2, period: 'weekly' },
    createdAt: '2025-01-01',
    archivedAt: null,
    ...overrides,
  }
}

function validEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    habitId: 'h1',
    date: '2025-01-15',
    targetDose: 12,
    actualValue: 10,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  }
}

function validAppData(overrides: Record<string, unknown> = {}) {
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

// ============================================================================
// validateHabit
// ============================================================================

describe('validateHabit', () => {
  describe('inputs valides', () => {
    it('accepte une habitude increase avec progression absolute', () => {
      expect(validateHabit(validHabit()).valid).toBe(true)
    })

    it('accepte une habitude decrease avec progression percentage', () => {
      const result = validateHabit(
        validHabit({
          direction: 'decrease',
          progression: { mode: 'percentage', value: 5, period: 'daily' },
        })
      )
      expect(result.valid).toBe(true)
    })

    it('accepte une habitude maintain avec progression null', () => {
      const result = validateHabit(validHabit({ direction: 'maintain', progression: null }))
      expect(result.valid).toBe(true)
    })

    it('accepte startValue à zéro', () => {
      expect(validateHabit(validHabit({ startValue: 0 })).valid).toBe(true)
    })

    it('accepte progression value à zéro', () => {
      const result = validateHabit(
        validHabit({
          progression: { mode: 'absolute', value: 0, period: 'weekly' },
        })
      )
      expect(result.valid).toBe(true)
    })

    it('accepte archivedAt null', () => {
      expect(validateHabit(validHabit({ archivedAt: null })).valid).toBe(true)
    })

    it('accepte archivedAt date valide', () => {
      expect(validateHabit(validHabit({ archivedAt: '2025-06-15' })).valid).toBe(true)
    })

    it('accepte description optionnelle string', () => {
      expect(validateHabit(validHabit({ description: 'test' })).valid).toBe(true)
    })

    it('accepte targetValue positif', () => {
      expect(validateHabit(validHabit({ targetValue: 100 })).valid).toBe(true)
    })

    it('utilise le prefix index si fourni', () => {
      const result = validateHabit('not-object', 5)
      expect(result.errors[0].field).toBe('habits[5]')
    })
  })

  describe('inputs invalides - types incorrects', () => {
    it('rejette null', () => {
      const result = validateHabit(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].type).toBe('INVALID_TYPE')
    })

    it('rejette undefined', () => {
      expect(validateHabit(undefined).valid).toBe(false)
    })

    it('rejette un string', () => {
      expect(validateHabit('string').valid).toBe(false)
    })

    it('rejette un nombre', () => {
      expect(validateHabit(42).valid).toBe(false)
    })

    it('rejette un tableau', () => {
      expect(validateHabit([]).valid).toBe(false)
    })

    it('rejette description non-string', () => {
      const result = validateHabit(validHabit({ description: 123 }))
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('description'))).toBe(true)
    })
  })

  describe('inputs invalides - champs manquants', () => {
    it('rejette id vide', () => {
      const result = validateHabit(validHabit({ id: '' }))
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.type === 'MISSING_FIELD' && e.field.includes('id'))).toBe(
        true
      )
    })

    it('rejette id non-string', () => {
      expect(validateHabit(validHabit({ id: 123 })).valid).toBe(false)
    })

    it('rejette name vide', () => {
      expect(validateHabit(validHabit({ name: '' })).valid).toBe(false)
    })

    it('rejette name uniquement espaces', () => {
      expect(validateHabit(validHabit({ name: '   ' })).valid).toBe(false)
    })

    it('rejette emoji vide', () => {
      expect(validateHabit(validHabit({ emoji: '' })).valid).toBe(false)
    })

    it('rejette unit vide', () => {
      expect(validateHabit(validHabit({ unit: '' })).valid).toBe(false)
    })
  })

  describe('inputs invalides - valeurs incorrectes', () => {
    it('rejette direction invalide', () => {
      const result = validateHabit(validHabit({ direction: 'sideways' }))
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('direction'))).toBe(true)
    })

    it('rejette startValue négatif', () => {
      expect(validateHabit(validHabit({ startValue: -1 })).valid).toBe(false)
    })

    it('rejette startValue Infinity', () => {
      expect(validateHabit(validHabit({ startValue: Infinity })).valid).toBe(false)
    })

    it('rejette startValue NaN', () => {
      expect(validateHabit(validHabit({ startValue: NaN })).valid).toBe(false)
    })

    it('rejette startValue string', () => {
      expect(validateHabit(validHabit({ startValue: '10' })).valid).toBe(false)
    })

    it('rejette targetValue zéro', () => {
      expect(validateHabit(validHabit({ targetValue: 0 })).valid).toBe(false)
    })

    it('rejette targetValue négatif', () => {
      expect(validateHabit(validHabit({ targetValue: -5 })).valid).toBe(false)
    })

    it('rejette createdAt format invalide', () => {
      expect(validateHabit(validHabit({ createdAt: '01/01/2025' })).valid).toBe(false)
    })

    it('rejette createdAt date impossible', () => {
      expect(validateHabit(validHabit({ createdAt: '2025-13-45' })).valid).toBe(false)
    })

    it('rejette archivedAt format invalide', () => {
      expect(validateHabit(validHabit({ archivedAt: 'not-a-date' })).valid).toBe(false)
    })
  })

  describe('progression config validation', () => {
    it('rejette progression non-objet', () => {
      const result = validateHabit(validHabit({ progression: 'invalid' }))
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('progression'))).toBe(true)
    })

    it('rejette mode invalide', () => {
      const result = validateHabit(
        validHabit({
          progression: { mode: 'linear', value: 5, period: 'weekly' },
        })
      )
      expect(result.valid).toBe(false)
    })

    it('rejette value négatif', () => {
      const result = validateHabit(
        validHabit({
          progression: { mode: 'absolute', value: -1, period: 'weekly' },
        })
      )
      expect(result.valid).toBe(false)
    })

    it('rejette period invalide', () => {
      const result = validateHabit(
        validHabit({
          progression: { mode: 'absolute', value: 5, period: 'monthly' },
        })
      )
      expect(result.valid).toBe(false)
    })

    it('rejette value non-nombre', () => {
      const result = validateHabit(
        validHabit({
          progression: { mode: 'absolute', value: '5', period: 'weekly' },
        })
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('avertissements', () => {
    it('avertit si maintain a une progression non-null', () => {
      const result = validateHabit(
        validHabit({
          direction: 'maintain',
          progression: { mode: 'absolute', value: 5, period: 'weekly' },
        })
      )
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('maintain')
    })

    it('pas d avertissement si maintain a progression null', () => {
      const result = validateHabit(validHabit({ direction: 'maintain', progression: null }))
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('erreurs multiples', () => {
    it('retourne toutes les erreurs simultanément', () => {
      const result = validateHabit({
        id: '',
        name: '',
        emoji: '',
        direction: 'invalid',
        startValue: -1,
        unit: '',
        createdAt: 'bad',
        archivedAt: null,
      })
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(6)
    })
  })
})

// ============================================================================
// validateEntry
// ============================================================================

describe('validateEntry', () => {
  describe('inputs valides', () => {
    it('accepte une entrée complète', () => {
      expect(validateEntry(validEntry()).valid).toBe(true)
    })

    it('accepte actualValue à zéro', () => {
      expect(validateEntry(validEntry({ actualValue: 0 })).valid).toBe(true)
    })

    it('accepte targetDose à zéro', () => {
      expect(validateEntry(validEntry({ targetDose: 0 })).valid).toBe(true)
    })

    it('accepte une note string', () => {
      expect(validateEntry(validEntry({ note: 'Super séance !' })).valid).toBe(true)
    })

    it('accepte une note absente', () => {
      const e = validEntry()
      delete (e as Record<string, unknown>).note
      expect(validateEntry(e).valid).toBe(true)
    })

    it('utilise le prefix index si fourni', () => {
      const result = validateEntry(null, 3)
      expect(result.errors[0].field).toBe('entries[3]')
    })
  })

  describe('inputs invalides - types', () => {
    it('rejette null', () => {
      const result = validateEntry(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].type).toBe('INVALID_TYPE')
    })

    it('rejette undefined', () => {
      expect(validateEntry(undefined).valid).toBe(false)
    })

    it('rejette un string', () => {
      expect(validateEntry('entry').valid).toBe(false)
    })

    it('rejette note non-string', () => {
      const result = validateEntry(validEntry({ note: 42 }))
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('note'))).toBe(true)
    })

    it('rejette note booléen', () => {
      expect(validateEntry(validEntry({ note: true })).valid).toBe(false)
    })
  })

  describe('inputs invalides - champs manquants', () => {
    it('rejette id vide', () => {
      expect(validateEntry(validEntry({ id: '' })).valid).toBe(false)
    })

    it('rejette habitId vide', () => {
      expect(validateEntry(validEntry({ habitId: '' })).valid).toBe(false)
    })

    it('rejette createdAt vide', () => {
      expect(validateEntry(validEntry({ createdAt: '' })).valid).toBe(false)
    })

    it('rejette updatedAt vide', () => {
      expect(validateEntry(validEntry({ updatedAt: '' })).valid).toBe(false)
    })
  })

  describe('inputs invalides - valeurs', () => {
    it('rejette date format invalide', () => {
      expect(validateEntry(validEntry({ date: '15-01-2025' })).valid).toBe(false)
    })

    it('rejette date non numérique', () => {
      expect(validateEntry(validEntry({ date: '2025-XX-01' })).valid).toBe(false)
    })

    it('rejette targetDose négatif', () => {
      expect(validateEntry(validEntry({ targetDose: -1 })).valid).toBe(false)
    })

    it('rejette actualValue négatif', () => {
      expect(validateEntry(validEntry({ actualValue: -1 })).valid).toBe(false)
    })

    it('rejette targetDose NaN', () => {
      expect(validateEntry(validEntry({ targetDose: NaN })).valid).toBe(false)
    })

    it('rejette actualValue Infinity', () => {
      expect(validateEntry(validEntry({ actualValue: Infinity })).valid).toBe(false)
    })

    it('rejette targetDose string', () => {
      expect(validateEntry(validEntry({ targetDose: '12' })).valid).toBe(false)
    })
  })

  describe('erreurs multiples', () => {
    it('retourne toutes les erreurs', () => {
      const result = validateEntry({
        id: '',
        habitId: '',
        date: 'bad',
        targetDose: -1,
        actualValue: -1,
        createdAt: '',
        updatedAt: '',
      })
      expect(result.errors.length).toBeGreaterThanOrEqual(6)
    })
  })
})

// ============================================================================
// validateImportData
// ============================================================================

describe('validateImportData', () => {
  describe('données complètes valides', () => {
    it('accepte données vides', () => {
      expect(validateImportData(validAppData()).valid).toBe(true)
    })

    it('accepte données avec habitudes et entrées', () => {
      const data = validAppData({
        habits: [validHabit()],
        entries: [validEntry()],
      })
      expect(validateImportData(data).valid).toBe(true)
    })

    it('accepte onboardingCompleted true', () => {
      const data = validAppData({
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: '2025-01-12',
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })
      expect(validateImportData(data).valid).toBe(true)
    })
  })

  describe('données partielles', () => {
    it('rejette objet vide', () => {
      expect(validateImportData({}).valid).toBe(false)
    })

    it('rejette sans habits', () => {
      const data = { ...validAppData() }
      delete (data as Record<string, unknown>).habits
      expect(validateImportData(data).valid).toBe(false)
    })

    it('rejette sans entries', () => {
      const data = { ...validAppData() }
      delete (data as Record<string, unknown>).entries
      expect(validateImportData(data).valid).toBe(false)
    })

    it('rejette sans preferences', () => {
      const data = { ...validAppData() }
      delete (data as Record<string, unknown>).preferences
      expect(validateImportData(data).valid).toBe(false)
    })
  })

  describe('données corrompues', () => {
    it('rejette null', () => {
      const result = validateImportData(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].field).toBe('root')
    })

    it('rejette string', () => {
      expect(validateImportData('corrupt').valid).toBe(false)
    })

    it('rejette nombre', () => {
      expect(validateImportData(42).valid).toBe(false)
    })

    it('rejette tableau', () => {
      expect(validateImportData([]).valid).toBe(false)
    })

    it('rejette schemaVersion string', () => {
      expect(validateImportData(validAppData({ schemaVersion: '11' })).valid).toBe(false)
    })

    it('rejette schemaVersion négative', () => {
      expect(validateImportData(validAppData({ schemaVersion: -1 })).valid).toBe(false)
    })

    it('rejette schemaVersion zéro', () => {
      expect(validateImportData(validAppData({ schemaVersion: 0 })).valid).toBe(false)
    })

    it('rejette schemaVersion future', () => {
      const result = validateImportData(
        validAppData({ schemaVersion: CURRENT_SCHEMA_VERSION + 100 })
      )
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.type === 'SCHEMA_VERSION_ERROR')).toBe(true)
    })

    it('rejette habits non-tableau', () => {
      expect(validateImportData(validAppData({ habits: 'not-array' })).valid).toBe(false)
    })

    it('rejette entries non-tableau', () => {
      expect(validateImportData(validAppData({ entries: {} })).valid).toBe(false)
    })

    it("rejette IDs d'habitudes dupliqués", () => {
      const data = validAppData({
        habits: [validHabit({ id: 'dup' }), validHabit({ id: 'dup' })],
      })
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('dupliqué'))).toBe(true)
    })

    it("rejette IDs d'entrées dupliqués", () => {
      const data = validAppData({
        habits: [validHabit()],
        entries: [validEntry({ id: 'dup' }), validEntry({ id: 'dup' })],
      })
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.message.includes('dupliqué'))).toBe(true)
    })
  })

  describe('préférences invalides', () => {
    it('rejette preferences null', () => {
      expect(validateImportData(validAppData({ preferences: null })).valid).toBe(false)
    })

    it('rejette onboardingCompleted non-booléen', () => {
      const data = validAppData({
        preferences: {
          onboardingCompleted: 'yes',
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })
      expect(validateImportData(data).valid).toBe(false)
    })

    it('rejette lastWeeklyReviewDate format invalide', () => {
      const data = validAppData({
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: 'bad-date',
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })
      expect(validateImportData(data).valid).toBe(false)
    })

    it('accepte lastWeeklyReviewDate null', () => {
      const data = validAppData({
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })
      expect(validateImportData(data).valid).toBe(true)
    })

    it('rejette theme invalide', () => {
      const data = validAppData({
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          theme: 'neon',
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      })
      expect(validateImportData(data).valid).toBe(false)
    })

    it('accepte theme valide', () => {
      for (const theme of ['light', 'dark', 'system']) {
        const data = validAppData({
          preferences: {
            onboardingCompleted: true,
            lastWeeklyReviewDate: null,
            theme,
            notifications: DEFAULT_NOTIFICATION_SETTINGS,
          },
        })
        expect(validateImportData(data).valid).toBe(true)
      }
    })
  })

  describe('avertissements', () => {
    it('avertit si entrée référence habitude inexistante', () => {
      const data = validAppData({
        habits: [validHabit({ id: 'h1' })],
        entries: [validEntry({ habitId: 'h-unknown' })],
      })
      const result = validateImportData(data)
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('inexistante')
    })

    it('pas d avertissement si référence valide', () => {
      const data = validAppData({
        habits: [validHabit({ id: 'h1' })],
        entries: [validEntry({ habitId: 'h1' })],
      })
      const result = validateImportData(data)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('validation en cascade', () => {
    it('remonte les erreurs des habitudes individuelles', () => {
      const data = validAppData({
        habits: [validHabit({ startValue: -1 })],
      })
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('habits[0]'))).toBe(true)
    })

    it('remonte les erreurs des entrées individuelles', () => {
      const data = validAppData({
        habits: [validHabit()],
        entries: [validEntry({ actualValue: -1 })],
      })
      const result = validateImportData(data)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.field.includes('entries[0]'))).toBe(true)
    })
  })
})

// ============================================================================
// formatValidationErrors
// ============================================================================

describe('formatValidationErrors', () => {
  it('message positif si valide', () => {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] }
    expect(formatValidationErrors(result)).toContain('Aucune erreur')
  })

  it('affiche le nombre d erreurs', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        { type: 'MISSING_FIELD', field: 'name', message: 'Requis' },
        { type: 'INVALID_VALUE', field: 'value', message: 'Invalide' },
      ],
      warnings: [],
    }
    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('2 erreur(s)')
  })

  it('affiche chaque erreur avec son champ', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [{ type: 'MISSING_FIELD', field: 'habit.name', message: 'Le nom est requis' }],
      warnings: [],
    }
    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('[habit.name]')
    expect(formatted).toContain('Le nom est requis')
  })

  it('affiche les avertissements', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [{ type: 'INVALID_VALUE', field: 'test', message: 'Erreur' }],
      warnings: ['Attention ici', 'Et là aussi'],
    }
    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('2 avertissement(s)')
    expect(formatted).toContain('Attention ici')
    expect(formatted).toContain('Et là aussi')
  })

  it('pas de section avertissements si aucun warning', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [{ type: 'INVALID_VALUE', field: 'test', message: 'Erreur' }],
      warnings: [],
    }
    const formatted = formatValidationErrors(result)
    expect(formatted).not.toContain('avertissement')
  })

  it('numérote les erreurs', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        { type: 'MISSING_FIELD', field: 'a', message: 'First' },
        { type: 'MISSING_FIELD', field: 'b', message: 'Second' },
        { type: 'MISSING_FIELD', field: 'c', message: 'Third' },
      ],
      warnings: [],
    }
    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('1.')
    expect(formatted).toContain('2.')
    expect(formatted).toContain('3.')
  })
})
