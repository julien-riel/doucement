/**
 * Service de détection des jalons
 * Détecte quand un utilisateur atteint 25%, 50%, 75% ou 100% de sa cible finale
 */

import { Habit } from '../types'
import { Milestone, MilestoneLevel, MilestonesState } from '../types/statistics'

/**
 * Les niveaux de jalon disponibles
 */
export const MILESTONE_LEVELS: MilestoneLevel[] = [25, 50, 75, 100]

/**
 * Retourne la date actuelle au format YYYY-MM-DD
 */
function getTodayDate(): string {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Calcule le pourcentage d'avancement vers la cible finale
 *
 * Pour les habitudes en augmentation (increase):
 *   progression = (currentValue - startValue) / (targetValue - startValue)
 *
 * Pour les habitudes en diminution (decrease):
 *   progression = (startValue - currentValue) / (startValue - targetValue)
 *
 * @param habit Habitude
 * @param currentValue Valeur actuelle
 * @returns Pourcentage entre 0 et 100+ (peut dépasser 100)
 */
export function calculateProgressPercentage(habit: Habit, currentValue: number): number {
  // Sans targetValue, pas de calcul de progression vers une cible
  if (habit.targetValue === undefined) {
    return 0
  }

  const { direction, startValue, targetValue } = habit

  if (direction === 'increase') {
    // Cas où startValue >= targetValue (cible déjà atteinte ou égale)
    if (startValue >= targetValue) {
      return currentValue >= targetValue ? 100 : 0
    }

    const total = targetValue - startValue
    const achieved = currentValue - startValue
    return (achieved / total) * 100
  }

  if (direction === 'decrease') {
    // Cas où startValue <= targetValue (cible déjà atteinte ou égale)
    if (startValue <= targetValue) {
      return currentValue <= targetValue ? 100 : 0
    }

    const total = startValue - targetValue
    const achieved = startValue - currentValue
    return (achieved / total) * 100
  }

  // Pour 'maintain', pas de progression vers une cible
  return 0
}

/**
 * Détermine quels niveaux de jalon ont été atteints
 *
 * @param progressPercentage Pourcentage de progression (0-100+)
 * @returns Liste des niveaux atteints
 */
export function getReachedLevels(progressPercentage: number): MilestoneLevel[] {
  const reachedLevels: MilestoneLevel[] = []

  for (const level of MILESTONE_LEVELS) {
    if (progressPercentage >= level) {
      reachedLevels.push(level)
    }
  }

  return reachedLevels
}

/**
 * Détecte les nouveaux jalons atteints qui n'ont pas encore été enregistrés
 *
 * @param habit Habitude
 * @param currentValue Valeur actuelle (dernière entrée)
 * @param existingMilestones Jalons déjà atteints pour cette habitude
 * @returns Liste des nouveaux jalons à célébrer
 */
export function detectNewMilestones(
  habit: Habit,
  currentValue: number,
  existingMilestones: Milestone[]
): Milestone[] {
  // Sans targetValue, pas de jalons
  if (habit.targetValue === undefined) {
    return []
  }

  const progressPercentage = calculateProgressPercentage(habit, currentValue)
  const reachedLevels = getReachedLevels(progressPercentage)

  // Trouver les jalons déjà enregistrés pour cette habitude
  const existingLevels = new Set(
    existingMilestones.filter((m) => m.habitId === habit.id).map((m) => m.level)
  )

  // Créer les nouveaux jalons
  const today = getTodayDate()
  const newMilestones: Milestone[] = []

  for (const level of reachedLevels) {
    if (!existingLevels.has(level)) {
      newMilestones.push({
        habitId: habit.id,
        level,
        reachedAt: today,
        celebrated: false,
      })
    }
  }

  return newMilestones
}

/**
 * Récupère les jalons non célébrés pour une habitude
 *
 * @param habitId ID de l'habitude
 * @param milestones Liste de tous les jalons
 * @returns Jalons non célébrés
 */
export function getUncelebratedMilestones(habitId: string, milestones: Milestone[]): Milestone[] {
  return milestones.filter((m) => m.habitId === habitId && !m.celebrated)
}

/**
 * Récupère tous les jalons pour une habitude
 *
 * @param habitId ID de l'habitude
 * @param milestones Liste de tous les jalons
 * @returns Jalons de l'habitude triés par niveau
 */
export function getMilestonesForHabit(habitId: string, milestones: Milestone[]): Milestone[] {
  return milestones.filter((m) => m.habitId === habitId).sort((a, b) => a.level - b.level)
}

/**
 * Marque un jalon comme célébré
 *
 * @param milestones État actuel des jalons
 * @param habitId ID de l'habitude
 * @param level Niveau du jalon
 * @returns Nouvel état avec le jalon marqué comme célébré
 */
export function markMilestoneAsCelebrated(
  milestones: Milestone[],
  habitId: string,
  level: MilestoneLevel
): Milestone[] {
  return milestones.map((m) => {
    if (m.habitId === habitId && m.level === level) {
      return { ...m, celebrated: true }
    }
    return m
  })
}

/**
 * Ajoute de nouveaux jalons à l'état existant
 *
 * @param state État actuel des jalons
 * @param newMilestones Nouveaux jalons à ajouter
 * @returns Nouvel état avec les jalons ajoutés
 */
export function addMilestones(state: MilestonesState, newMilestones: Milestone[]): MilestonesState {
  return {
    milestones: [...state.milestones, ...newMilestones],
  }
}

/**
 * Récupère le message de célébration pour un niveau de jalon
 * Messages depuis banque-messages.md
 *
 * @param level Niveau du jalon
 * @returns Message de célébration
 */
export function getMilestoneMessage(level: MilestoneLevel): string {
  switch (level) {
    case 25:
      return 'Beau départ ! Tu as parcouru un quart du chemin.'
    case 50:
      return 'Mi-parcours atteint ! Tu es sur la bonne voie.'
    case 75:
      return "Trois quarts ! L'arrivée est en vue."
    case 100:
      return 'Objectif atteint ! Tu peux être fier·e de toi.'
    default:
      return 'Félicitations pour ta progression !'
  }
}

/**
 * Récupère l'emoji pour un niveau de jalon
 *
 * @param level Niveau du jalon
 * @returns Emoji approprié
 */
export function getMilestoneEmoji(level: MilestoneLevel): string {
  switch (level) {
    case 25:
      return '🌱'
    case 50:
      return '🌿'
    case 75:
      return '🌳'
    case 100:
      return '🎉'
    default:
      return '✨'
  }
}

/**
 * Vérifie si un nouveau jalon vient d'être atteint après un check-in
 *
 * @param habit Habitude
 * @param previousValue Valeur avant le check-in
 * @param newValue Valeur après le check-in
 * @param existingMilestones Jalons déjà atteints
 * @returns Le nouveau jalon le plus élevé atteint, ou null
 */
export function checkForNewMilestoneAfterCheckIn(
  habit: Habit,
  previousValue: number,
  newValue: number,
  existingMilestones: Milestone[]
): Milestone | null {
  // Sans targetValue, pas de jalons
  if (habit.targetValue === undefined) {
    return null
  }

  const previousPercentage = calculateProgressPercentage(habit, previousValue)
  const newPercentage = calculateProgressPercentage(habit, newValue)

  // Trouver les jalons déjà enregistrés
  const existingLevels = new Set(
    existingMilestones.filter((m) => m.habitId === habit.id).map((m) => m.level)
  )

  // Chercher le jalon le plus élevé nouvellement atteint
  const today = getTodayDate()
  let highestNewMilestone: Milestone | null = null

  for (const level of MILESTONE_LEVELS) {
    // Le jalon est nouveau si:
    // 1. On était en dessous avant
    // 2. On est au-dessus maintenant
    // 3. Il n'était pas déjà enregistré
    if (previousPercentage < level && newPercentage >= level && !existingLevels.has(level)) {
      highestNewMilestone = {
        habitId: habit.id,
        level,
        reachedAt: today,
        celebrated: false,
      }
    }
  }

  return highestNewMilestone
}
