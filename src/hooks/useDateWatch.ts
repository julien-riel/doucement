/**
 * Hook useDateWatch
 * Détecte automatiquement le changement de journée à minuit
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentDate } from '../utils'

/**
 * Intervalle de vérification du changement de date (en ms)
 * Vérifie toutes les minutes pour éviter les rafraîchissements excessifs
 */
const CHECK_INTERVAL_MS = 60_000

/**
 * Hook qui surveille le passage à un nouveau jour
 * et déclenche un callback quand la date change
 *
 * @param onDateChange - Callback appelé avec la nouvelle date quand le jour change
 * @returns La date courante au format YYYY-MM-DD
 *
 * @example
 * ```tsx
 * const currentDate = useDateWatch((newDate) => {
 *   console.log('Nouvelle journée:', newDate)
 * })
 * ```
 */
export function useDateWatch(onDateChange?: (newDate: string) => void): string {
  const [currentDate, setCurrentDate] = useState(() => getCurrentDate())
  const onDateChangeRef = useRef(onDateChange)

  // Garde une référence stable du callback
  useEffect(() => {
    onDateChangeRef.current = onDateChange
  }, [onDateChange])

  const checkDateChange = useCallback(() => {
    const now = getCurrentDate()
    if (now !== currentDate) {
      setCurrentDate(now)
      onDateChangeRef.current?.(now)
    }
  }, [currentDate])

  useEffect(() => {
    // Vérifie immédiatement au cas où le composant se monte après minuit
    checkDateChange()

    // Démarre l'intervalle de vérification
    const intervalId = setInterval(checkDateChange, CHECK_INTERVAL_MS)

    // Ajoute aussi un listener sur la visibilité de la page
    // pour détecter le changement quand l'utilisateur revient sur l'app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateChange()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkDateChange])

  return currentDate
}
