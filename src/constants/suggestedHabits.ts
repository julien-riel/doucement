/**
 * Habitudes prioritaires à fort impact
 * Basées sur des preuves scientifiques solides
 * Source: docs/habitudes-prioritaires-doucement.docx
 */

import {
  HabitDirection,
  ProgressionMode,
  ProgressionPeriod,
  TrackingFrequency,
  TrackingMode,
} from '../types'

/**
 * Niveau de preuve scientifique
 */
export type EvidenceLevel = 'very_high' | 'high' | 'moderate'

/**
 * Catégorie d'habitude
 */
export type HabitCategory =
  | 'sleep'
  | 'movement'
  | 'mindfulness'
  | 'screen'
  | 'reading'
  | 'substance'

/**
 * Structure d'une habitude suggérée
 */
export interface SuggestedHabit {
  id: string
  category: HabitCategory
  priority: number
  emoji: string
  name: string
  description: string
  direction: HabitDirection
  unit: string
  startValue: number
  progression: {
    mode: ProgressionMode
    value: number
    period: ProgressionPeriod
  } | null
  /** Fréquence de suivi: daily (défaut) ou weekly */
  trackingFrequency?: TrackingFrequency
  /** Mode de tracking: simple (binaire) ou detailed (quantitatif) */
  trackingMode?: TrackingMode
  evidenceLevel: EvidenceLevel
  benefits: string[]
  scienceHighlight: string
}

/**
 * Métadonnées des catégories d'habitudes
 */
export const HABIT_CATEGORIES: Record<
  HabitCategory,
  {
    name: string
    emoji: string
    tagline: string
  }
> = {
  sleep: {
    name: 'Sommeil',
    emoji: '😴',
    tagline: 'Le multiplicateur universel',
  },
  movement: {
    name: 'Mouvement',
    emoji: '🏃',
    tagline: 'Chaque pas compte',
  },
  mindfulness: {
    name: 'Méditation',
    emoji: '🧘',
    tagline: 'Le régulateur de stress',
  },
  screen: {
    name: 'Écrans',
    emoji: '📱',
    tagline: "Le libérateur d'attention",
  },
  reading: {
    name: 'Lecture',
    emoji: '📚',
    tagline: "L'antidote au stress",
  },
  substance: {
    name: 'Substances',
    emoji: '🚭',
    tagline: 'La progression inversée',
  },
}

/**
 * Labels pour les niveaux de preuve
 */
export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  very_high: 'Très élevé',
  high: 'Élevé',
  moderate: 'Modéré',
}

/**
 * Liste des habitudes suggérées, ordonnées par priorité
 */
