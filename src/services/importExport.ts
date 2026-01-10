/**
 * Service d'import/export de données
 * Gère l'export JSON et l'import avec validation et migration
 */

import type { AppData } from '../types'
import { loadData, saveData, StorageResult } from './storage'
import { validateImportData, ValidationResult, formatValidationErrors } from './validation'
import { runMigrations, needsMigration, MigrationResult, formatMigrationResult } from './migration'

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Résultat d'export
 */
export interface ExportResult {
  success: boolean
  filename?: string
  error?: string
}

/**
 * Résultat d'import
 */
export interface ImportResult {
  success: boolean
  /** Résultat de validation */
  validation?: ValidationResult
  /** Résultat de migration (si applicable) */
  migration?: MigrationResult
  /** Nombre d'habitudes importées */
  habitsCount?: number
  /** Nombre d'entrées importées */
  entriesCount?: number
  /** Message d'erreur */
  error?: string
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Génère le nom de fichier pour l'export
 */
function generateExportFilename(): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
  return `doucement-export-${date}-${time}.json`
}

/**
 * Exporte les données actuelles en fichier JSON téléchargeable
 */
export function exportData(): ExportResult {
  // Charge les données actuelles
  const loadResult = loadData()

  if (!loadResult.success || !loadResult.data) {
    return {
      success: false,
      error: loadResult.error?.message ?? 'Impossible de charger les données',
    }
  }

  try {
    // Prépare le JSON avec une indentation lisible
    const jsonContent = JSON.stringify(loadResult.data, null, 2)

    // Crée un blob et un lien de téléchargement
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const filename = generateExportFilename()

    // Crée un élément <a> temporaire pour déclencher le téléchargement
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Nettoie
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return {
      success: true,
      filename,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return {
      success: false,
      error: `Erreur lors de l'export: ${message}`,
    }
  }
}

/**
 * Exporte les données sans déclencher le téléchargement (pour les tests)
 */
export function exportDataAsJson(): StorageResult<string> {
  const loadResult = loadData()

  if (!loadResult.success || !loadResult.data) {
    return {
      success: false,
      error: loadResult.error,
    }
  }

  try {
    const jsonContent = JSON.stringify(loadResult.data, null, 2)
    return {
      success: true,
      data: jsonContent,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'Erreur lors de la sérialisation',
        originalError: error,
      },
    }
  }
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Parse le contenu JSON d'un fichier
 */
function parseJsonContent(content: string): { success: boolean; data?: unknown; error?: string } {
  try {
    const data = JSON.parse(content)
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de syntaxe JSON'
    return {
      success: false,
      error: `Format JSON invalide: ${message}`,
    }
  }
}

/**
 * Importe des données en mode "remplacer"
 * Remplace complètement les données existantes par les données importées
 */
export function importDataReplace(jsonContent: string): ImportResult {
  // 1. Parse le JSON
  const parseResult = parseJsonContent(jsonContent)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    }
  }

  const rawData = parseResult.data as Record<string, unknown>

  // 2. Valide la structure
  const validationResult = validateImportData(rawData)
  if (!validationResult.valid) {
    return {
      success: false,
      validation: validationResult,
      error: `Données invalides:\n${formatValidationErrors(validationResult)}`,
    }
  }

  // 3. Applique les migrations si nécessaire
  let migratedData: AppData
  let migrationResult: MigrationResult | undefined

  if (needsMigration(rawData)) {
    migrationResult = runMigrations(rawData)
    if (!migrationResult.success || !migrationResult.data) {
      return {
        success: false,
        validation: validationResult,
        migration: migrationResult,
        error: formatMigrationResult(migrationResult),
      }
    }
    migratedData = migrationResult.data
  } else {
    migratedData = rawData as unknown as AppData
  }

  // 4. Sauvegarde les données
  const saveResult = saveData(migratedData)
  if (!saveResult.success) {
    return {
      success: false,
      validation: validationResult,
      migration: migrationResult,
      error: saveResult.error?.message ?? 'Erreur lors de la sauvegarde',
    }
  }

  return {
    success: true,
    validation: validationResult,
    migration: migrationResult,
    habitsCount: migratedData.habits.length,
    entriesCount: migratedData.entries.length,
  }
}

