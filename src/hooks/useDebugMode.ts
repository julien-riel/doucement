/**
 * Hook useDebugMode
 * Gestion du mode debug pour tester et déboguer l'application
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppData } from './useAppData'
import { getCurrentDate, addDays } from '../utils'

/**
 * Clé localStorage pour le mode debug (séparé des données app)
 */
const DEBUG_STORAGE_KEY = 'doucement-debug'

/**
 * Nombre de taps requis pour activer/désactiver le mode debug
 */
const TAPS_REQUIRED = 7

/**
 * Délai maximum entre les taps (ms)
 */
const TAP_TIMEOUT = 2000

/**
 * État du hook useDebugMode
 */
export interface UseDebugModeState {
  /** Mode debug activé */
  isDebugMode: boolean
  /** Date simulée (si active) */
  simulatedDate: string | null
  /** Date effective (simulée ou réelle) */
  effectiveDate: string
}

/**
 * Actions disponibles via useDebugMode
 */
export interface UseDebugModeActions {
  /** Active le mode debug */
  enableDebugMode: () => void
  /** Désactive le mode debug */
  disableDebugMode: () => void
  /** Toggle le mode debug */
  toggleDebugMode: () => void
  /** Définit une date simulée */
  setSimulatedDate: (date: string | null) => void
  /** Avance d'un jour dans la simulation */
  advanceOneDay: () => void
  /** Réinitialise la date à aujourd'hui */
  resetSimulatedDate: () => void
  /** Gestionnaire de tap pour activation via version */
  handleVersionTap: () => boolean
}

export type UseDebugModeReturn = UseDebugModeState & UseDebugModeActions

/**
 * Hook de gestion du mode debug.
 *
 * Permet d'activer un mode développeur caché via :
 * - 7 taps rapides sur le numéro de version dans les paramètres
 * - Le paramètre URL `?debug=true`
 * - La clé localStorage `doucement-debug`
 *
 * En mode debug, l'utilisateur peut :
 * - Simuler une date différente pour tester les progressions
 * - Charger des données de test
 * - Accéder à des informations de debug
 *
 * @returns {UseDebugModeReturn} État et actions pour le mode debug
 *
 * @example
 * ```tsx
 * function Settings() {
 *   const { isDebugMode, handleVersionTap, setSimulatedDate } = useDebugMode()
 *
 *   return (
 *     <div>
 *       <button onClick={handleVersionTap}>v1.0.0</button>
 *       {isDebugMode && (
 *         <DebugPanel onDateChange={setSimulatedDate} />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useDebugMode(): UseDebugModeReturn {
  const { data, updatePreferences } = useAppData()

  // Compteur de taps pour l'activation via version (useRef pour compatibilité React Strict Mode)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Vérifie si le mode debug est activé
  const isDebugMode = useMemo(() => {
    // Check URL param first (for development)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('debug') === 'true') {
        return true
      }
    }
    // Then check localStorage (independent of app data)
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem(DEBUG_STORAGE_KEY) === 'true') {
        return true
      }
    }
    // Finally check preferences
    return data.preferences.debugMode === true
  }, [data.preferences.debugMode])

  // Date simulée
  const simulatedDate = useMemo(() => {
    if (!isDebugMode) return null
    return data.preferences.simulatedDate || null
  }, [isDebugMode, data.preferences.simulatedDate])

  // Date effective (simulée ou réelle)
  const effectiveDate = useMemo(() => {
    if (simulatedDate) {
      return simulatedDate
    }
    return getCurrentDate()
  }, [simulatedDate])

  // Active le mode debug
  const enableDebugMode = useCallback(() => {
    localStorage.setItem(DEBUG_STORAGE_KEY, 'true')
    updatePreferences({ debugMode: true })
  }, [updatePreferences])

  // Désactive le mode debug
  const disableDebugMode = useCallback(() => {
    localStorage.removeItem(DEBUG_STORAGE_KEY)
    updatePreferences({ debugMode: false, simulatedDate: null })
  }, [updatePreferences])

  // Toggle le mode debug
  const toggleDebugMode = useCallback(() => {
    if (isDebugMode) {
      disableDebugMode()
    } else {
      enableDebugMode()
    }
  }, [isDebugMode, enableDebugMode, disableDebugMode])

  // Définit une date simulée
  const setSimulatedDate = useCallback(
    (date: string | null) => {
      if (!isDebugMode) return
      updatePreferences({ simulatedDate: date })
    },
    [isDebugMode, updatePreferences]
  )

  // Avance d'un jour
  const advanceOneDay = useCallback(() => {
    if (!isDebugMode) return
    const baseDate = simulatedDate || getCurrentDate()
    const newDate = addDays(baseDate, 1)
    updatePreferences({ simulatedDate: newDate })
  }, [isDebugMode, simulatedDate, updatePreferences])

  // Réinitialise la date simulée
  const resetSimulatedDate = useCallback(() => {
    updatePreferences({ simulatedDate: null })
  }, [updatePreferences])

  // Gestionnaire de tap pour activation via version
  const handleVersionTap = useCallback((): boolean => {
    tapCountRef.current++

    // Réinitialise le timer
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current)
    }

    // Démarre un nouveau timer
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0
    }, TAP_TIMEOUT)

    // Vérifie si on a atteint le nombre de taps requis
    if (tapCountRef.current >= TAPS_REQUIRED) {
      tapCountRef.current = 0
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current)
        tapTimerRef.current = null
      }
      toggleDebugMode()
      return true
    }

    return false
  }, [toggleDebugMode])

  // Expose l'API debug sur window en mode debug
  useEffect(() => {
    if (isDebugMode && typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__DOUCEMENT_DEBUG__ = {
        getData: () => data,
        isDebugMode: () => isDebugMode,
        getSimulatedDate: () => simulatedDate,
        getEffectiveDate: () => effectiveDate,
        setSimulatedDate,
        resetSimulatedDate,
        advanceOneDay,
        disable: disableDebugMode,
      }
    } else if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__DOUCEMENT_DEBUG__
    }

    return () => {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).__DOUCEMENT_DEBUG__
      }
    }
  }, [
    isDebugMode,
    data,
    simulatedDate,
    effectiveDate,
    setSimulatedDate,
    resetSimulatedDate,
    advanceOneDay,
    disableDebugMode,
  ])

  return {
    isDebugMode,
    simulatedDate,
    effectiveDate,
    enableDebugMode,
    disableDebugMode,
    toggleDebugMode,
    setSimulatedDate,
    advanceOneDay,
    resetSimulatedDate,
    handleVersionTap,
  }
}
