/**
 * Doucement - Hook pour les release notes
 * Gère l'affichage automatique des nouveautés après mise à jour
 */

import { useState, useEffect, useCallback } from 'react'
import { Release, ReleaseNotes } from '../types/releaseNotes'
import {
  loadReleaseNotes,
  hasNewVersion,
  setLastSeenVersion,
  getLatestRelease,
  isNewUser,
} from '../services/versioning'

interface UseWhatsNewReturn {
  /** Indique si la modale doit être affichée */
  showModal: boolean
  /** La release à afficher */
  release: Release | null
  /** Version actuelle de l'app */
  currentVersion: string | null
  /** Ferme la modale et marque la version comme vue */
  dismissModal: () => void
  /** Force l'affichage de la modale (pour Settings) */
  showWhatsNew: () => void
  /** Indique si les données sont en cours de chargement */
  isLoading: boolean
}

/**
 * Hook pour gérer l'affichage automatique des release notes après mise à jour
 */
export function useWhatsNew(): UseWhatsNewReturn {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotes | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Charge les release notes au montage
  useEffect(() => {
    let mounted = true

    async function init() {
      const notes = await loadReleaseNotes()
      if (!mounted) return

      setReleaseNotes(notes)
      setIsLoading(false)

      if (notes) {
        // Pour les nouveaux utilisateurs, on enregistre la version sans afficher la modale
        if (isNewUser()) {
          setLastSeenVersion(notes.currentVersion)
        }
        // Pour les utilisateurs existants, on vérifie s'il y a une nouvelle version
        else if (hasNewVersion(notes.currentVersion)) {
          setShowModal(true)
        }
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  const release = releaseNotes ? getLatestRelease(releaseNotes.releases) ?? null : null

  const dismissModal = useCallback(() => {
    setShowModal(false)
    if (releaseNotes) {
      setLastSeenVersion(releaseNotes.currentVersion)
    }
  }, [releaseNotes])

  const showWhatsNew = useCallback(() => {
    if (releaseNotes && release) {
      setShowModal(true)
    }
  }, [releaseNotes, release])

  return {
    showModal,
    release,
    currentVersion: releaseNotes?.currentVersion ?? null,
    dismissModal,
    showWhatsNew,
    isLoading,
  }
}