/**
 * Lit le contenu d'un fichier sélectionné par l'utilisateur
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        resolve(content)
      } else {
        reject(new Error('Impossible de lire le contenu du fichier'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'))
    }

    reader.readAsText(file)
  })
}

/**
 * Importe les données depuis un fichier File
 * Wrapper pratique pour l'utilisation avec un input file
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    // Vérifie le type de fichier
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        error: 'Le fichier doit être au format JSON (.json)',
      }
    }

    // Lit le contenu
    const content = await readFileContent(file)

    // Importe avec remplacement
    return importDataReplace(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return {
      success: false,
      error: `Erreur lors de l'import: ${message}`,
    }
  }
}

// ============================================================================
// MERGE IMPORT FUNCTIONS
// ============================================================================

/**
 * Options de fusion pour l'import
 */
export interface MergeOptions {
  /** Comment résoudre les conflits d'habitudes avec le même ID */
  habitConflictStrategy: 'keep_local' | 'keep_imported' | 'keep_newest'
  /** Comment résoudre les conflits d'entrées avec le même ID */
  entryConflictStrategy: 'keep_local' | 'keep_imported' | 'keep_newest'
}

/**
 * Options par défaut pour la fusion
 */
export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  habitConflictStrategy: 'keep_newest',
  entryConflictStrategy: 'keep_newest',
}

/**
 * Résultat de fusion étendu
 */
export interface MergeImportResult extends ImportResult {
  /** Nombre d'habitudes ajoutées (nouvelles) */
  habitsAdded?: number
  /** Nombre d'habitudes mises à jour (existantes) */
  habitsUpdated?: number
  /** Nombre d'habitudes conservées (sans changement) */
  habitsKept?: number
  /** Nombre d'entrées ajoutées (nouvelles) */
  entriesAdded?: number
  /** Nombre d'entrées mises à jour (existantes) */
  entriesUpdated?: number
  /** Nombre d'entrées conservées (sans changement) */
  entriesKept?: number
}

/**
 * Compare deux dates ISO et retourne la plus récente
 */
function isNewer(date1: string | undefined, date2: string | undefined): boolean {
  if (!date1) return false
  if (!date2) return true
  return new Date(date1) > new Date(date2)
}

/**
 * Fusionne deux habitudes selon la stratégie choisie
 */
function mergeHabit(
  local: import('../types').Habit,
  imported: import('../types').Habit,
  strategy: MergeOptions['habitConflictStrategy']
): { habit: import('../types').Habit; action: 'kept' | 'updated' } {
  switch (strategy) {
    case 'keep_local':
      return { habit: local, action: 'kept' }
    case 'keep_imported':
      return { habit: imported, action: 'updated' }
    case 'keep_newest': {
      // Compare archivedAt first (if one is archived and not the other)
      // Then compare createdAt as a proxy for "last modified"
      const localDate = local.archivedAt ?? local.createdAt
      const importedDate = imported.archivedAt ?? imported.createdAt
      if (isNewer(importedDate, localDate)) {
        return { habit: imported, action: 'updated' }
      }
      return { habit: local, action: 'kept' }
    }
  }
}

/**
 * Fusionne deux entrées selon la stratégie choisie
 */
function mergeEntry(
  local: import('../types').DailyEntry,
  imported: import('../types').DailyEntry,
  strategy: MergeOptions['entryConflictStrategy']
): { entry: import('../types').DailyEntry; action: 'kept' | 'updated' } {
  switch (strategy) {
    case 'keep_local':
      return { entry: local, action: 'kept' }
    case 'keep_imported':
      return { entry: imported, action: 'updated' }
    case 'keep_newest':
      if (isNewer(imported.updatedAt, local.updatedAt)) {
        return { entry: imported, action: 'updated' }
      }
      return { entry: local, action: 'kept' }
  }
}

