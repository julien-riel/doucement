/**
 * Doucement - Service de gestion des versions
 * Détection des mises à jour et gestion des release notes
 */

import { ReleaseNotes, Release, LAST_SEEN_VERSION_KEY } from '../types/releaseNotes'

/**
 * Compare deux versions semver
 * @returns -1 si v1 < v2, 0 si égales, 1 si v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }
  return 0
}

/**
 * Récupère la dernière version vue par l'utilisateur
 */
export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY)
  } catch {
    return null
  }
}

/**
 * Enregistre la version comme vue
 */
export function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version)
  } catch {
    console.error('Impossible de sauvegarder la version vue')
  }
}

/**
 * Charge les release notes depuis le fichier JSON
 */
export async function loadReleaseNotes(): Promise<ReleaseNotes | null> {
  try {
    const response = await fetch('/release-notes.json')
    if (!response.ok) return null
    return await response.json()
  } catch {
    console.error('Erreur lors du chargement des release notes')
    return null
  }
}

/**
 * Vérifie si une nouvelle version est disponible
 * Retourne false pour les nouveaux utilisateurs (pas de version précédente)
 */
export function hasNewVersion(currentVersion: string): boolean {
  const lastSeen = getLastSeenVersion()
  // Nouvel utilisateur : pas de modale
  if (!lastSeen) return false
  return compareVersions(currentVersion, lastSeen) > 0
}

/**
 * Vérifie si c'est un nouvel utilisateur (première visite)
 */
export function isNewUser(): boolean {
  return getLastSeenVersion() === null
}

/**
 * Récupère la release correspondant à une version
 */
export function getReleaseByVersion(releases: Release[], version: string): Release | undefined {
  return releases.find((r) => r.version === version)
}

/**
 * Récupère la dernière release
 */
export function getLatestRelease(releases: Release[]): Release | undefined {
  return releases[0] // Le fichier JSON est ordonné du plus récent au plus ancien
}

/**
 * Incrémente une version semver
 */
export function bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const parts = version.split('.').map(Number)
  const [major, minor, patch] = parts

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}
