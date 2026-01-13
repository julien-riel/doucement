/**
 * Habitudes prioritaires à fort impact
 * Basées sur des preuves scientifiques solides
 * Source: docs/habitudes-prioritaires-doucement.docx
 */

import {
  HabitDirection,
  HabitDifficulty,
  ProgressionMode,
  ProgressionPeriod,
  TimeOfDay,
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
  | 'finance'
  | 'hygiene'
  | 'food'
  | 'social'
  | 'productivity'
  | 'gratitude'

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
  /** Mode de tracking: simple (binaire), detailed (quantitatif) ou counter */
  trackingMode?: TrackingMode
  /** Moment de la journée où l'habitude est recommandée */
  timeOfDay?: TimeOfDay
  /** Niveau de difficulté pour les nouveaux utilisateurs */
  difficulty?: HabitDifficulty
  evidenceLevel: EvidenceLevel
  benefits: string[]
  scienceHighlight: string
  /** URLs des sources scientifiques */
  sources?: string[]
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
  finance: {
    name: 'Finances',
    emoji: '💰',
    tagline: 'Construire sa sérénité',
  },
  hygiene: {
    name: 'Hygiène',
    emoji: '🦷',
    tagline: 'Les petits gestes qui comptent',
  },
  food: {
    name: 'Alimentation',
    emoji: '🍽️',
    tagline: 'Nourrir corps et esprit',
  },
  social: {
    name: 'Social',
    emoji: '👥',
    tagline: 'Cultiver ses liens',
  },
  productivity: {
    name: 'Productivité',
    emoji: '⏱️',
    tagline: 'Focus et efficacité',
  },
  gratitude: {
    name: 'Gratitude',
    emoji: '🙏',
    tagline: 'Apprécier le présent',
  },
}

/**
 * Emojis suggérés par catégorie (6-8 emojis contextuels par catégorie)
 */
