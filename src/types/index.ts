/**
 * Doucement - Types TypeScript
 * Définition des structures de données pour le stockage local
 */

import { MilestonesState } from './statistics'

// Re-export habit form types for convenience
export * from './habitForm'

// ============================================================================
// TIME OF DAY & DIFFICULTY TYPES
// ============================================================================

/**
 * Moment de la journée pour une habitude
 * Permet le regroupement et le tri logique sur la page Aujourd'hui
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Niveau de difficulté d'une habitude suggérée
 * Affiché comme badge sur les cartes d'habitudes
 */
export type HabitDifficulty = 'easy' | 'moderate' | 'challenging'

/**
 * Opération cumulative (historique des saisies)
 * Permet de tracer chaque saisie cumulative avec possibilité d'annuler
 */
export interface CumulativeOperation {
  /** Identifiant unique de l'opération */
  id: string
  /** Valeur de la saisie (positive ou négative) */
  value: number
  /** Horodatage de l'opération (ISO 8601) */
  timestamp: string
}

// ============================================================================
// SCHEMA VERSION
// ============================================================================

/**
 * Version du schéma de données
 * Incrémentée à chaque modification de structure pour permettre les migrations
 * v10: Ajout de timeOfDay et cumulativeOperations sur Habit
 * v11: Ajout des widgets temporels (stopwatch, timer, slider) et champs sliderConfig, notifyOnTarget
 */
export const CURRENT_SCHEMA_VERSION = 11

// ============================================================================
// HABIT TYPES
// ============================================================================

/**
 * Direction de progression d'une habitude
 */
export type HabitDirection = 'increase' | 'decrease' | 'maintain'

/**
 * Mode de progression (absolu ou pourcentage)
 */
export type ProgressionMode = 'absolute' | 'percentage'

/**
 * Période de référence pour la progression
 */
export type ProgressionPeriod = 'daily' | 'weekly'

/**
 * Configuration de la progression d'une habitude
 */
export interface ProgressionConfig {
  /** Mode de progression */
  mode: ProgressionMode
  /** Valeur de progression (+/- unités ou %) */
  value: number
  /** Période de référence */
  period: ProgressionPeriod
}

/**
 * Mode de tracking d'une habitude
 * - simple: binaire (fait / pas fait) - recommandé pour débuter
 * - detailed: quantitatif avec valeur précise
 * - counter: compteur avec boutons +1/-1 et historique des opérations
 * - stopwatch: chronomètre pour mesurer une durée
 * - timer: minuterie (compte à rebours) avec dépassement
 * - slider: slider visuel avec emoji dynamique
 */
export type TrackingMode = 'simple' | 'detailed' | 'counter' | 'stopwatch' | 'timer' | 'slider'

/**
 * Fréquence de suivi d'une habitude
 * - daily: suivi quotidien classique (dose par jour)
 * - weekly: suivi hebdomadaire (X fois par semaine)
 */
export type TrackingFrequency = 'daily' | 'weekly'

/**
 * Mode de saisie des valeurs
 * - replace: chaque saisie remplace la précédente (défaut)
 * - cumulative: les saisies s'additionnent dans la journée
 */
export type EntryMode = 'replace' | 'cumulative'

/**
 * Type d'opération sur un compteur
 */
export type CounterOperationType = 'add' | 'subtract'

/**
 * Opération sur un compteur (historique des modifications)
 * Permet de tracer chaque +1/-1 avec possibilité d'annuler
 */
export interface CounterOperation {
  /** Identifiant unique de l'opération */
  id: string
  /** Type d'opération */
  type: CounterOperationType
  /** Valeur absolue de la modification (toujours positive) */
  value: number
  /** Horodatage de l'opération (ISO 8601) */
  timestamp: string
  /** Note optionnelle */
  note?: string
}

/**
 * Mode d'agrégation pour les habitudes hebdomadaires
 * - count-days: Compte le nombre de jours où l'objectif est atteint
 * - sum-units: Additionne les unités sur toute la semaine
 */
export type WeeklyAggregation = 'count-days' | 'sum-units'

/**
 * Préférence de thème
 * - light: thème clair
 * - dark: thème sombre
 * - system: suit les préférences du système
 */
export type ThemePreference = 'light' | 'dark' | 'system'

