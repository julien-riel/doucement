/**
 * Doucement - Types pour les statistiques
 * Structures de données pour la visualisation de progression,
 * les projections et les célébrations de jalons
 */

// ============================================================================
// PERIOD TYPES
// ============================================================================

/**
 * Période d'affichage des statistiques
 */
export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * Point de données pour un graphique
 */
export interface DataPoint {
  /** Date au format YYYY-MM-DD */
  date: string
  /** Valeur réalisée */
  value: number
  /** Dose cible ce jour-là */
  target: number
  /** Pourcentage de réalisation (0-100+) */
  percentage: number
}

/**
 * Données pour un graphique de progression
 */
export interface ChartData {
  /** ID de l'habitude */
  habitId: string
  /** Nom de l'habitude */
  habitName: string
  /** Emoji de l'habitude */
  habitEmoji: string
  /** Unité de mesure */
  unit: string
  /** Points de données */
  dataPoints: DataPoint[]
  /** Valeur cible finale (targetValue de l'habitude) */
  finalTarget?: number
}

// ============================================================================
// PROJECTION TYPES
// ============================================================================

/**
 * Données de projection future
 */
export interface ProjectionData {
  /** ID de l'habitude */
  habitId: string
  /** Valeur actuelle (dernière entrée) */
  currentValue: number
  /** Valeur cible finale */
  targetValue: number
  /** Pourcentage d'avancement vers la cible (0-100) */
  progressPercentage: number
  /** Taux de progression actuel par semaine */
  currentWeeklyRate: number
  /** Date estimée d'atteinte de la cible (YYYY-MM-DD) */
  estimatedCompletionDate: string | null
  /** Nombre de jours restants estimé */
  daysRemaining: number | null
  /** Projection dans 30 jours */
  projectionIn30Days: number
  /** Projection dans 90 jours */
  projectionIn90Days: number
}

// ============================================================================
// HABIT STATS TYPES
// ============================================================================

/**
 * Statistiques agrégées pour une habitude
 */
export interface HabitStats {
  /** ID de l'habitude */
  habitId: string
  /** Nombre total d'entrées */
  totalEntries: number
  /** Moyenne des pourcentages de réalisation */
  averageCompletion: number
  /** Meilleur jour (% le plus haut) */
  bestDay: { date: string; percentage: number } | null
  /** Série actuelle de jours consécutifs >= 70% */
  currentStreak: number
  /** Meilleure série historique */
  bestStreak: number
  /** Tendance sur les 7 derniers jours (-1 à 1) */
  weeklyTrend: number
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

/**
 * Niveau de jalon (pourcentage vers la cible finale)
 */
export type MilestoneLevel = 25 | 50 | 75 | 100

/**
 * Jalon de progression
 */
export interface Milestone {
  /** ID de l'habitude */
  habitId: string
  /** Niveau du jalon (25, 50, 75, ou 100%) */
  level: MilestoneLevel
  /** Date d'atteinte (YYYY-MM-DD) */
  reachedAt: string
  /** Déjà célébré ? */
  celebrated: boolean
}

/**
 * État des jalons pour toutes les habitudes
 * Stocké dans UserPreferences
 */
export interface MilestonesState {
  /** Liste des jalons atteints */
  milestones: Milestone[]
}

// ============================================================================
// HEATMAP TYPES
// ============================================================================

/**
 * Données pour une cellule du calendrier heatmap
 */
export interface HeatmapCell {
  /** Date au format YYYY-MM-DD */
  date: string
  /** Pourcentage de réalisation (0-100+) */
  percentage: number
  /** Valeur réalisée */
  value: number
  /** Dose cible */
  target: number
}

/**
 * Niveaux d'intensité pour le heatmap
 * Basé sur le pourcentage de réalisation
 */
export type HeatmapIntensity = 'none' | 'low' | 'medium' | 'high' | 'complete' | 'exceeded'

/**
 * Mapping des couleurs pour le heatmap
 * Conformes au design system (pas de rouge)
 */
export const HEATMAP_COLORS: Record<HeatmapIntensity, string> = {
  none: '#F5F5F5', // Pas de données / 0%
  low: '#FEECD0', // 1-25%
  medium: '#FDD9A0', // 26-50%
  high: '#F8B84E', // 51-75%
  complete: '#22C55E', // 76-100%
  exceeded: '#16A34A', // > 100%
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

/**
 * Série de données pour le graphique de comparaison
 */
export interface ComparisonSeries {
  /** ID de l'habitude */
  habitId: string
  /** Nom de l'habitude */
  habitName: string
  /** Emoji de l'habitude */
  habitEmoji: string
  /** Couleur de la série */
  color: string
  /** Points de données (normalisés ou bruts) */
  dataPoints: DataPoint[]
}

/**
 * Données pour le graphique de comparaison
 */
export interface ComparisonData {
  /** Liste des séries à comparer */
  series: ComparisonSeries[]
  /** Données normalisées en pourcentage de la cible */
  normalized: boolean
}

// ============================================================================
// STAT CARD TYPES
// ============================================================================

/**
 * Direction de tendance
 */
export type TrendDirection = 'up' | 'down' | 'stable'

/**
 * Props pour une carte de statistique
 */
export interface StatCardData {
  /** Label de la métrique */
  label: string
  /** Valeur principale */
  value: string | number
  /** Unité optionnelle */
  unit?: string
  /** Direction de tendance */
  trend?: TrendDirection
  /** Valeur de tendance (ex: "+5%") */
  trendValue?: string
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Détermine l'intensité du heatmap basée sur le pourcentage
 */
export function getHeatmapIntensity(percentage: number): HeatmapIntensity {
  if (percentage === 0) return 'none'
  if (percentage <= 25) return 'low'
  if (percentage <= 50) return 'medium'
  if (percentage <= 75) return 'high'
  if (percentage <= 100) return 'complete'
  return 'exceeded'
}

/**
 * Retourne la couleur du heatmap pour un pourcentage donné
 */
export function getHeatmapColor(percentage: number): string {
  const intensity = getHeatmapIntensity(percentage)
  return HEATMAP_COLORS[intensity]
}
