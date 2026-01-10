/**
 * Banque de messages de l'application Doucement
 * Source: docs/comm/banque-messages.md
 *
 * Tous les textes suivent le ton bienveillant et non moralisateur de l'application.
 * Vocabulaire interdit: échec, raté, manqué, retard, insuffisant, streak cassé
 */

// ============================================================================
// MESSAGES DE CHECK-IN QUOTIDIEN
// ============================================================================

/**
 * Messages affichés après complétion à 100%
 */
export const CHECKIN_COMPLETED = [
  'Nickel. À demain.',
  'C\'est fait. Beau travail.',
  'Dose du jour : accomplie.',
  'Parfait. Un jour de plus sur la bonne voie.',
  '✓ Enregistré. Tu avances.',
] as const

/**
 * Messages affichés après complétion partielle (50-99%)
 */
export const CHECKIN_PARTIAL = [
  'Chaque effort compte. C\'est noté.',
  'Tu as avancé aujourd\'hui. C\'est l\'essentiel.',
  'Pas 100%, mais tu n\'as pas abandonné.',
  'L\'important, c\'est d\'avoir fait quelque chose.',
  'Bien joué. Demain est un autre jour.',
] as const

/**
 * Messages affichés après avoir dépassé l'objectif (>100%)
 */
export const CHECKIN_EXCEEDED = [
  'Au-delà de la dose. Impressionnant, mais pas obligatoire.',
  'Tu en as fait plus. L\'élan est là.',
  'Extra ! Mais souviens-toi : la régularité bat l\'intensité.',
] as const

/**
 * Messages affichés pour une journée sans activité
 */
export const CHECKIN_NO_ACTIVITY = [
  'Pas d\'entrée aujourd\'hui. Ce n\'est pas grave.',
  'Une pause, c\'est aussi avancer parfois.',
  'Demain est une nouvelle occasion.',
] as const

// ============================================================================
// MESSAGES DE REVUE HEBDOMADAIRE
// ============================================================================

/**
 * Messages pour une semaine positive (majorité des jours avec activité)
 */
export const WEEKLY_POSITIVE = [
  'Belle semaine. Tu construis quelque chose.',
  '7 jours de plus sur ta trajectoire.',
  'La constance paie. Continue comme ça.',
  'Semaine solide. L\'effet composé fait son travail.',
] as const

/**
 * Messages pour une semaine moyenne (environ 50% des jours)
 */
export const WEEKLY_AVERAGE = [
  'Une semaine en demi-teinte, mais tu es toujours là.',
  'Quelques jours actifs. C\'est mieux que zéro.',
  'La semaine n\'a pas été parfaite. Et alors ? On continue.',
] as const

/**
 * Messages pour une semaine difficile (peu ou pas d'activité)
 */
export const WEEKLY_DIFFICULT = [
  'Semaine compliquée ? Ça arrive.',
  'Pas la meilleure semaine, mais ce n\'est qu\'une semaine.',
  'L\'important n\'est pas de tomber, c\'est de se relever.',
  'Nouveau départ dans 3... 2... 1...',
] as const

/**
 * Messages de milestone (4 semaines, 3 mois, etc.)
 */
export const MILESTONE_MESSAGES = {
  weeks: (count: number) =>
    `Ça fait ${count} semaines que tu as commencé. Regarde le chemin parcouru.`,
  days: (count: number) =>
    `${count} jours sur cette habitude. Tu n'es plus la même personne.`,
  months: (count: number) =>
    count === 1
      ? 'Un mois. Puis deux. Puis trois. C\'est ça, l\'effet composé.'
      : `${count} mois. L'effet composé fait son travail.`,
} as const

// ============================================================================
// MESSAGES D'INTERFACE
// ============================================================================

/**
 * Messages pour l'écran vide (pas d'habitude créée)
 */
export const EMPTY_STATE = {
  title: 'Tout commence par une habitude',
  subtitle: 'Créez votre première habitude pour démarrer votre progression.',
  button: 'Créer une habitude',
} as const

/**
 * Messages de confirmation de création d'habitude
 */
export const HABIT_CREATED = [
  'Habitude créée. Ta dose du jour commence demain.',
  'C\'est parti. Tu verras ta première dose demain matin.',
] as const

/**
 * Messages de confirmation de modification
 */
export const HABIT_MODIFIED = [
  'Modification enregistrée.',
  'C\'est noté. Ta nouvelle progression démarre maintenant.',
] as const

/**
 * Messages de confirmation d'archivage
 */