/**
 * Implementation Intention (si-alors)
 * Basé sur la recherche de Gollwitzer (1999)
 * "Après [DÉCLENCHEUR], je ferai [HABITUDE] à [LIEU]"
 */
export interface ImplementationIntention {
  /** Déclencheur de l'habitude (ex: "Après mon café du matin") */
  trigger?: string
  /** Lieu où l'habitude sera effectuée (ex: "Dans le salon") */
  location?: string
  /** Heure prévue (format HH:MM, optionnel) */
  time?: string
}

/**
 * Pause planifiée pour une habitude
 * Permet de mettre en pause sans impact sur les stats
 */
export interface PlannedPause {
  /** Date de début de la pause (YYYY-MM-DD) */
  startDate: string
  /** Date de fin de la pause (YYYY-MM-DD) */
  endDate: string
  /** Raison optionnelle */
  reason?: string
}

/**
 * Enregistrement d'une recalibration (Phase 10)
 * Stocke l'historique des recalibrations pour analyse future
 */
export interface RecalibrationRecord {
  /** Date de la recalibration (YYYY-MM-DD) */
  date: string
  /** Ancienne valeur de départ avant recalibration */
  previousStartValue: number
  /** Nouvelle valeur de départ après recalibration */
  newStartValue: number
  /** Ancienne date de début de progression */
  previousStartDate: string
  /** Niveau de recalibration choisi (0.5, 0.75 ou 1) */
  level: number
}

// ============================================================================
// SLIDER CONFIGURATION TYPES
// ============================================================================

/**
 * Plage de valeurs associée à un emoji pour le slider
 * Permet de définir quel emoji afficher selon la valeur sélectionnée
 */
export interface EmojiRange {
  /** Valeur minimale de la plage (inclusive) */
  from: number
  /** Valeur maximale de la plage (inclusive) */
  to: number
  /** Emoji à afficher pour cette plage */
  emoji: string
}

/**
 * Configuration du slider avec mapping emoji
 * Utilisé quand trackingMode='slider'
 */
export interface SliderConfig {
  /** Valeur minimale (défaut: 0) */
  min: number
  /** Valeur maximale (défaut: 10) */
  max: number
  /** Pas d'incrémentation (défaut: 1) */
  step: number
  /** Mapping emoji par plage de valeurs (optionnel) */
  emojiRanges?: EmojiRange[]
}

// ============================================================================
// TIMER STATE TYPES
// ============================================================================

/**
 * État persisté d'un chronomètre en cours
 * Permet de reprendre un chrono après fermeture de l'app
 * Stocké dans localStorage sous la clé 'doucement_timer_states'
 */
export interface TimerState {
  /** ID de l'habitude associée */
  habitId: string
  /** Date concernée (YYYY-MM-DD) */
  date: string
  /** Timestamp de démarrage (ISO 8601) */
  startedAt: string
  /** Temps accumulé avant pause (en secondes) */
  accumulatedSeconds: number
  /** Chrono en cours ou en pause */
  isRunning: boolean
}

/**
 * Habitude de l'utilisateur
 */
export interface Habit {
  /** Identifiant unique */
  id: string
  /** Nom de l'habitude */
  name: string
  /** Emoji représentant l'habitude */
  emoji: string
  /** Description optionnelle */
  description?: string
  /** Direction de progression */
  direction: HabitDirection
  /** Valeur de départ */
  startValue: number
  /** Unité de mesure (répétitions, minutes, etc.) */
  unit: string
  /** Configuration de progression (null si maintain) */
  progression: ProgressionConfig | null
  /** Valeur cible finale (optionnelle) */
  targetValue?: number
  /** Date de création (YYYY-MM-DD) */
  createdAt: string
  /** Date d'archivage (YYYY-MM-DD), null si active */
  archivedAt: string | null
  /** Mode de tracking: simple (binaire) ou detailed (quantitatif) */
  trackingMode?: TrackingMode
  /** Fréquence de suivi: daily (quotidien) ou weekly (hebdomadaire) */
  trackingFrequency?: TrackingFrequency
  /** Mode d'agrégation hebdomadaire (uniquement si trackingFrequency='weekly') */
  weeklyAggregation?: WeeklyAggregation
  /** Mode de saisie: replace (défaut) ou cumulative (les valeurs s'additionnent) */
  entryMode?: EntryMode
  /** Implementation Intention - plan si-alors (Phase 6) */
  implementationIntention?: ImplementationIntention
  /** ID de l'habitude d'ancrage pour Habit Stacking (Phase 6) */
  anchorHabitId?: string
  /** Pause planifiée active (Phase 6) */
  plannedPause?: PlannedPause | null
  /** Déclaration d'identité (Phase 9) - "Je deviens quelqu'un qui..." */
  identityStatement?: string
  /** Historique des recalibrations (Phase 10) */
  recalibrationHistory?: RecalibrationRecord[]
  /** Moment de la journée pour cette habitude */
  timeOfDay?: TimeOfDay
  /** Historique des saisies cumulatives pour cette habitude */
  cumulativeOperations?: CumulativeOperation[]
  /** Configuration du slider (si trackingMode='slider') */
  sliderConfig?: SliderConfig
  /** Activer la notification quand la cible est atteinte (chrono/minuterie) */
  notifyOnTarget?: boolean
}

