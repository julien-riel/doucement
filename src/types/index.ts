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
export const CURRENT_SCHEMA_VERSION = 3;

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
 * Mode de tracking d'une habitude
 * - simple: binaire (fait / pas fait) - recommandé pour débuter
 * - detailed: quantitatif avec valeur précise
 */
export type TrackingMode = 'simple' | 'detailed';

/**
 * Implementation Intention (si-alors)
 * Basé sur la recherche de Gollwitzer (1999)
 * "Après [DÉCLENCHEUR], je ferai [HABITUDE] à [LIEU]"
 */
export interface ImplementationIntention {
  /** Déclencheur de l'habitude (ex: "Après mon café du matin") */
  trigger?: string;
  /** Lieu où l'habitude sera effectuée (ex: "Dans le salon") */
  location?: string;
  /** Heure prévue (format HH:MM, optionnel) */
  time?: string;
}

/**
 * Pause planifiée pour une habitude
 * Permet de mettre en pause sans impact sur les stats
 */
export interface PlannedPause {
  /** Date de début de la pause (YYYY-MM-DD) */
  startDate: string;
  /** Date de fin de la pause (YYYY-MM-DD) */
  endDate: string;
  /** Raison optionnelle */
  reason?: string;
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
  /** Mode de tracking: simple (binaire) ou detailed (quantitatif) */
  trackingMode?: TrackingMode;
  /** Implementation Intention - plan si-alors (Phase 6) */
  implementationIntention?: ImplementationIntention;
  /** ID de l'habitude d'ancrage pour Habit Stacking (Phase 6) */
  anchorHabitId?: string;
  /** Pause planifiée active (Phase 6) */
  plannedPause?: PlannedPause | null;
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
// NOTIFICATION TYPES
// ============================================================================

/**
 * Type de rappel de notification
 */
export type ReminderType = 'morning' | 'evening' | 'weeklyReview';

/**
 * Configuration d'un rappel
 */
export interface ReminderConfig {
  /** Rappel activé */
  enabled: boolean;
  /** Heure du rappel (format HH:MM) */
  time: string;
}

/**
 * Paramètres de notifications
 */
export interface NotificationSettings {
  /** Notifications globalement activées (permission accordée) */
  enabled: boolean;
  /** Rappel matinal */
  morningReminder: ReminderConfig;
  /** Rappel du soir (si journée non enregistrée) */
  eveningReminder: ReminderConfig;
  /** Rappel de revue hebdomadaire (dimanche) */
  weeklyReviewReminder: ReminderConfig;
}

/**
 * Paramètres de notifications par défaut
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  morningReminder: {
    enabled: true,
    time: '08:00',
  },
  eveningReminder: {
    enabled: false,
    time: '20:00',
  },
  weeklyReviewReminder: {
    enabled: false,
    time: '10:00',
  },
};

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Réflexion hebdomadaire
 */
export interface WeeklyReflection {
  /** Semaine concernée (format YYYY-Www, ex: 2026-W02) */
  week: string;
  /** Texte de réflexion */
  text: string;
  /** Date d'enregistrement */
  createdAt: string;
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  /** Onboarding terminé */
  onboardingCompleted: boolean;
  /** Dernière date de revue hebdomadaire (YYYY-MM-DD) */
  lastWeeklyReviewDate: string | null;
  /** Paramètres de notifications */
  notifications: NotificationSettings;
  /** Réflexions hebdomadaires sauvegardées */
  weeklyReflections?: WeeklyReflection[];
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
    notifications: DEFAULT_NOTIFICATION_SETTINGS,
  },
};
