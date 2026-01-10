/**
 * Service de validation pour l'import de données
 * Valide la structure et le contenu des données importées
 */

import type { HabitDirection, ProgressionMode, ProgressionPeriod } from '../types'
import { CURRENT_SCHEMA_VERSION } from '../types'

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Type d'erreur de validation
 */
export type ValidationErrorType =
  | 'MISSING_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'INVALID_FORMAT'
  | 'SCHEMA_VERSION_ERROR'

/**
 * Erreur de validation individuelle
 */
export interface ValidationError {
  type: ValidationErrorType
  field: string
  message: string
  value?: unknown
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifie si une valeur est une chaîne non vide
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Vérifie si une valeur est un nombre fini positif ou zéro
 */
function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

/**
 * Vérifie si une valeur est un nombre fini positif
 */
function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Vérifie si une date est au format YYYY-MM-DD
 */
function isValidDateFormat(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(value)) return false

  const date = new Date(value)
  return !isNaN(date.getTime())
}

/**
 * Vérifie si une valeur est une direction valide
 */
function isValidDirection(value: unknown): value is HabitDirection {
  return value === 'increase' || value === 'decrease' || value === 'maintain'
}

/**
 * Vérifie si une valeur est un mode de progression valide
 */
function isValidProgressionMode(value: unknown): value is ProgressionMode {
  return value === 'absolute' || value === 'percentage'
}

/**
 * Vérifie si une valeur est une période de progression valide
 */
function isValidProgressionPeriod(value: unknown): value is ProgressionPeriod {
  return value === 'daily' || value === 'weekly'
}

// ============================================================================
// PROGRESSION CONFIG VALIDATION
// ============================================================================

/**
 * Valide la configuration de progression
 */