export const CATEGORY_EMOJIS: Record<HabitCategory, string[]> = {
  sleep: ['🌙', '😴', '🛏️', '💤', '🌛', '⭐'],
  movement: ['🏃', '🚶', '🏋️', '🚴', '🧗', '⚽', '🏊', '🤸'],
  mindfulness: ['🧘', '🙏', '🌿', '☮️', '🕯️', '🌸'],
  screen: ['📱', '💻', '📺', '🎮', '⏰', '🚫'],
  reading: ['📚', '📖', '📕', '🔖', '📰', '✨'],
  substance: ['🚭', '☕', '🍷', '🚬', '❌', '💪'],
  finance: ['💰', '💵', '🏦', '📊', '💳', '🐷'],
  hygiene: ['🦷', '🪥', '🧼', '🚿', '✨', '💆'],
  food: ['🍽️', '🥗', '🍎', '🥤', '🍳', '🥦', '🍲'],
  social: ['👥', '👋', '💬', '❤️', '🤝', '📞'],
  productivity: ['⏱️', '🎯', '📝', '💼', '🔥', '⚡'],
  gratitude: ['🙏', '💖', '✨', '🌈', '📓', '😊'],
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
    timeOfDay: 'night',
    difficulty: 'moderate',
    evidenceLevel: 'very_high',
    benefits: ['Santé mentale', 'Cognition', 'Énergie', 'Immunité'],
    scienceHighlight: "Améliorer le sommeil réduit la dépression de 63% et l'anxiété de 51%.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/34073814/',
      'https://www.sleepfoundation.org/sleep-hygiene',
    ],
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
    timeOfDay: 'evening',
    difficulty: 'moderate',
    evidenceLevel: 'very_high',
    benefits: ['Qualité du sommeil', 'Endormissement', 'Récupération'],
    scienceHighlight:
      '8% des décès prématurés sont attribuables à de mauvaises habitudes de sommeil.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/26888442/',
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4313820/',
    ],
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
    timeOfDay: 'morning',
    difficulty: 'easy',
    evidenceLevel: 'very_high',
    benefits: ['Longévité', 'Cardiovasculaire', 'Humeur', 'Énergie'],
    scienceHighlight: 'Chaque 1000 pas supplémentaires réduisent la mortalité de 15%.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/32563261/',
      'https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/walking/art-20046261',
    ],
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
    timeOfDay: 'morning',
    difficulty: 'easy',
    evidenceLevel: 'very_high',
    benefits: ['Force', 'Métabolisme', 'Énergie'],
    scienceHighlight: "15 minutes d'exercice par jour réduisent la mortalité de 20%.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/31195227/',
      'https://www.health.harvard.edu/staying-healthy/the-importance-of-exercise-when-you-have-diabetes',
    ],
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
    timeOfDay: 'afternoon',
    difficulty: 'easy',
    evidenceLevel: 'high',
    benefits: ['Digestion', 'Glycémie', 'Énergie'],
    scienceHighlight: 'La marche améliore aussi le sommeil et réduit le besoin de médicaments.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/34598467/',
      'https://diabetesjournals.org/care/article/45/3/e28/140998/Post-Meal-Walks',
    ],
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
    timeOfDay: 'afternoon',
    difficulty: 'challenging',
    evidenceLevel: 'high',
    benefits: ['Anxiété', 'Dépression', 'Sommeil', 'Bien-être'],
    scienceHighlight: "Une semaine sans réseaux réduit l'anxiété de 16% et la dépression de 25%.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/35537640/',
      'https://www.apa.org/monitor/2023/03/social-media-teens-mental-health',
    ],
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
    timeOfDay: 'evening',
    difficulty: 'moderate',
    evidenceLevel: 'high',
    benefits: ['Sommeil', 'Relaxation', 'Qualité de vie'],
    scienceHighlight: "Réduire l'écran à <3h/semaine améliore significativement le bien-être.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/31898836/',
      'https://www.sleepfoundation.org/how-sleep-works/how-electronics-affect-sleep',
    ],
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
    timeOfDay: 'morning',
    difficulty: 'easy',
    evidenceLevel: 'high',
    benefits: ['Stress', 'Anxiété', 'Dépression', 'Régulation émotionnelle'],
    scienceHighlight: "La méditation montre des effets modérés sur l'anxiété et la dépression.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/24395196/',
      'https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know',
    ],
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
    timeOfDay: 'morning',
    difficulty: 'easy',
    evidenceLevel: 'high',
    benefits: ['Stress', 'Calme', 'Concentration'],
    scienceHighlight: 'Même de courtes séances réduisent la réactivité du cortisol.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/29167011/',
      'https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response',
    ],
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
    timeOfDay: 'afternoon',
    difficulty: 'easy',
    evidenceLevel: 'moderate',
    benefits: ['Stress', 'Cognition', 'Empathie', 'Longévité'],
    scienceHighlight: '6 minutes de lecture réduisent le stress de 68%.',
    sources: [
      'https://www.sciencedaily.com/releases/2009/03/090330125138.htm',
      'https://pubmed.ncbi.nlm.nih.gov/27471342/',
    ],
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
    timeOfDay: 'evening',
    difficulty: 'easy',
    evidenceLevel: 'moderate',
    benefits: ['Relaxation', 'Sommeil', 'Déconnexion'],
    scienceHighlight: 'Les lecteurs vivent en moyenne 2 ans de plus.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/27471342/',
      'https://www.sleepfoundation.org/sleep-hygiene/bedtime-routine-for-adults',
    ],
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
    difficulty: 'challenging',
    evidenceLevel: 'very_high',
    benefits: ['Longévité', 'Cardiovasculaire', 'Respiratoire'],
    scienceHighlight: "La réduction graduelle a de meilleurs taux de succès que l'arrêt brutal.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/17134756/',
      'https://www.cdc.gov/tobacco/quit_smoking/how_to_quit/index.htm',
    ],
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
    timeOfDay: 'evening',
    difficulty: 'challenging',
    evidenceLevel: 'very_high',
    benefits: ['Sommeil', 'Santé mentale', 'Énergie'],
    scienceHighlight: "L'OMS recommande une approche de réduction des risques.",
    sources: [
      'https://www.who.int/health-topics/alcohol',
      'https://www.niaaa.nih.gov/alcohol-health/overview-alcohol-consumption/what-standard-drink',
    ],
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
    timeOfDay: 'morning',
    difficulty: 'moderate',
    evidenceLevel: 'moderate',
    benefits: ['Sommeil', 'Anxiété', 'Hydratation'],
    scienceHighlight: 'La réduction progressive évite les symptômes de sevrage.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/15635355/',
      'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/expert-answers/caffeine/faq-20058459',
    ],
  },

  // ============================================================================
  // HYDRATATION (Nouvelles habitudes)
  // ============================================================================
  {
    id: 'hydration-water',
    category: 'hygiene',
    priority: 3,
    emoji: '💧',
    name: "Boire plus d'eau",
    description: 'Augmenter sa consommation quotidienne',
    direction: 'increase',
    unit: 'verres',
    startValue: 4,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingMode: 'counter',
    timeOfDay: 'morning',
    difficulty: 'easy',
    evidenceLevel: 'high',
    benefits: ['Énergie', 'Concentration', 'Digestion', 'Peau'],
    scienceHighlight: 'Une bonne hydratation améliore les performances cognitives de 10 à 15%.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/22855911/',
      'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256',
    ],
  },

  // ============================================================================
  // FINANCES
  // ============================================================================
  {
    id: 'finance-savings',
    category: 'finance',
    priority: 4,
    emoji: '💰',
    name: 'Économiser chaque semaine',
    description: 'Mettre de côté un montant fixe',
    direction: 'increase',
    unit: '€/semaine',
    startValue: 10,
    progression: {
      mode: 'absolute',
      value: 5,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    difficulty: 'moderate',
    evidenceLevel: 'high',
    benefits: ['Sérénité', 'Sécurité', 'Objectifs'],
    scienceHighlight: "L'épargne automatique réduit le stress financier de 40%.",
    sources: [
      'https://www.apa.org/news/press/releases/stress/2022/concerned-future-inflation',
      'https://www.consumerfinance.gov/start-small-save-up/',
    ],
  },

  // ============================================================================
  // APPRENTISSAGE
  // ============================================================================
  {
    id: 'learning-language',
    category: 'productivity',
    priority: 5,
    emoji: '🌍',
    name: 'Apprendre une langue',
    description: 'Pratiquer quotidiennement',
    direction: 'increase',
    unit: 'minutes',
    startValue: 5,
    progression: {
      mode: 'absolute',
      value: 2,
      period: 'weekly',
    },
    timeOfDay: 'morning',
    difficulty: 'challenging',
    evidenceLevel: 'moderate',
    benefits: ['Cognition', 'Mémoire', 'Créativité'],
    scienceHighlight: "L'apprentissage d'une langue retarde le déclin cognitif de 4-5 ans.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/24222337/',
      'https://www.sciencedaily.com/releases/2014/06/140602094658.htm',
    ],
  },

  // ============================================================================
  // HYGIÈNE
  // ============================================================================
  {
    id: 'hygiene-floss',
    category: 'hygiene',
    priority: 4,
    emoji: '🦷',
    name: 'Passer le fil dentaire',
    description: 'Nettoyer entre les dents',
    direction: 'increase',
    unit: 'fois/semaine',
    startValue: 2,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    trackingMode: 'simple',
    timeOfDay: 'evening',
    difficulty: 'easy',
    evidenceLevel: 'very_high',
    benefits: ['Santé bucco-dentaire', 'Cœur', 'Prévention'],
    scienceHighlight: 'Le fil dentaire réduit les maladies cardiovasculaires de 20%.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/28759371/',
      'https://www.ada.org/resources/research/science-and-research-institute/oral-health-topics/floss',
    ],
  },

  // ============================================================================
  // ALIMENTATION
  // ============================================================================
  {
    id: 'food-restaurant',
    category: 'food',
    priority: 4,
    emoji: '🍽️',
    name: 'Moins de restaurants',
    description: 'Réduire les repas au restaurant',
    direction: 'decrease',
    unit: 'repas/semaine',
    startValue: 4,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    trackingMode: 'counter',
    difficulty: 'moderate',
    evidenceLevel: 'moderate',
    benefits: ['Économies', 'Nutrition', 'Contrôle'],
    scienceHighlight: 'Cuisiner à la maison réduit le risque de maladies chroniques de 28%.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/28284514/',
      'https://www.health.harvard.edu/staying-healthy/the-benefits-of-cooking-at-home',
    ],
  },
  {
    id: 'food-mealprep',
    category: 'food',
    priority: 4,
    emoji: '👨‍🍳',
    name: 'Préparer ses repas',
    description: "Cuisiner à l'avance pour la semaine",
    direction: 'increase',
    unit: 'repas/semaine',
    startValue: 2,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingFrequency: 'weekly',
    trackingMode: 'counter',
    timeOfDay: 'afternoon',
    difficulty: 'moderate',
    evidenceLevel: 'moderate',
    benefits: ['Nutrition', 'Temps', 'Économies'],
    scienceHighlight: 'Le meal prep améliore la qualité nutritionnelle de 50%.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/28284514/',
      'https://www.eatright.org/food/planning/meals-and-snacks/meal-prep-tips-for-beginners',
    ],
  },

  // ============================================================================
  // SOCIAL
  // ============================================================================
  {
    id: 'social-quality-time',
    category: 'social',
    priority: 3,
    emoji: '👥',
    name: 'Temps de qualité',
    description: 'Moments dédiés avec ses proches',
    direction: 'increase',
    unit: 'minutes',
    startValue: 15,
    progression: {
      mode: 'absolute',
      value: 5,
      period: 'weekly',
    },
    timeOfDay: 'evening',
    difficulty: 'easy',
    evidenceLevel: 'very_high',
    benefits: ['Bonheur', 'Santé mentale', 'Longévité'],
    scienceHighlight: "Les relations sociales augmentent l'espérance de vie de 50%.",
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/20668659/',
      'https://www.health.harvard.edu/healthbeat/strengthen-relationships-for-longer-healthier-life',
    ],
  },

  // ============================================================================
  // PRODUCTIVITÉ
  // ============================================================================
  {
    id: 'productivity-deep-work',
    category: 'productivity',
    priority: 4,
    emoji: '🎯',
    name: 'Travail profond',
    description: 'Blocs de concentration sans interruption',
    direction: 'increase',
    unit: 'minutes',
    startValue: 25,
    progression: {
      mode: 'absolute',
      value: 5,
      period: 'weekly',
    },
    timeOfDay: 'morning',
    difficulty: 'challenging',
    evidenceLevel: 'high',
    benefits: ['Productivité', 'Qualité', 'Satisfaction'],
    scienceHighlight: '90 minutes de travail profond équivalent à 4h de travail fragmenté.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/27897124/',
      'https://hbr.org/2018/03/to-make-better-choices-figure-out-what-youre-willing-to-give-up',
    ],
  },

  // ============================================================================
  // GRATITUDE
  // ============================================================================
  {
    id: 'gratitude-journal',
    category: 'gratitude',
    priority: 3,
    emoji: '🙏',
    name: 'Journal de gratitude',
    description: 'Noter 3 choses positives',
    direction: 'increase',
    unit: 'entrées',
    startValue: 1,
    progression: {
      mode: 'absolute',
      value: 1,
      period: 'weekly',
    },
    trackingMode: 'simple',
    timeOfDay: 'evening',
    difficulty: 'easy',
    evidenceLevel: 'high',
    benefits: ['Bonheur', 'Sommeil', 'Optimisme'],
    scienceHighlight: 'La gratitude améliore le bien-être de 25% en 10 semaines.',
    sources: [
      'https://pubmed.ncbi.nlm.nih.gov/16045394/',
      'https://greatergood.berkeley.edu/article/item/tips_for_keeping_a_gratitude_journal',
    ],
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
