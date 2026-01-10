/**
 * Doucement - Types TypeScript
 * Définition des structures de données pour le stockage local
 */

// ============================================================================
// SCHEMA VERSION
// ============================================================================

/**
 * Version du schéma de données
 * Incrémentée à chaque modification de structure pour permettre les migrations
 */
export const CURRENT_SCHEMA_VERSION = 1;

// ============================================================================
// HABIT TYPES
// ============================================================================

/**
 * Direction de progression d'une habitude
 */
export type HabitDirection = 'increase' | 'decrease' | 'maintain';

/**
 * Mode de progression (absolu ou pourcentage)
 */
export type ProgressionMode = 'absolute' | 'percentage';

/**
 * Période de référence pour la progression
 */
export type ProgressionPeriod = 'daily' | 'weekly';

/**
 * Configuration de la progression d'une habitude
 */
export interface ProgressionConfig {
  /** Mode de progression */
  mode: ProgressionMode;
  /** Valeur de progression (+/- unités ou %) */
  value: number;
  /** Période de référence */
  period: ProgressionPeriod;
}

/**
 * Habitude de l'utilisateur
 */
export interface Habit {
  /** Identifiant unique */
  id: string;
  /** Nom de l'habitude */
  name: string;
  /** Emoji représentant l'habitude */
  emoji: string;
  /** Description optionnelle */
  description?: string;
  /** Direction de progression */
  direction: HabitDirection;
  /** Valeur de départ */
  startValue: number;
  /** Unité de mesure (répétitions, minutes, etc.) */
  unit: string;
  /** Configuration de progression (null si maintain) */
  progression: ProgressionConfig | null;
  /** Valeur cible finale (optionnelle) */
  targetValue?: number;
  /** Date de création (YYYY-MM-DD) */
  createdAt: string;
  /** Date d'archivage (YYYY-MM-DD), null si active */
  archivedAt: string | null;
}

// ============================================================================
// DAILY ENTRY TYPES
// ============================================================================

/**
 * Statut de complétion d'une entrée
 */
export type CompletionStatus = 'pending' | 'partial' | 'completed' | 'exceeded';

/**
 * Entrée quotidienne pour une habitude
 */
export interface DailyEntry {
  /** Identifiant unique */
  id: string;
  /** Référence à l'habitude */
  habitId: string;
  /** Date de l'entrée (YYYY-MM-DD) */
  date: string;
  /** Dose cible calculée pour ce jour */
  targetDose: number;
  /** Valeur réellement accomplie */
  actualValue: number;
  /** Note optionnelle */
  note?: string;
  /** Horodatage de création */
  createdAt: string;
  /** Horodatage de dernière modification */
  updatedAt: string;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  /** Onboarding terminé */
  onboardingCompleted: boolean;
  /** Dernière date de revue hebdomadaire (YYYY-MM-DD) */
  lastWeeklyReviewDate: string | null;
}

// ============================================================================
// APP DATA (ROOT)
// ============================================================================

/**
 * Structure racine des données de l'application
 * Stockée dans localStorage
 */
export interface AppData {
  /** Version du schéma pour migrations */
  schemaVersion: number;
  /** Liste des habitudes */
  habits: Habit[];
  /** Entrées quotidiennes */
  entries: DailyEntry[];
  /** Préférences utilisateur */
  preferences: UserPreferences;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Données pour créer une nouvelle habitude
 */
export type CreateHabitInput = Omit<Habit, 'id' | 'createdAt' | 'archivedAt'>;

/**
 * Données pour mettre à jour une habitude
 */
export type UpdateHabitInput = Partial<Omit<Habit, 'id' | 'createdAt'>>;

/**
 * Données pour créer une nouvelle entrée
 */
export type CreateEntryInput = Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Données initiales par défaut
 */
export const DEFAULT_APP_DATA: AppData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  habits: [],
  entries: [],
  preferences: {
    onboardingCompleted: false,
    lastWeeklyReviewDate: null,
  },
};