export const HABIT_ARCHIVED = [
  'Habitude archivée. Son historique est conservé.',
  'Habitude mise en pause. Tu pourras la réactiver quand tu voudras.',
] as const

/**
 * Messages d'export
 */
export const EXPORT_SUCCESS = 'Export terminé. Tes données sont dans le fichier téléchargé.'

/**
 * Messages d'import
 */
export const IMPORT_SUCCESS = 'Import réussi. Tes données sont restaurées.'
export const IMPORT_ERROR = 'Ce fichier ne semble pas compatible. Vérifie qu\'il s\'agit d\'un export Doucement.'

// ============================================================================
// MESSAGES DE PROGRESSION
// ============================================================================

/**
 * Messages pour augmentation de dose
 */
export const DOSE_INCREASE = {
  template: (value: number) =>
    `Nouvelle dose : ${value}. Tu as grandi depuis le début.`,
  templateAlt: (value: number) =>
    `Ta dose augmente à ${value}. Signe que tu progresses.`,
} as const

/**
 * Messages pour diminution de dose
 */
export const DOSE_DECREASE = {
  template: (value: number) =>
    `Nouvelle cible : ${value}. Tu te rapproches de ton objectif.`,
  templateAlt: (value: number) =>
    `Dose réduite à ${value}. Chaque jour, un peu moins.`,
} as const

/**
 * Messages pour objectif atteint
 */
export const GOAL_REACHED = [
  'Objectif atteint. Tu l\'as fait.',
  'La cible est atteinte. Félicitations, vraiment.',
  'C\'est fait. Tu peux être fier·e de toi.',
] as const

// ============================================================================
// MESSAGES ENCOURAGEANTS (ÉCRAN AUJOURD'HUI)
// ============================================================================

/**
 * Messages selon le moment de la journée
 */
export const ENCOURAGING_MESSAGES = {
  morning: [
    'Nouvelle journée, nouvelles possibilités',
    'Le matin est fait pour les premiers pas',
    'Aujourd\'hui t\'appartient',
  ],
  afternoon: [
    'Tu as encore du temps devant toi',
    'L\'après-midi est encore long',
    'Continue sur ta lancée',
  ],
  evening: [
    'Termine en douceur',
    'La journée touche à sa fin',
    'Il reste encore un peu de temps',
  ],
} as const

/**
 * Emojis associés au moment de la journée
 */
export const TIME_OF_DAY_EMOJIS = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
} as const

// ============================================================================
// TEXTES LÉGAUX ET PARAMÈTRES
// ============================================================================

/**
 * Texte À propos
 */
export const ABOUT_TEXT = {
  description:
    'Doucement est une application conçue pour t\'aider à améliorer tes habitudes progressivement, sans culpabilité.',
  privacy:
    'Tes données restent sur ton appareil. Aucune information n\'est collectée ni transmise.',
} as const

/**
 * Texte Vie privée détaillé
 */
export const PRIVACY_TEXT =
  'Cette application fonctionne entièrement hors ligne. Aucune donnée personnelle n\'est collectée, stockée sur des serveurs ou partagée avec des tiers. Toutes tes informations restent exclusivement sur ton appareil.'

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Sélectionne un message aléatoire parmi une liste
 */
export function randomMessage<T>(messages: readonly T[]): T {
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Sélectionne un message de check-in selon le pourcentage de complétion
 */
export function getCheckinMessage(completionPercent: number): string {
  if (completionPercent > 100) {
    return randomMessage(CHECKIN_EXCEEDED)
  }
  if (completionPercent >= 100) {
    return randomMessage(CHECKIN_COMPLETED)
  }
  if (completionPercent >= 50) {
    return randomMessage(CHECKIN_PARTIAL)
  }
  if (completionPercent > 0) {
    return randomMessage(CHECKIN_PARTIAL)
  }
  return randomMessage(CHECKIN_NO_ACTIVITY)
}

/**
 * Sélectionne un message hebdomadaire selon le ratio de jours actifs
 */
export function getWeeklyMessage(activeDaysRatio: number): string {
  if (activeDaysRatio >= 0.6) {
    return randomMessage(WEEKLY_POSITIVE)
  }
  if (activeDaysRatio >= 0.3) {
    return randomMessage(WEEKLY_AVERAGE)
  }
  return randomMessage(WEEKLY_DIFFICULT)
}

/**
 * Sélectionne un message encourageant selon le moment de la journée
 */
export function getEncouragingMessage(
  timeOfDay: 'morning' | 'afternoon' | 'evening'
): string {
  return randomMessage(ENCOURAGING_MESSAGES[timeOfDay])
}