// ============================================================================
// DAILY ENTRY TYPES
// ============================================================================

/**
 * Statut de complétion d'une entrée
 */
export type CompletionStatus = 'pending' | 'partial' | 'completed' | 'exceeded'

/**
 * Entrée quotidienne pour une habitude
 */
export interface DailyEntry {
  /** Identifiant unique */
  id: string
  /** Référence à l'habitude */
  habitId: string
  /** Date de l'entrée (YYYY-MM-DD) */
  date: string
  /** Dose cible calculée pour ce jour */
  targetDose: number
  /** Valeur réellement accomplie */
  actualValue: number
  /** Note optionnelle */
  note?: string
  /** Horodatage de création */
  createdAt: string
  /** Horodatage de dernière modification */
  updatedAt: string
  /** Historique des opérations pour les habitudes counter (optionnel) */
  operations?: CounterOperation[]
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Type de rappel de notification
 */
export type ReminderType = 'morning' | 'evening' | 'weeklyReview'

/**
 * Configuration d'un rappel
 */
export interface ReminderConfig {
  /** Rappel activé */
  enabled: boolean
  /** Heure du rappel (format HH:MM) */
  time: string
}

/**
 * Paramètres de notifications
 */
export interface NotificationSettings {
  /** Notifications globalement activées (permission accordée) */
  enabled: boolean
  /** Rappel matinal */
  morningReminder: ReminderConfig
  /** Rappel du soir (si journée non enregistrée) */
  eveningReminder: ReminderConfig
  /** Rappel de revue hebdomadaire (dimanche) */
  weeklyReviewReminder: ReminderConfig
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
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

/**
 * Réflexion hebdomadaire
 */
export interface WeeklyReflection {
  /** Semaine concernée (format YYYY-Www, ex: 2026-W02) */
  week: string
  /** Texte de réflexion */
  text: string
  /** Date d'enregistrement */
  createdAt: string
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  /** Onboarding terminé */
  onboardingCompleted: boolean
  /** Dernière date de revue hebdomadaire (YYYY-MM-DD) */
  lastWeeklyReviewDate: string | null
  /** Paramètres de notifications */
  notifications: NotificationSettings
  /** Réflexions hebdomadaires sauvegardées */
  weeklyReflections?: WeeklyReflection[]
  /** Mode debug activé */
  debugMode?: boolean
  /** Date simulée pour le mode debug (YYYY-MM-DD) */
  simulatedDate?: string | null
  /** Préférence de thème (clair, sombre, système) */
  theme?: ThemePreference
  /** État des jalons célébrés */
  milestones?: MilestonesState
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
  schemaVersion: number
  /** Liste des habitudes */
  habits: Habit[]
  /** Entrées quotidiennes */
  entries: DailyEntry[]
  /** Préférences utilisateur */
  preferences: UserPreferences
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Données pour créer une nouvelle habitude
 */
export type CreateHabitInput = Omit<Habit, 'id' | 'createdAt' | 'archivedAt'>

/**
 * Données pour mettre à jour une habitude
 */
export type UpdateHabitInput = Partial<Omit<Habit, 'id' | 'createdAt'>>

/**
 * Données pour créer une nouvelle entrée
 */
export type CreateEntryInput = Omit<DailyEntry, 'id' | 'createdAt' | 'updatedAt'>

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
    theme: 'system',
  },
}