export const SUGGESTED_HABITS: SuggestedHabit[] = [
  // ============================================================================
  // SOMMEIL (Priorité 1)
  // ============================================================================
  {
    id: 'sleep-regular-bedtime',
    category: 'sleep',
    priority: 1,
    emoji: '🌙',
    name: 'Se coucher à heure fixe',
    description: 'Aller au lit à la même heure chaque soir',
    direction: 'increase',
    unit: 'soirs/semaine',
    startValue: 3,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    evidenceLevel: 'very_high',
    benefits: ['Santé mentale', 'Cognition', 'Énergie', 'Immunité'],
    scienceHighlight: "Améliorer le sommeil réduit la dépression de 63% et l'anxiété de 51%.",
  },
  {
    id: 'sleep-screen-before-bed',
    category: 'sleep',
    priority: 1,
    emoji: '📵',
    name: 'Réduire les écrans avant le coucher',
    description: 'Temps sans écran avant de dormir',
    direction: 'increase',
    unit: 'minutes',
    startValue: 15,
    progression: {
      mode: 'absolute',
      value: 5,
      period: 'weekly',
    },
    evidenceLevel: 'very_high',
    benefits: ['Qualité du sommeil', 'Endormissement', 'Récupération'],
    scienceHighlight:
      '8% des décès prématurés sont attribuables à de mauvaises habitudes de sommeil.',
  },

  // ============================================================================
  // MOUVEMENT (Priorité 2)
  // ============================================================================
  {
    id: 'movement-daily-walk',
    category: 'movement',
    priority: 2,
    emoji: '🚶',
    name: 'Marche quotidienne',
    description: 'Nombre de pas par jour',
    direction: 'increase',
    unit: 'pas',
    startValue: 2000,
    progression: {
      mode: 'absolute',
      value: 500,
      period: 'weekly',
    },
    evidenceLevel: 'very_high',
    benefits: ['Longévité', 'Cardiovasculaire', 'Humeur', 'Énergie'],
    scienceHighlight: 'Chaque 1000 pas supplémentaires réduisent la mortalité de 15%.',
  },
  {
    id: 'movement-pushups',
    category: 'movement',
    priority: 2,
    emoji: '💪',
    name: 'Pompes ou squats',
    description: 'Exercices de renforcement simple',
    direction: 'increase',
    unit: 'répétitions',
    startValue: 5,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    evidenceLevel: 'very_high',
    benefits: ['Force', 'Métabolisme', 'Énergie'],
    scienceHighlight: "15 minutes d'exercice par jour réduisent la mortalité de 20%.",
  },
  {
    id: 'movement-walk-after-meal',
    category: 'movement',
    priority: 2,
    emoji: '🍽️',
    name: 'Marche après les repas',
    description: 'Courte marche digestive',
    direction: 'increase',
    unit: 'minutes',
    startValue: 5,
    progression: {
      mode: 'absolute',
      value: 2,
      period: 'weekly',
    },
    trackingMode: 'simple',
    evidenceLevel: 'high',
    benefits: ['Digestion', 'Glycémie', 'Énergie'],
    scienceHighlight: 'La marche améliore aussi le sommeil et réduit le besoin de médicaments.',
  },

  // ============================================================================
  // RÉDUCTION ÉCRANS (Priorité 3)
  // ============================================================================
  {
    id: 'screen-social-media',
    category: 'screen',
    priority: 3,
    emoji: '📱',
    name: 'Réduire les réseaux sociaux',
    description: 'Temps quotidien sur les réseaux',
    direction: 'decrease',
    unit: 'minutes',
    startValue: 60,
    progression: {
      mode: 'absolute',
      value: 10,
      period: 'weekly',
    },
    evidenceLevel: 'high',
    benefits: ['Anxiété', 'Dépression', 'Sommeil', 'Bien-être'],
    scienceHighlight: "Une semaine sans réseaux réduit l'anxiété de 16% et la dépression de 25%.",
  },
  {
    id: 'screen-before-sleep',
    category: 'screen',
    priority: 3,
    emoji: '🌅',
    name: "Pas d'écran 1h avant le coucher",
    description: 'Temps sans écran le soir',
    direction: 'increase',
    unit: 'minutes',
    startValue: 15,
    progression: {
      mode: 'absolute',
      value: 10,
      period: 'weekly',
    },
    evidenceLevel: 'high',
    benefits: ['Sommeil', 'Relaxation', 'Qualité de vie'],
    scienceHighlight: "Réduire l'écran à <3h/semaine améliore significativement le bien-être.",
  },

  // ============================================================================
  // MÉDITATION (Priorité 4)
  // ============================================================================
  {
    id: 'mindfulness-meditation',
    category: 'mindfulness',
    priority: 4,
    emoji: '🧘',
    name: 'Méditation guidée',
    description: 'Quelques minutes de pleine conscience',
    direction: 'increase',
    unit: 'minutes',
    startValue: 2,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    evidenceLevel: 'high',
    benefits: ['Stress', 'Anxiété', 'Dépression', 'Régulation émotionnelle'],
    scienceHighlight: "La méditation montre des effets modérés sur l'anxiété et la dépression.",
  },
  {
    id: 'mindfulness-breathing',
    category: 'mindfulness',
    priority: 4,
    emoji: '🌬️',
    name: 'Exercices de respiration',
    description: 'Respirations profondes par jour',
    direction: 'increase',
    unit: 'respirations',
    startValue: 3,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    evidenceLevel: 'high',
    benefits: ['Stress', 'Calme', 'Concentration'],
    scienceHighlight: 'Même de courtes séances réduisent la réactivité du cortisol.',
  },

  // ============================================================================
  // LECTURE (Priorité 5)
  // ============================================================================
  {
    id: 'reading-daily',
    category: 'reading',
    priority: 5,
    emoji: '📖',
    name: 'Lecture quotidienne',
    description: 'Pages lues chaque jour',
    direction: 'increase',
    unit: 'pages',
    startValue: 5,
    progression: {
      mode: 'absolute',
      value: 2,
      period: 'weekly',
    },
    evidenceLevel: 'moderate',
    benefits: ['Stress', 'Cognition', 'Empathie', 'Longévité'],
    scienceHighlight: '6 minutes de lecture réduisent le stress de 68%.',
  },
  {
    id: 'reading-before-bed',
    category: 'reading',
    priority: 5,
    emoji: '📚',
    name: 'Lecture avant le coucher',
    description: 'Lire au lieu des écrans le soir',
    direction: 'increase',
    unit: 'minutes',
    startValue: 10,
    progression: {
      mode: 'absolute',
      value: 5,
      period: 'weekly',
    },
    trackingMode: 'simple',
    evidenceLevel: 'moderate',
    benefits: ['Relaxation', 'Sommeil', 'Déconnexion'],
    scienceHighlight: 'Les lecteurs vivent en moyenne 2 ans de plus.',
  },

  // ============================================================================
  // SUBSTANCES (Suggérées uniquement si pertinent)
  // ============================================================================
  {
    id: 'substance-cigarettes',
    category: 'substance',
    priority: 6,
    emoji: '🚭',
    name: 'Réduire les cigarettes',
    description: 'Réduction progressive du tabac',
    direction: 'decrease',
    unit: 'cigarettes',
    startValue: 10,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    evidenceLevel: 'very_high',
    benefits: ['Longévité', 'Cardiovasculaire', 'Respiratoire'],
    scienceHighlight: "La réduction graduelle a de meilleurs taux de succès que l'arrêt brutal.",
  },
  {
    id: 'substance-alcohol',
    category: 'substance',
    priority: 6,
    emoji: '🍷',
    name: "Réduire l'alcool",
    description: 'Réduction progressive de la consommation',
    direction: 'decrease',
    unit: 'verres/semaine',
    startValue: 7,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    evidenceLevel: 'very_high',
    benefits: ['Sommeil', 'Santé mentale', 'Énergie'],
    scienceHighlight: "L'OMS recommande une approche de réduction des risques.",
  },
  {
    id: 'substance-caffeine',
    category: 'substance',
    priority: 6,
    emoji: '☕',
    name: 'Réduire la caféine',
    description: 'Moins de cafés par jour',
    direction: 'decrease',
    unit: 'cafés',
    startValue: 4,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    evidenceLevel: 'moderate',
    benefits: ['Sommeil', 'Anxiété', 'Hydratation'],
    scienceHighlight: 'La réduction progressive évite les symptômes de sevrage.',
  },
]

/**
 * Récupère les habitudes par priorité (1-5, sans substances par défaut)
 */
export function getTopPriorityHabits(includeSubstances = false): SuggestedHabit[] {
  return SUGGESTED_HABITS.filter((h) => includeSubstances || h.category !== 'substance').sort(
    (a, b) => a.priority - b.priority
  )
}

/**
 * Récupère les habitudes d'une catégorie
 */
export function getHabitsByCategory(category: HabitCategory): SuggestedHabit[] {
  return SUGGESTED_HABITS.filter((h) => h.category === category)
}

/**
 * Récupère une habitude par son ID
 */
export function getSuggestedHabitById(id: string): SuggestedHabit | undefined {
  return SUGGESTED_HABITS.find((h) => h.id === id)
}
