/**
 * Service de migration de données
 * Gère les migrations entre versions du schéma
 */

import { AppData, CURRENT_SCHEMA_VERSION, DEFAULT_NOTIFICATION_SETTINGS } from '../types';

// ============================================================================
// MIGRATION TYPES
// ============================================================================

/**
 * Fonction de migration
 * Transforme les données d'une version vers la suivante
 */
export type MigrationFunction = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Définition d'une migration
 */
export interface Migration {
  /** Version source */
  fromVersion: number;
  /** Version cible */
  toVersion: number;
  /** Description de la migration */
  description: string;
  /** Fonction de migration */
  migrate: MigrationFunction;
}

/**
 * Résultat d'une migration
 */
export interface MigrationResult {
  success: boolean;
  /** Version de départ */
  fromVersion: number;
  /** Version finale */
  toVersion: number;
  /** Migrations appliquées */
  migrationsApplied: string[];
  /** Données migrées (si succès) */
  data?: AppData;
  /** Message d'erreur (si échec) */
  error?: string;
}

// ============================================================================
// MIGRATIONS REGISTRY
// ============================================================================

/**
 * Registry des migrations disponibles
 * Chaque migration transforme les données d'une version vers la suivante
 *
 * Pour ajouter une nouvelle migration :
 * 1. Créer une fonction de migration
 * 2. L'ajouter au registry avec fromVersion et toVersion
 * 3. Incrémenter CURRENT_SCHEMA_VERSION dans types/index.ts
 */
export const MIGRATIONS: Migration[] = [
  {
    fromVersion: 1,
    toVersion: 2,
    description: 'Ajout des paramètres de notifications aux préférences utilisateur',
    migrate: (data) => {
      const preferences = data.preferences as Record<string, unknown> | undefined;
      return {
        ...data,
        schemaVersion: 2,
        preferences: {
          ...preferences,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      };
    },
  },
  {
    fromVersion: 2,
    toVersion: 3,
    description: 'Ajout des champs Phase 6: trackingMode, implementationIntention, anchorHabitId',
    migrate: (data) => {
      // Les nouveaux champs sont optionnels, donc pas de transformation nécessaire
      // Les habitudes existantes fonctionneront sans ces champs (undefined)
      // Le mode de tracking par défaut sera 'detailed' (comportement actuel)
      return {
        ...data,
        schemaVersion: 3,
      };
    },
  },
];

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Trouve les migrations à appliquer pour passer d'une version à une autre
 */
function findMigrationPath(
  fromVersion: number,
  toVersion: number
): Migration[] {
  if (fromVersion >= toVersion) {
    return [];
  }

  const path: Migration[] = [];
  let currentVersion = fromVersion;

  while (currentVersion < toVersion) {
    const nextMigration = MIGRATIONS.find(m => m.fromVersion === currentVersion);

    if (!nextMigration) {
      // Pas de migration trouvée, on arrête
      break;
    }

    path.push(nextMigration);
    currentVersion = nextMigration.toVersion;
  }

  return path;
}

/**
 * Vérifie si une migration est nécessaire
 */
export function needsMigration(data: Record<string, unknown>): boolean {
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
  return version < CURRENT_SCHEMA_VERSION;
}

/**
 * Exécute les migrations nécessaires sur les données
 */
export function runMigrations(data: Record<string, unknown>): MigrationResult {
  const fromVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;

  // Vérifie si la version est trop récente
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      fromVersion,
      toVersion: fromVersion,
      migrationsApplied: [],
      error: `Version de schéma non supportée: ${fromVersion}. Version maximale: ${CURRENT_SCHEMA_VERSION}`,
    };
  }

  // Pas de migration nécessaire
  if (fromVersion === CURRENT_SCHEMA_VERSION) {
    return {
      success: true,
      fromVersion,
      toVersion: fromVersion,
      migrationsApplied: [],
      data: data as unknown as AppData,
    };
  }

  // Trouve le chemin de migration
  const migrationPath = findMigrationPath(fromVersion, CURRENT_SCHEMA_VERSION);

  // Si pas de chemin complet et version différente
  if (migrationPath.length === 0 && fromVersion < CURRENT_SCHEMA_VERSION) {
    // Aucune migration définie, mais données à une version antérieure
    // On considère les données comme compatibles (pas de changement de structure)
    return {
      success: true,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      migrationsApplied: [],
      data: {
        ...data,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      } as unknown as AppData,
    };
  }

  // Applique les migrations séquentiellement
  let currentData = { ...data };
  const appliedMigrations: string[] = [];

  try {
    for (const migration of migrationPath) {
      currentData = migration.migrate(currentData);
      appliedMigrations.push(migration.description);
    }

    // Assure que la version finale est correcte
    currentData.schemaVersion = CURRENT_SCHEMA_VERSION;

    return {
      success: true,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      migrationsApplied: appliedMigrations,
      data: currentData as unknown as AppData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return {
      success: false,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      migrationsApplied: appliedMigrations,
      error: `Erreur lors de la migration: ${errorMessage}`,
    };
  }
}

/**
 * Crée un résumé lisible du résultat de migration
 */
export function formatMigrationResult(result: MigrationResult): string {
  if (!result.success) {
    return `Migration échouée: ${result.error}`;
  }

  if (result.migrationsApplied.length === 0) {
    if (result.fromVersion === result.toVersion) {
      return `Données à jour (version ${result.toVersion})`;
    }
    return `Données mises à jour de la version ${result.fromVersion} vers ${result.toVersion} (aucune transformation requise)`;
  }

  const lines = [
    `Migration réussie de la version ${result.fromVersion} vers ${result.toVersion}`,
    `${result.migrationsApplied.length} migration(s) appliquée(s):`,
    ...result.migrationsApplied.map((desc, i) => `  ${i + 1}. ${desc}`),
  ];

  return lines.join('\n');
}
