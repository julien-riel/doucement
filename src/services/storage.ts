/**
 * Service de stockage localStorage
 * Gestion du chargement et de la sauvegarde des données
 */

import { AppData, DEFAULT_APP_DATA, CURRENT_SCHEMA_VERSION } from '../types'

const STORAGE_KEY = 'doucement_data'

/**
 * Résultat d'une opération de stockage
 */
export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: StorageError
}

/**
 * Types d'erreurs de stockage
 */
export type StorageErrorType =
  | 'STORAGE_UNAVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Erreur de stockage
 */
export interface StorageError {
  type: StorageErrorType
  message: string
  originalError?: unknown
}

/**
 * Vérifie si localStorage est disponible
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__doucement_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Valide la structure basique des données chargées
 */
function isValidAppData(data: unknown): data is AppData {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>

  return (
    typeof obj.schemaVersion === 'number' &&
    Array.isArray(obj.habits) &&
    Array.isArray(obj.entries) &&
    typeof obj.preferences === 'object' &&
    obj.preferences !== null
  )
}

/**
 * Charge les données depuis localStorage
 */
export function loadData(): StorageResult<AppData> {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: {
        type: 'STORAGE_UNAVAILABLE',
        message: "localStorage n'est pas disponible sur ce navigateur",
      },
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return {
        success: true,
        data: { ...DEFAULT_APP_DATA },
      }
    }

    const parsed = JSON.parse(stored)

    if (!isValidAppData(parsed)) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Les données stockées ne correspondent pas au format attendu',
        },
      }
    }

    // Vérification de version pour migration future
    if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: `Version de schéma non supportée: ${parsed.schemaVersion}`,
        },
      }
    }

    return {
      success: true,
      data: parsed,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: {
          type: 'PARSE_ERROR',
          message: 'Les données stockées sont corrompues',
          originalError: error,
        },
      }
    }

    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'Erreur inattendue lors du chargement',
        originalError: error,
      },
    }
  }
}

/**
 * Sauvegarde les données dans localStorage
 */
export function saveData(data: AppData): StorageResult<void> {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: {
        type: 'STORAGE_UNAVAILABLE',
        message: "localStorage n'est pas disponible sur ce navigateur",
      },
    }
  }

  try {
    const json = JSON.stringify(data)
    localStorage.setItem(STORAGE_KEY, json)
    return { success: true }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: {
          type: 'QUOTA_EXCEEDED',
          message: "L'espace de stockage est plein",
          originalError: error,
        },
      }
    }

    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'Erreur inattendue lors de la sauvegarde',
        originalError: error,
      },
    }
  }
}

/**
 * Efface toutes les données stockées
 * Utilisation: reset de l'application ou tests
 */
export function clearData(): StorageResult<void> {
  if (!isLocalStorageAvailable()) {
    return {
      success: false,
      error: {
        type: 'STORAGE_UNAVAILABLE',
        message: "localStorage n'est pas disponible sur ce navigateur",
      },
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'UNKNOWN_ERROR',
        message: 'Erreur inattendue lors de la suppression',
        originalError: error,
      },
    }
  }
}