/**
 * Importe des données en mode "fusionner"
 * Fusionne intelligemment les données importées avec les données existantes
 */
export function importDataMerge(
  jsonContent: string,
  options: MergeOptions = DEFAULT_MERGE_OPTIONS
): MergeImportResult {
  // 1. Parse le JSON
  const parseResult = parseJsonContent(jsonContent)
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    }
  }

  const rawData = parseResult.data as Record<string, unknown>

  // 2. Valide la structure
  const validationResult = validateImportData(rawData)
  if (!validationResult.valid) {
    return {
      success: false,
      validation: validationResult,
      error: `Données invalides:\n${formatValidationErrors(validationResult)}`,
    }
  }

  // 3. Applique les migrations si nécessaire
  let importedData: AppData
  let migrationResult: MigrationResult | undefined

  if (needsMigration(rawData)) {
    migrationResult = runMigrations(rawData)
    if (!migrationResult.success || !migrationResult.data) {
      return {
        success: false,
        validation: validationResult,
        migration: migrationResult,
        error: formatMigrationResult(migrationResult),
      }
    }
    importedData = migrationResult.data
  } else {
    importedData = rawData as unknown as AppData
  }

  // 4. Charge les données locales existantes
  const localResult = loadData()
  if (!localResult.success || !localResult.data) {
    // Si pas de données locales, on fait un simple remplacement
    const saveResult = saveData(importedData)
    if (!saveResult.success) {
      return {
        success: false,
        validation: validationResult,
        migration: migrationResult,
        error: saveResult.error?.message ?? 'Erreur lors de la sauvegarde',
      }
    }
    return {
      success: true,
      validation: validationResult,
      migration: migrationResult,
      habitsCount: importedData.habits.length,
      entriesCount: importedData.entries.length,
      habitsAdded: importedData.habits.length,
      habitsUpdated: 0,
      habitsKept: 0,
      entriesAdded: importedData.entries.length,
      entriesUpdated: 0,
      entriesKept: 0,
    }
  }

  const localData = localResult.data

  // 5. Fusionner les habitudes
  const localHabitsMap = new Map(localData.habits.map((h) => [h.id, h]))
  const mergedHabits: AppData['habits'] = []
  let habitsAdded = 0
  let habitsUpdated = 0
  let habitsKept = 0

  // Traiter les habitudes importées
  const processedHabitIds = new Set<string>()

  for (const importedHabit of importedData.habits) {
    processedHabitIds.add(importedHabit.id)
    const localHabit = localHabitsMap.get(importedHabit.id)

    if (!localHabit) {
      // Nouvelle habitude
      mergedHabits.push(importedHabit)
      habitsAdded++
    } else {
      // Habitude existante - fusionner
      const { habit, action } = mergeHabit(localHabit, importedHabit, options.habitConflictStrategy)
      mergedHabits.push(habit)
      if (action === 'updated') {
        habitsUpdated++
      } else {
        habitsKept++
      }
    }
  }

  // Ajouter les habitudes locales non présentes dans l'import
  for (const localHabit of localData.habits) {
    if (!processedHabitIds.has(localHabit.id)) {
      mergedHabits.push(localHabit)
      habitsKept++
    }
  }

  // 6. Fusionner les entrées
  const localEntriesMap = new Map(localData.entries.map((e) => [e.id, e]))
  const mergedEntries: AppData['entries'] = []
  let entriesAdded = 0
  let entriesUpdated = 0
  let entriesKept = 0

  // Traiter les entrées importées
  const processedEntryIds = new Set<string>()

  for (const importedEntry of importedData.entries) {
    processedEntryIds.add(importedEntry.id)
    const localEntry = localEntriesMap.get(importedEntry.id)

    if (!localEntry) {
      // Nouvelle entrée
      mergedEntries.push(importedEntry)
      entriesAdded++
    } else {
      // Entrée existante - fusionner
      const { entry, action } = mergeEntry(localEntry, importedEntry, options.entryConflictStrategy)
      mergedEntries.push(entry)
      if (action === 'updated') {
        entriesUpdated++
      } else {
        entriesKept++
      }
    }
  }

  // Ajouter les entrées locales non présentes dans l'import
  for (const localEntry of localData.entries) {
    if (!processedEntryIds.has(localEntry.id)) {
      mergedEntries.push(localEntry)
      entriesKept++
    }
  }

  // 7. Fusionner les préférences
  // On garde les préférences importées sauf pour onboardingCompleted qui reste true si déjà complété
  const mergedPreferences: AppData['preferences'] = {
    ...localData.preferences,
    ...importedData.preferences,
    onboardingCompleted:
      localData.preferences.onboardingCompleted || importedData.preferences.onboardingCompleted,
  }

  // 8. Construire et sauvegarder les données fusionnées
  const mergedData: AppData = {
    schemaVersion: importedData.schemaVersion,
    habits: mergedHabits,
    entries: mergedEntries,
    preferences: mergedPreferences,
  }

  const saveResult = saveData(mergedData)
  if (!saveResult.success) {
    return {
      success: false,
      validation: validationResult,
      migration: migrationResult,
      error: saveResult.error?.message ?? 'Erreur lors de la sauvegarde',
    }
  }

  return {
    success: true,
    validation: validationResult,
    migration: migrationResult,
    habitsCount: mergedHabits.length,
    entriesCount: mergedEntries.length,
    habitsAdded,
    habitsUpdated,
    habitsKept,
    entriesAdded,
    entriesUpdated,
    entriesKept,
  }
}

