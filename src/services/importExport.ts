/**
 * Service d'import/export de données
 * Gère l'export JSON et l'import avec validation et migration
 */

import type { AppData } from '../types';
import { loadData, saveData, StorageResult } from './storage';
import { validateImportData, ValidationResult, formatValidationErrors } from './validation';
import { runMigrations, needsMigration, MigrationResult, formatMigrationResult } from './migration';

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Résultat d'export
 */
export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * Résultat d'import
 */
export interface ImportResult {
  success: boolean;
  /** Résultat de validation */
  validation?: ValidationResult;
  /** Résultat de migration (si applicable) */
  migration?: MigrationResult;
  /** Nombre d'habitudes importées */
  habitsCount?: number;
  /** Nombre d'entrées importées */
  entriesCount?: number;
  /** Message d'erreur */
  error?: string;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Génère le nom de fichier pour l'export
 */
function generateExportFilename(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `doucement-export-${date}-${time}.json`;
}

/**
 * Exporte les données actuelles en fichier JSON téléchargeable
 */
export function exportData(): ExportResult {
  // Charge les données actuelles
  const loadResult = loadData();

  if (!loadResult.success || !loadResult.data) {
    return {
      success: false,
      error: loadResult.error?.message ?? 'Impossible de charger les données',
    };
  }

  try {
    // Prépare le JSON avec une indentation lisible
    const jsonContent = JSON.stringify(loadResult.data, null, 2);

    // Crée un blob et un lien de téléchargement
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = generateExportFilename();

    // Crée un élément <a> temporaire pour déclencher le téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Nettoie
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: `Erreur lors de l'export: ${message}`,
    };
  }
}

/**
 * Exporte les données sans déclencher le téléchargement (pour les tests)
 */
export function exportDataAsJson(): StorageResult<string> {
  const loadResult = loadData();

  if (!loadResult.success || !loadResult.data) {
    return {
      success: false,
      error: loadResult.error,
    };
  }

  try {
    const jsonContent = JSON.stringify(loadResult.data, null, 2);
    return {
      success: true,
      data: jsonContent,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'Erreur lors de la sérialisation',
        originalError: error,
      },
    };
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
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de syntaxe JSON';
    return {
      success: false,
      error: `Format JSON invalide: ${message}`,
    };
  }
}

/**
 * Importe des données en mode "remplacer"
 * Remplace complètement les données existantes par les données importées
 */
export function importDataReplace(jsonContent: string): ImportResult {
  // 1. Parse le JSON
  const parseResult = parseJsonContent(jsonContent);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error,
    };
  }

  const rawData = parseResult.data as Record<string, unknown>;

  // 2. Valide la structure
  const validationResult = validateImportData(rawData);
  if (!validationResult.valid) {
    return {
      success: false,
      validation: validationResult,
      error: `Données invalides:\n${formatValidationErrors(validationResult)}`,
    };
  }

  // 3. Applique les migrations si nécessaire
  let migratedData: AppData;
  let migrationResult: MigrationResult | undefined;

  if (needsMigration(rawData)) {
    migrationResult = runMigrations(rawData);
    if (!migrationResult.success || !migrationResult.data) {
      return {
        success: false,
        validation: validationResult,
        migration: migrationResult,
        error: formatMigrationResult(migrationResult),
      };
    }
    migratedData = migrationResult.data;
  } else {
    migratedData = rawData as unknown as AppData;
  }

  // 4. Sauvegarde les données
  const saveResult = saveData(migratedData);
  if (!saveResult.success) {
    return {
      success: false,
      validation: validationResult,
      migration: migrationResult,
      error: saveResult.error?.message ?? 'Erreur lors de la sauvegarde',
    };
  }

  return {
    success: true,
    validation: validationResult,
    migration: migrationResult,
    habitsCount: migratedData.habits.length,
    entriesCount: migratedData.entries.length,
  };
}

/**
 * Lit le contenu d'un fichier sélectionné par l'utilisateur
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Impossible de lire le contenu du fichier'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsText(file);
  });
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
      };
    }

    // Lit le contenu
    const content = await readFileContent(file);

    // Importe avec remplacement
    return importDataReplace(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      error: `Erreur lors de l'import: ${message}`,
    };
  }
}

/**
 * Crée un résumé lisible du résultat d'import
 */
export function formatImportResult(result: ImportResult): string {
  if (!result.success) {
    return result.error ?? 'Import échoué';
  }

  const lines = [
    'Import réussi !',
    `  • ${result.habitsCount} habitude(s) importée(s)`,
    `  • ${result.entriesCount} entrée(s) importée(s)`,
  ];

  if (result.migration?.migrationsApplied.length) {
    lines.push('');
    lines.push(formatMigrationResult(result.migration));
  }

  if (result.validation?.warnings.length) {
    lines.push('');
    lines.push('Avertissements:');
    result.validation.warnings.forEach(w => lines.push(`  ⚠ ${w}`));
  }

  return lines.join('\n');
}
