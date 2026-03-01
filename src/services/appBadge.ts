/**
 * Service App Badge
 * Utilise navigator.setAppBadge() pour afficher le nombre de doses restantes
 * sur l'icône de l'app installée (PWA).
 */

/**
 * Vérifie si l'API App Badge est supportée par le navigateur
 */
function isAppBadgeSupported(): boolean {
  return 'setAppBadge' in navigator
}

/**
 * Met à jour le badge de l'app avec le nombre de doses restantes
 * @param remainingCount Nombre de doses non complétées
 */
export async function updateAppBadge(remainingCount: number): Promise<void> {
  if (!isAppBadgeSupported()) return

  try {
    if (remainingCount > 0) {
      await navigator.setAppBadge(remainingCount)
    } else {
      await navigator.clearAppBadge()
    }
  } catch {
    // Silently ignore — badge API may fail in some contexts (e.g., not installed as PWA)
  }
}

/**
 * Efface le badge de l'app
 */
export async function clearAppBadge(): Promise<void> {
  if (!isAppBadgeSupported()) return

  try {
    await navigator.clearAppBadge()
  } catch {
    // Silently ignore
  }
}
