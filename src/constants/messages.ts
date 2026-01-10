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
// MESSAGES IMPLEMENTATION INTENTIONS (Phase 6)
// ============================================================================

/**
 * Textes pour la configuration des Implementation Intentions
 */
export const IMPLEMENTATION_INTENTION = {
  stepTitle: 'Quand et où ?',
  stepSubtitle: 'Définir le moment et le lieu augmente tes chances de succès de 2 à 3 fois.',
  triggerLabel: 'Après quoi ?',
  triggerPlaceholder: 'Ex: Après mon café du matin',
  triggerHelp: 'Choisis un déclencheur qui fait déjà partie de ta routine.',
  locationLabel: 'Où ?',
  locationPlaceholder: 'Ex: Dans le salon',
  locationHelp: 'Un lieu précis aide à automatiser l\'habitude.',
  timeLabel: 'À quelle heure ?',
  timeHelp: 'Optionnel. L\'heure approximative prévue.',
  skipButton: 'Passer cette étape',
  exampleTriggers: [
    'Après mon café du matin',
    'Après le déjeuner',
    'Avant de me coucher',
    'En rentrant du travail',
    'Après m\'être brossé les dents',
  ],
} as const

/**
 * Textes pour l'affichage des intentions sur les cartes
 */
export const INTENTION_DISPLAY = {
  triggerPrefix: 'Après',
  locationPrefix: 'à',
  timePrefix: 'vers',
} as const

// ============================================================================
// MESSAGES HABIT STACKING (Phase 6)
// ============================================================================

/**
 * Textes pour le Habit Stacking (ancrage d'habitudes)
 */
export const HABIT_STACKING = {
  selectorTitle: 'Associer à une habitude existante',
  selectorSubtitle: 'Le habit stacking augmente le taux de réussite de 64%.',
  selectorLabel: 'Après quelle habitude ?',
  selectorPlaceholder: 'Choisir une habitude...',
  selectorHelp: 'Enchaîne cette nouvelle habitude avec une que tu fais déjà.',
  noHabitsAvailable: 'Crée d\'abord une autre habitude pour pouvoir les enchaîner.',
  linkedBadge: 'Enchaîné',
  afterLabel: 'Après :',
} as const

// ============================================================================
// MESSAGES DE RETOUR / RÉCUPÉRATION (Phase 6)
// ============================================================================

/**
 * Messages de bienvenue après une absence
 * Utilisés quand l'utilisateur revient après 2+ jours sans check-in
 */
export const WELCOME_BACK = [
  'Content de te revoir.',
  'De retour ? On reprend doucement.',
  'Te revoilà. Pas de pression, on continue.',
  'Bienvenue de retour. Chaque jour est une nouvelle chance.',
  'Tu es revenu·e. C\'est déjà une victoire.',
] as const

/**
 * Messages bienveillants pour les habitudes négligées
 */
export const HABIT_NEGLECTED = {
  title: 'Ça faisait longtemps',
  subtitle: (days: number) =>
    days === 1
      ? 'Tu n\'as pas enregistré cette habitude hier.'
      : `Tu n\'as pas enregistré cette habitude depuis ${days} jours.`,
  encouragement: 'Pas de souci. On reprend là où tu en es.',
  resumeButton: 'Reprendre',
} as const

/**
 * Textes pour la pause planifiée
 */
export const PLANNED_PAUSE = {
  buttonLabel: 'Prendre une pause',
  dialogTitle: 'Pause planifiée',
  dialogDescription: 'Pendant une pause, cette habitude n\'apparaîtra pas dans ta dose du jour et n\'affectera pas tes stats.',
  reasonLabel: 'Raison (optionnel)',
  reasonPlaceholder: 'Vacances, maladie, projet...',
  startDateLabel: 'Début de la pause',
  endDateLabel: 'Fin de la pause',
  confirmButton: 'Mettre en pause',
  cancelButton: 'Annuler',
  activePauseBadge: 'En pause',
  resumeButton: 'Reprendre',
  pauseReasons: [
    'Vacances',
    'Maladie',
    'Période chargée',
    'Autre priorité',
  ],
} as const

// ============================================================================
// MESSAGES MODE SIMPLE (Phase 6)
// ============================================================================

/**
 * Textes pour le mode de tracking simple (binaire)
 */
export const SIMPLE_TRACKING = {
  doneButton: 'Fait',
  notTodayButton: 'Pas aujourd\'hui',
  transitionSuggestion: 'Tu utilises cette habitude depuis 30 jours ! Veux-tu passer au suivi détaillé ?',
  transitionYes: 'Oui, passer au détaillé',
  transitionNo: 'Rester en mode simple',
} as const

// ============================================================================
// MESSAGES FRICTION INTENTIONNELLE (Phase 6)
// ============================================================================

/**
 * Textes pour la friction intentionnelle (habitudes à réduire)
 */
export const INTENTIONAL_FRICTION = {
  delayTitle: 'Un moment de réflexion',
  delayMessage: 'Prends quelques secondes pour réfléchir...',
  preLogQuestion: 'Comment te sens-tu en ce moment ?',
  preLogOptions: [
    'Stressé·e',
    'Ennuyé·e',
    'Fatigué·e',
    'Par habitude',
    'Vraiment envie',
  ],
  alternativeSuggestionTitle: 'Une alternative ?',
  alternativeSuggestionText: 'Et si tu essayais plutôt...',
  continueAnyway: 'Continuer quand même',
} as const

// ============================================================================
// MESSAGES REVUE HEBDOMADAIRE ENRICHIE (Phase 6)
// ============================================================================

/**
 * Textes pour la réflexion guidée dans la revue hebdomadaire
 */
export const WEEKLY_REFLECTION = {
  questionTitle: 'Réflexion de la semaine',
  mainQuestion: 'Qu\'est-ce qui a bien fonctionné cette semaine ?',
  placeholder: 'Note ce qui t\'a aidé à tenir tes habitudes...',
  saveButton: 'Enregistrer',
  skipButton: 'Passer',
  savedMessage: 'Réflexion enregistrée.',
} as const

/**
 * Textes pour l'analyse des patterns
 */
export const PATTERN_ANALYSIS = {
  bestDaysTitle: 'Tes meilleurs jours',
  bestDaysIntro: 'Tu es particulièrement régulier·e le :',
  bestTimeTitle: 'Ton meilleur moment',
  bestTimeIntro: 'Tu enregistres souvent le :',
  noDataYet: 'Pas encore assez de données pour identifier des patterns.',
  morningLabel: 'matin',
  afternoonLabel: 'après-midi',
  eveningLabel: 'soir',
} as const

/**
 * Suggestions d'ajustement basées sur la performance
 */
export const ADJUSTMENT_SUGGESTIONS = {
  slowDownTitle: 'Suggestion',
  slowDownMessage: 'Ta progression semble stagner. Et si tu ralentissais un peu le rythme ?',
  slowDownAction: 'Ajuster la progression',
  keepGoingTitle: 'Continue comme ça !',
  keepGoingMessage: 'Tu es sur une bonne lancée. Garde ce rythme.',
  overperformTitle: 'Impressionnant !',
  overperformMessage: 'Tu dépasses régulièrement tes objectifs. Prêt·e à accélérer ?',
  overperformAction: 'Augmenter la progression',
  dismissAction: 'Non merci',
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
