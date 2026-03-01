/**
 * Service de notifications locales
 * Gère les permissions, la programmation et l'annulation des notifications
 *
 * Principes:
 * - Opt-in uniquement (désactivées par défaut)
 * - 100% locales (aucun serveur push)
 * - Non intrusives (ton bienveillant)
 */

import { NotificationSettings, ReminderType, ReminderConfig } from '../types'
import i18n from '../i18n'

// ============================================================================
// TYPES
// ============================================================================

/**
 * État de permission des notifications
 */
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

/**
 * Résultat d'une demande de permission
 */
export interface PermissionResult {
  success: boolean
  state: NotificationPermissionState
  error?: string
}

/**
 * Options pour une notification
 */
export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
}

/**
 * Scheduled notification tracker
 */
interface ScheduledReminder {
  type: ReminderType
  timeoutId: ReturnType<typeof setTimeout>
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Retourne les messages de notification localisés
 */
export function getNotificationMessage(type: ReminderType): { title: string; body: string } {
  return {
    title: i18n.t('notifications.appName'),
    body: i18n.t(`notifications.${type}.body`),
  }
}

// ============================================================================
// SERVICE WORKER MESSAGE TYPES
// ============================================================================

/**
 * Message types for Service Worker communication
 */
const SW_MESSAGE_TYPES = {
  SCHEDULE_NOTIFICATION: 'SCHEDULE_NOTIFICATION',
  CANCEL_NOTIFICATION: 'CANCEL_NOTIFICATION',
  CANCEL_ALL_NOTIFICATIONS: 'CANCEL_ALL_NOTIFICATIONS',
} as const

// ============================================================================
// STATE
// ============================================================================

/**
 * Active scheduled reminders
 */
const scheduledReminders: ScheduledReminder[] = []

// ============================================================================
// PERMISSION FUNCTIONS
// ============================================================================

/**
 * Vérifie si les notifications sont supportées par le navigateur
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

/**
 * Obtient l'état actuel de la permission de notification
 */
export function getNotificationPermissionState(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported'
  }
  return Notification.permission as NotificationPermissionState
}

/**
 * Demande la permission de notification à l'utilisateur
 *
 * @returns Résultat de la demande de permission
 */
export async function requestNotificationPermission(): Promise<PermissionResult> {
  if (!isNotificationSupported()) {
    return {
      success: false,
      state: 'unsupported',
      error: 'Les notifications ne sont pas supportées par ce navigateur',
    }
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return {
      success: true,
      state: 'granted',
    }
  }

  // Already denied - can't request again
  if (Notification.permission === 'denied') {
    return {
      success: false,
      state: 'denied',
      error:
        'Les notifications ont été refusées. Modifie les paramètres de ton navigateur pour les autoriser.',
    }
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission()
    return {
      success: permission === 'granted',
      state: permission as NotificationPermissionState,
      error: permission === 'denied' ? 'Permission refusée' : undefined,
    }
  } catch (error) {
    return {
      success: false,
      state: 'default',
      error: error instanceof Error ? error.message : 'Erreur lors de la demande de permission',
    }
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Affiche une notification immédiatement
 *
 * @param options Options de la notification
 * @returns true si la notification a été affichée
 */
export function showNotification(options: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    })

    // Auto-close after 10 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000)
    }

    // Handle click - focus the app
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return true
  } catch {
    return false
  }
}

// ============================================================================
// SCHEDULING FUNCTIONS
// ============================================================================

/**
 * Calcule le délai en millisecondes jusqu'à une heure donnée
 *
 * @param timeString Heure au format HH:MM
 * @returns Délai en millisecondes
 */
export function calculateDelayUntil(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const target = new Date()

  target.setHours(hours, minutes, 0, 0)

  // Si l'heure est passée, programmer pour demain
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  return target.getTime() - now.getTime()
}

/**
 * Calcule le délai jusqu'au prochain dimanche à l'heure donnée
 *
 * @param timeString Heure au format HH:MM
 * @returns Délai en millisecondes
 */
export function calculateDelayUntilNextSunday(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const target = new Date()

  target.setHours(hours, minutes, 0, 0)

  // Trouver le prochain dimanche (0 = dimanche)
  const daysUntilSunday = (7 - target.getDay()) % 7

  if (daysUntilSunday === 0 && target <= now) {
    // C'est dimanche mais l'heure est passée, programmer pour dimanche prochain
    target.setDate(target.getDate() + 7)
  } else {
    target.setDate(target.getDate() + daysUntilSunday)
  }

  return target.getTime() - now.getTime()
}

/**
 * Programme un rappel
 *
 * @param type Type de rappel
 * @param config Configuration du rappel
 * @param checkCondition Fonction optionnelle pour vérifier si la notification doit être envoyée
 */
