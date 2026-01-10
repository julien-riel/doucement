/**
 * Hook useNotifications
 * Initialise et gère les rappels de notifications au démarrage de l'app
 */

import { useEffect, useCallback, useRef } from 'react'
import { NotificationSettings, DailyEntry, Habit } from '../types'
import {
  scheduleAllReminders,
  cancelAllReminders,
  getNotificationPermissionState,
  isNotificationSupported,
} from '../services/notifications'

/**
 * Options du hook useNotifications
 */
interface UseNotificationsOptions {
  /** Paramètres de notifications de l'utilisateur */
  settings: NotificationSettings
  /** Fonction pour obtenir les entrées d'une date */
  getEntriesForDate: (date: string) => DailyEntry[]
  /** Liste des habitudes actives */
  activeHabits: Habit[]
  /** Application chargée et prête */
  isReady: boolean
}

/**
 * Hook pour gérer les notifications de l'application
 *
 * Programme automatiquement les rappels selon les préférences utilisateur :
 * - Rappel matinal : "Votre dose du jour vous attend"
 * - Rappel du soir : Si aucune entrée enregistrée pour aujourd'hui
 * - Rappel revue hebdomadaire : Chaque dimanche
 */
export function useNotifications({
  settings,
  getEntriesForDate,
  activeHabits,
  isReady,
}: UseNotificationsOptions): void {
  // Référence pour éviter les re-renders inutiles
  const getEntriesRef = useRef(getEntriesForDate)
  const activeHabitsRef = useRef(activeHabits)

  // Mettre à jour les refs
  useEffect(() => {
    getEntriesRef.current = getEntriesForDate
    activeHabitsRef.current = activeHabits
  }, [getEntriesForDate, activeHabits])

  /**
   * Vérifie si le rappel du soir doit être envoyé
   * Retourne true si moins d'entrées que d'habitudes actives
   */
  const checkEveningCondition = useCallback((): boolean => {
    const today = new Date().toISOString().split('T')[0]
    const todayEntries = getEntriesRef.current(today)
    const habitsCount = activeHabitsRef.current.length

    // Ne pas envoyer si pas d'habitudes actives
    if (habitsCount === 0) {
      return false
    }

    // Envoyer le rappel si moins d'entrées que d'habitudes actives
    return todayEntries.length < habitsCount
  }, [])

  // Initialiser les rappels au démarrage
  useEffect(() => {
    // Attendre que l'app soit prête
    if (!isReady) {
      return
    }

    // Vérifier le support et la permission
    if (!isNotificationSupported()) {
      return
    }

    const permissionState = getNotificationPermissionState()
    if (permissionState !== 'granted') {
      return
    }

    // Vérifier que les notifications sont activées
    if (!settings.enabled) {
      cancelAllReminders()
      return
    }

    // Programmer tous les rappels
    scheduleAllReminders(settings, checkEveningCondition)

    // Cleanup au démontage
    return () => {
      cancelAllReminders()
    }
  }, [settings, isReady, checkEveningCondition])
}