/**
 * Importe les données depuis un fichier File en mode fusion
 */
export async function importFromFileMerge(
  file: File,
  options: MergeOptions = DEFAULT_MERGE_OPTIONS
): Promise<MergeImportResult> {
  try {
    // Vérifie le type de fichier
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        error: 'Le fichier doit être au format JSON (.json)',
      }
    }

    // Lit le contenu
    const content = await readFileContent(file)

    // Importe avec fusion
    return importDataMerge(content, options)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return {
      success: false,
      error: `Erreur lors de l'import: ${message}`,
    }
  }
}

/**
 * Crée un résumé lisible du résultat de fusion
 */
export function formatMergeImportResult(result: MergeImportResult): string {
  if (!result.success) {
    return result.error ?? 'Import échoué'
  }

  const lines = [
    'Fusion réussie !',
    '',
    'Habitudes:',
    `  • ${result.habitsAdded ?? 0} ajoutée(s)`,
    `  • ${result.habitsUpdated ?? 0} mise(s) à jour`,
    `  • ${result.habitsKept ?? 0} conservée(s)`,
    '',
    'Entrées:',
    `  • ${result.entriesAdded ?? 0} ajoutée(s)`,
    `  • ${result.entriesUpdated ?? 0} mise(s) à jour`,
    `  • ${result.entriesKept ?? 0} conservée(s)`,
  ]

  if (result.migration?.migrationsApplied.length) {
    lines.push('')
    lines.push(formatMigrationResult(result.migration))
  }

  if (result.validation?.warnings.length) {
    lines.push('')
    lines.push('Avertissements:')
    result.validation.warnings.forEach((w) => lines.push(`  ⚠ ${w}`))
  }

  return lines.join('\n')
}

/**
 * Crée un résumé lisible du résultat d'import
 */
export function formatImportResult(result: ImportResult): string {
  if (!result.success) {
    return result.error ?? 'Import échoué'
  }

  const lines = [
    'Import réussi !',
    `  • ${result.habitsCount} habitude(s) importée(s)`,
    `  • ${result.entriesCount} entrée(s) importée(s)`,
  ]

  if (result.migration?.migrationsApplied.length) {
    lines.push('')
    lines.push(formatMigrationResult(result.migration))
  }

  if (result.validation?.warnings.length) {
    lines.push('')
    lines.push('Avertissements:')
    result.validation.warnings.forEach((w) => lines.push(`  ⚠ ${w}`))
  }

  return lines.join('\n')
}