export function scheduleReminder(
  type: ReminderType,
  config: ReminderConfig,
  checkCondition?: () => boolean
): void {
  if (!config.enabled) {
    return
  }

  // Annuler le rappel existant de ce type
  cancelReminder(type)

  let delay: number

  if (type === 'weeklyReview') {
    delay = calculateDelayUntilNextSunday(config.time)
  } else {
    delay = calculateDelayUntil(config.time)
  }

  const message = getNotificationMessage(type)

  // Also schedule via Service Worker for background support
  // This allows notifications even when the app is closed (PWA only)
  scheduleNotificationViaSW(type, message.title, message.body, delay)

  const timeoutId = setTimeout(() => {
    // Vérifier la condition si fournie
    if (checkCondition && !checkCondition()) {
      // Re-programmer pour le lendemain/semaine prochaine
      scheduleReminder(type, config, checkCondition)
      return
    }

    // Re-resolve message at notification time for correct language
    const currentMessage = getNotificationMessage(type)

    // Afficher la notification
    showNotification({
      title: currentMessage.title,
      body: currentMessage.body,
      tag: `doucement-${type}`,
    })

    // Re-programmer pour le lendemain/semaine prochaine
    scheduleReminder(type, config, checkCondition)
  }, delay)

  scheduledReminders.push({ type, timeoutId })
}

/**
 * Annule un rappel programmé
 *
 * @param type Type de rappel à annuler
 */
export function cancelReminder(type: ReminderType): void {
  const index = scheduledReminders.findIndex((r) => r.type === type)
  if (index !== -1) {
    clearTimeout(scheduledReminders[index].timeoutId)
    scheduledReminders.splice(index, 1)
  }
  // Also cancel via Service Worker
  cancelNotificationViaSW(type)
}

/**
 * Annule tous les rappels programmés
 */
export function cancelAllReminders(): void {
  scheduledReminders.forEach((r) => clearTimeout(r.timeoutId))
  scheduledReminders.length = 0
  // Also cancel via Service Worker
  cancelAllNotificationsViaSW()
}

/**
 * Programme tous les rappels selon les paramètres
 *
 * @param settings Paramètres de notifications
 * @param checkEveningCondition Fonction pour vérifier si le rappel du soir doit être envoyé
 */
export function scheduleAllReminders(
  settings: NotificationSettings,
  checkEveningCondition?: () => boolean
): void {
  // Annuler tous les rappels existants
  cancelAllReminders()

  // Si les notifications sont désactivées globalement, ne rien programmer
  if (!settings.enabled || Notification.permission !== 'granted') {
    return
  }

  // Programmer les rappels actifs
  scheduleReminder('morning', settings.morningReminder)
  scheduleReminder('evening', settings.eveningReminder, checkEveningCondition)
  scheduleReminder('weeklyReview', settings.weeklyReviewReminder)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Vérifie si les notifications peuvent être activées
 */
export function canEnableNotifications(): boolean {
  return isNotificationSupported() && Notification.permission !== 'denied'
}

/**
 * Obtient un message descriptif de l'état de permission
 */
export function getPermissionStateMessage(): string {
  const state = getNotificationPermissionState()

  switch (state) {
    case 'granted':
      return 'Notifications autorisées'
    case 'denied':
      return 'Notifications bloquées. Modifie les paramètres de ton navigateur.'
    case 'default':
      return 'Cliquez pour activer les notifications'
    case 'unsupported':
      return 'Les notifications ne sont pas supportées par ce navigateur'
    default:
      return 'État inconnu'
  }
}

// ============================================================================
// SERVICE WORKER FUNCTIONS
// ============================================================================

/**
 * Vérifie si le Service Worker est disponible
 */
export function isServiceWorkerAvailable(): boolean {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
}

/**
 * Envoie un message au Service Worker
 */
async function postMessageToSW(message: { type: string; payload?: unknown }): Promise<void> {
  if (!isServiceWorkerAvailable()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    registration.active?.postMessage(message)
  } catch {
    // Service Worker not available, fallback to setTimeout
  }
}

/**
 * Programme une notification via le Service Worker
 * Utilisé pour les notifications en arrière-plan quand l'app est fermée
 */
export async function scheduleNotificationViaSW(
  id: string,
  title: string,
  body: string,
  delay: number
): Promise<void> {
  await postMessageToSW({
    type: SW_MESSAGE_TYPES.SCHEDULE_NOTIFICATION,
    payload: {
      id,
      title,
      body,
      delay,
      icon: '/icons/icon-192x192.png',
      tag: `doucement-${id}`,
    },
  })
}

/**
 * Annule une notification programmée via le Service Worker
 */
export async function cancelNotificationViaSW(id: string): Promise<void> {
  await postMessageToSW({
    type: SW_MESSAGE_TYPES.CANCEL_NOTIFICATION,
    payload: { id },
  })
}

/**
 * Annule toutes les notifications programmées via le Service Worker
 */
export async function cancelAllNotificationsViaSW(): Promise<void> {
  await postMessageToSW({
    type: SW_MESSAGE_TYPES.CANCEL_ALL_NOTIFICATIONS,
  })
}