function validateProgressionConfig(config: unknown, fieldPrefix: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (config === null) {
    return errors // null est valide pour les habitudes "maintain"
  }

  if (typeof config !== 'object') {
    errors.push({
      type: 'INVALID_TYPE',
      field: fieldPrefix,
      message: 'La configuration de progression doit être un objet ou null',
      value: config,
    })
    return errors
  }

  const obj = config as Record<string, unknown>

  // mode
  if (!isValidProgressionMode(obj.mode)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.mode`,
      message: 'Le mode doit être "absolute" ou "percentage"',
      value: obj.mode,
    })
  }

  // value
  if (!isPositiveNumber(obj.value)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.value`,
      message: 'La valeur de progression doit être un nombre positif',
      value: obj.value,
    })
  }

  // period
  if (!isValidProgressionPeriod(obj.period)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.period`,
      message: 'La période doit être "daily" ou "weekly"',
      value: obj.period,
    })
  }

  return errors
}

// ============================================================================
// HABIT VALIDATION
// ============================================================================

/**
 * Valide une habitude individuelle
 */
export function validateHabit(habit: unknown, index?: number): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const fieldPrefix = index !== undefined ? `habits[${index}]` : 'habit'

  if (typeof habit !== 'object' || habit === null) {
    return {
      valid: false,
      errors: [
        {
          type: 'INVALID_TYPE',
          field: fieldPrefix,
          message: "L'habitude doit être un objet",
          value: habit,
        },
      ],
      warnings: [],
    }
  }

  const obj = habit as Record<string, unknown>

  // id (requis)
  if (!isNonEmptyString(obj.id)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.id`,
      message: "L'identifiant est requis et doit être une chaîne non vide",
      value: obj.id,
    })
  }

  // name (requis)
  if (!isNonEmptyString(obj.name)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.name`,
      message: 'Le nom est requis et doit être une chaîne non vide',
      value: obj.name,
    })
  }

  // emoji (requis)
  if (!isNonEmptyString(obj.emoji)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.emoji`,
      message: "L'emoji est requis",
      value: obj.emoji,
    })
  }

  // description (optionnel mais doit être string si présent)
  if (obj.description !== undefined && typeof obj.description !== 'string') {
    errors.push({
      type: 'INVALID_TYPE',
      field: `${fieldPrefix}.description`,
      message: 'La description doit être une chaîne de caractères',
      value: obj.description,
    })
  }

  // direction (requis)
  if (!isValidDirection(obj.direction)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.direction`,
      message: 'La direction doit être "increase", "decrease" ou "maintain"',
      value: obj.direction,
    })
  }

  // startValue (requis)
  if (!isNonNegativeNumber(obj.startValue)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.startValue`,
      message: 'La valeur de départ doit être un nombre positif ou zéro',
      value: obj.startValue,
    })
  }

  // unit (requis)
  if (!isNonEmptyString(obj.unit)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.unit`,
      message: "L'unité est requise",
      value: obj.unit,
    })
  }

  // progression (validation selon direction)
  if (obj.direction === 'maintain') {
    if (obj.progression !== null) {
      warnings.push(
        `${fieldPrefix}: Une habitude "maintain" ne devrait pas avoir de configuration de progression`
      )
    }
  } else {
    const progressionErrors = validateProgressionConfig(
      obj.progression,
      `${fieldPrefix}.progression`
    )
    errors.push(...progressionErrors)
  }

  // targetValue (optionnel mais doit être un nombre positif si présent)
  if (obj.targetValue !== undefined) {
    if (!isPositiveNumber(obj.targetValue)) {
      errors.push({
        type: 'INVALID_VALUE',
        field: `${fieldPrefix}.targetValue`,
        message: 'La valeur cible doit être un nombre positif',
        value: obj.targetValue,
      })
    }
  }

  // createdAt (requis, format YYYY-MM-DD)
  if (!isValidDateFormat(obj.createdAt)) {
    errors.push({
      type: 'INVALID_FORMAT',
      field: `${fieldPrefix}.createdAt`,
      message: 'La date de création doit être au format YYYY-MM-DD',
      value: obj.createdAt,
    })
  }

  // archivedAt (nullable, format YYYY-MM-DD si présent)
  if (obj.archivedAt !== null && obj.archivedAt !== undefined) {
    if (!isValidDateFormat(obj.archivedAt)) {
      errors.push({
        type: 'INVALID_FORMAT',
        field: `${fieldPrefix}.archivedAt`,
        message: "La date d'archivage doit être au format YYYY-MM-DD ou null",
        value: obj.archivedAt,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// DAILY ENTRY VALIDATION
// ============================================================================

/**
 * Valide une entrée quotidienne
 */
export function validateEntry(entry: unknown, index?: number): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const fieldPrefix = index !== undefined ? `entries[${index}]` : 'entry'

  if (typeof entry !== 'object' || entry === null) {
    return {
      valid: false,
      errors: [
        {
          type: 'INVALID_TYPE',
          field: fieldPrefix,
          message: "L'entrée doit être un objet",
          value: entry,
        },
      ],
      warnings: [],
    }
  }

  const obj = entry as Record<string, unknown>

  // id (requis)
  if (!isNonEmptyString(obj.id)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.id`,
      message: "L'identifiant est requis",
      value: obj.id,
    })
  }

  // habitId (requis)
  if (!isNonEmptyString(obj.habitId)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.habitId`,
      message: "La référence à l'habitude est requise",
      value: obj.habitId,
    })
  }

  // date (requis, format YYYY-MM-DD)
  if (!isValidDateFormat(obj.date)) {
    errors.push({
      type: 'INVALID_FORMAT',
      field: `${fieldPrefix}.date`,
      message: 'La date doit être au format YYYY-MM-DD',
      value: obj.date,
    })
  }

  // targetDose (requis)
  if (!isNonNegativeNumber(obj.targetDose)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.targetDose`,
      message: 'La dose cible doit être un nombre positif ou zéro',
      value: obj.targetDose,
    })
  }

  // actualValue (requis)
  if (!isNonNegativeNumber(obj.actualValue)) {
    errors.push({
      type: 'INVALID_VALUE',
      field: `${fieldPrefix}.actualValue`,
      message: 'La valeur réelle doit être un nombre positif ou zéro',
      value: obj.actualValue,
    })
  }

  // note (optionnel)
  if (obj.note !== undefined && typeof obj.note !== 'string') {
    errors.push({
      type: 'INVALID_TYPE',
      field: `${fieldPrefix}.note`,
      message: 'La note doit être une chaîne de caractères',
      value: obj.note,
    })
  }

  // createdAt (requis, ISO timestamp)
  if (!isNonEmptyString(obj.createdAt)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.createdAt`,
      message: "L'horodatage de création est requis",
      value: obj.createdAt,
    })
  }

  // updatedAt (requis, ISO timestamp)
  if (!isNonEmptyString(obj.updatedAt)) {
    errors.push({
      type: 'MISSING_FIELD',
      field: `${fieldPrefix}.updatedAt`,
      message: "L'horodatage de mise à jour est requis",
      value: obj.updatedAt,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// USER PREFERENCES VALIDATION
// ============================================================================

/**
 * Valide les préférences utilisateur
 */
function validatePreferences(preferences: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  if (typeof preferences !== 'object' || preferences === null) {
    return {
      valid: false,
      errors: [
        {
          type: 'INVALID_TYPE',
          field: 'preferences',
          message: 'Les préférences doivent être un objet',
          value: preferences,
        },
      ],
      warnings: [],
    }
  }

  const obj = preferences as Record<string, unknown>

  // onboardingCompleted (requis)
  if (typeof obj.onboardingCompleted !== 'boolean') {
    errors.push({
      type: 'INVALID_TYPE',
      field: 'preferences.onboardingCompleted',
      message: 'Le champ onboardingCompleted doit être un booléen',
      value: obj.onboardingCompleted,
    })
  }

  // lastWeeklyReviewDate (nullable)
  if (obj.lastWeeklyReviewDate !== null && obj.lastWeeklyReviewDate !== undefined) {
    if (!isValidDateFormat(obj.lastWeeklyReviewDate)) {
      errors.push({
        type: 'INVALID_FORMAT',
        field: 'preferences.lastWeeklyReviewDate',
        message: 'La date de dernière revue doit être au format YYYY-MM-DD ou null',
        value: obj.lastWeeklyReviewDate,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// APP DATA VALIDATION
// ============================================================================

/**
 * Valide les données complètes de l'application pour l'import
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  // Vérifie que c'est un objet
  if (typeof data !== 'object' || data === null) {
    return {
      valid: false,
      errors: [
        {
          type: 'INVALID_TYPE',
          field: 'root',
          message: 'Les données doivent être un objet',
          value: data,
        },
      ],
      warnings: [],
    }
  }

  const obj = data as Record<string, unknown>

  // schemaVersion (requis)
  if (typeof obj.schemaVersion !== 'number') {
    errors.push({
      type: 'MISSING_FIELD',
      field: 'schemaVersion',
      message: 'La version du schéma est requise',
      value: obj.schemaVersion,
    })
  } else if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push({
      type: 'SCHEMA_VERSION_ERROR',
      field: 'schemaVersion',
      message: `Version de schéma non supportée: ${obj.schemaVersion}. Version maximale: ${CURRENT_SCHEMA_VERSION}`,
      value: obj.schemaVersion,
    })
  } else if (obj.schemaVersion < 1) {
    errors.push({
      type: 'INVALID_VALUE',
      field: 'schemaVersion',
      message: 'La version du schéma doit être >= 1',
      value: obj.schemaVersion,
    })
  }

  // habits (requis, array)
  if (!Array.isArray(obj.habits)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: 'habits',
      message: 'La liste des habitudes doit être un tableau',
      value: obj.habits,
    })
  } else {
    // Valide chaque habitude
    const habitIds = new Set<string>()

    obj.habits.forEach((habit, index) => {
      const result = validateHabit(habit, index)
      errors.push(...result.errors)
      warnings.push(...result.warnings)

      // Vérifie les doublons d'ID
      if (typeof habit === 'object' && habit !== null) {
        const h = habit as Record<string, unknown>
        if (typeof h.id === 'string') {
          if (habitIds.has(h.id)) {
            errors.push({
              type: 'INVALID_VALUE',
              field: `habits[${index}].id`,
              message: `ID d'habitude dupliqué: ${h.id}`,
              value: h.id,
            })
          }
          habitIds.add(h.id)
        }
      }
    })
  }

  // entries (requis, array)
  if (!Array.isArray(obj.entries)) {
    errors.push({
      type: 'INVALID_TYPE',
      field: 'entries',
      message: 'La liste des entrées doit être un tableau',
      value: obj.entries,
    })
  } else {
    // Valide chaque entrée
    const entryIds = new Set<string>()

    obj.entries.forEach((entry, index) => {
      const result = validateEntry(entry, index)
      errors.push(...result.errors)
      warnings.push(...result.warnings)

      // Vérifie les doublons d'ID
      if (typeof entry === 'object' && entry !== null) {
        const e = entry as Record<string, unknown>
        if (typeof e.id === 'string') {
          if (entryIds.has(e.id)) {
            errors.push({
              type: 'INVALID_VALUE',
              field: `entries[${index}].id`,
              message: `ID d'entrée dupliqué: ${e.id}`,
              value: e.id,
            })
          }
          entryIds.add(e.id)
        }
      }
    })

    // Vérifie que les entrées référencent des habitudes existantes
    if (Array.isArray(obj.habits)) {
      const validHabitIds = new Set(
        (obj.habits as Array<Record<string, unknown>>)
          .filter((h) => typeof h?.id === 'string')
          .map((h) => h.id as string)
      )

      ;(obj.entries as Array<Record<string, unknown>>).forEach((entry, index) => {
        if (typeof entry?.habitId === 'string' && !validHabitIds.has(entry.habitId)) {
          warnings.push(
            `entries[${index}]: Référence à une habitude inexistante (${entry.habitId})`
          )
        }
      })
    }
  }

  // preferences (requis)
  const prefsResult = validatePreferences(obj.preferences)
  errors.push(...prefsResult.errors)
  warnings.push(...prefsResult.warnings)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Crée un résumé lisible des erreurs de validation
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return 'Aucune erreur de validation'
  }

  const lines: string[] = [`${result.errors.length} erreur(s) trouvée(s):`]

  result.errors.forEach((error, index) => {
    lines.push(`  ${index + 1}. [${error.field}] ${error.message}`)
  })

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push(`${result.warnings.length} avertissement(s):`)
    result.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning}`)
    })
  }

  return lines.join('\n')
}
