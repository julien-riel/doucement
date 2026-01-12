/**
 * Hook useCelebrations
 * Gère la détection et l'affichage des célébrations de jalons
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Habit, DailyEntry } from '../types'
import { Milestone, MilestonesState } from '../types/statistics'
import {
  detectNewMilestones,
  checkForNewMilestoneAfterCheckIn,
  markMilestoneAsCelebrated,
} from '../services/milestones'

export interface UseCelebrationsState {
  /** Jalon actuel à célébrer (ou null si aucun) */
  currentMilestone: Milestone | null
  /** Habitude associée au jalon à célébrer */
  currentHabit: Habit | null
  /** Tous les jalons non célébrés */
  uncelebratedMilestones: Milestone[]
  /** Modale de célébration ouverte */
  isModalOpen: boolean
}

export interface UseCelebrationsActions {
  /** Vérifie si de nouveaux jalons ont été atteints après un check-in */
  checkMilestonesAfterCheckIn: (
    habit: Habit,
    previousValue: number,
    newValue: number
  ) => Milestone | null
  /** Détecte tous les jalons non enregistrés pour les habitudes données */
  detectAllNewMilestones: (habits: Habit[], entries: DailyEntry[]) => Milestone[]
  /** Affiche la célébration pour un jalon */
  showCelebration: (milestone: Milestone, habit: Habit) => void
  /** Ferme la modale et marque le jalon comme célébré */
  closeCelebration: () => void
  /** Récupère l'état des jalons pour enregistrement */
  getMilestonesState: () => MilestonesState
}

export type UseCelebrationsReturn = UseCelebrationsState & UseCelebrationsActions

interface UseCelebrationsOptions {
  /** État initial des jalons (depuis les préférences utilisateur) */
  initialMilestones?: MilestonesState
  /** Callback pour mettre à jour les préférences */
  onMilestonesUpdate?: (milestones: MilestonesState) => void
}

/**
 * Hook pour gérer les célébrations de jalons
 *
 * @param options Options de configuration
 * @returns État et actions pour les célébrations
 *
 * @example
 * const { checkMilestonesAfterCheckIn, showCelebration, closeCelebration } = useCelebrations({
 *   initialMilestones: data.preferences.milestones,
 *   onMilestonesUpdate: (milestones) => updatePreferences({ milestones })
 * })
 */
export function useCelebrations(options: UseCelebrationsOptions = {}): UseCelebrationsReturn {
  const { initialMilestones = { milestones: [] }, onMilestonesUpdate } = options

  // Utiliser une référence stable pour détecter les changements
  const initialMilestonesRef = JSON.stringify(initialMilestones.milestones)

  // État local des jalons - mis à jour quand initialMilestones change
  const [milestonesState, setMilestonesState] = useState<MilestonesState>(initialMilestones)

  // Synchroniser l'état quand les milestones initiaux changent (après chargement des données)
  useEffect(() => {
    setMilestonesState(initialMilestones)
  }, [initialMilestonesRef])

  // État de la modale
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null)
  const [currentHabit, setCurrentHabit] = useState<Habit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Jalons non célébrés
  const uncelebratedMilestones = useMemo(() => {
    return milestonesState.milestones.filter((m) => !m.celebrated)
  }, [milestonesState.milestones])

  /**
   * Met à jour l'état des jalons et notifie le parent
   */
  const updateMilestones = useCallback(
    (newState: MilestonesState) => {
      setMilestonesState(newState)
      onMilestonesUpdate?.(newState)
    },
    [onMilestonesUpdate]
  )

  /**
   * Vérifie si de nouveaux jalons ont été atteints après un check-in
   */
  const checkMilestonesAfterCheckIn = useCallback(
    (habit: Habit, previousValue: number, newValue: number): Milestone | null => {
      const newMilestone = checkForNewMilestoneAfterCheckIn(
        habit,
        previousValue,
        newValue,
        milestonesState.milestones
      )

      if (newMilestone) {
        // Ajouter le nouveau jalon à l'état
        const updatedState = {
          milestones: [...milestonesState.milestones, newMilestone],
        }
        updateMilestones(updatedState)
        return newMilestone
      }

      return null
    },
    [milestonesState.milestones, updateMilestones]
  )

  /**
   * Détecte tous les jalons non enregistrés pour les habitudes données
   * Utile au chargement de la page statistiques
   * Utilise initialMilestones directement pour éviter les problèmes de synchronisation
   */
  const detectAllNewMilestones = useCallback(
    (habits: Habit[], entries: DailyEntry[]): Milestone[] => {
      // Utiliser initialMilestones car milestonesState peut être désynchronisé
      const existingMilestones = initialMilestones.milestones
      const allNewMilestones: Milestone[] = []

      for (const habit of habits) {
        if (habit.targetValue === undefined) continue

        // Trouver la dernière valeur pour cette habitude
        const habitEntries = entries
          .filter((e) => e.habitId === habit.id)
          .sort((a, b) => b.date.localeCompare(a.date))

        if (habitEntries.length === 0) continue

        const currentValue = habitEntries[0].actualValue

        // Détecter les nouveaux jalons en utilisant les milestones du parent
        const newMilestones = detectNewMilestones(habit, currentValue, existingMilestones)

        allNewMilestones.push(...newMilestones)
      }

      if (allNewMilestones.length > 0) {
        // Ajouter tous les nouveaux jalons à la liste existante
        const updatedState = {
          milestones: [...existingMilestones, ...allNewMilestones],
        }
        updateMilestones(updatedState)
      }

      return allNewMilestones
    },
    [initialMilestones.milestones, updateMilestones]
  )

  /**
   * Affiche la célébration pour un jalon
   */
  const showCelebration = useCallback((milestone: Milestone, habit: Habit) => {
    setCurrentMilestone(milestone)
    setCurrentHabit(habit)
    setIsModalOpen(true)
  }, [])

  /**
   * Ferme la modale et marque le jalon comme célébré
   */
  const closeCelebration = useCallback(() => {
    if (currentMilestone) {
      // Marquer comme célébré
      const updatedMilestones = markMilestoneAsCelebrated(
        milestonesState.milestones,
        currentMilestone.habitId,
        currentMilestone.level
      )

      const updatedState = { milestones: updatedMilestones }
      updateMilestones(updatedState)
    }

    setIsModalOpen(false)
    setCurrentMilestone(null)
    setCurrentHabit(null)
  }, [currentMilestone, milestonesState.milestones, updateMilestones])

  /**
   * Récupère l'état actuel des jalons
   */
  const getMilestonesState = useCallback((): MilestonesState => {
    return milestonesState
  }, [milestonesState])

  return {
    // State
    currentMilestone,
    currentHabit,
    uncelebratedMilestones,
    isModalOpen,
    // Actions
    checkMilestonesAfterCheckIn,
    detectAllNewMilestones,
    showCelebration,
    closeCelebration,
    getMilestonesState,
  }
}
