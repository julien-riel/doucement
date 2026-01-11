/**
 * Utilitaires de gestion des dates
 * Toutes les dates sont au format YYYY-MM-DD en heure locale
 */

/**
 * Retourne la date actuelle au format YYYY-MM-DD en heure locale
 * IMPORTANT: N'utilise PAS toISOString() qui convertit en UTC
 */
export function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formate une date en français
 * @param dateStr Date au format YYYY-MM-DD
 * @returns Date formatée (ex: "Vendredi 10 janvier")
 */
export function formatDateFr(dateStr: string): string {
  // Parse la date en tant que date locale (pas UTC)
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Ajoute des jours à une date
 * @param dateStr Date au format YYYY-MM-DD
 * @param days Nombre de jours à ajouter (peut être négatif)
 * @returns Nouvelle date au format YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Calcule la différence en jours entre deux dates
 * @param dateStr1 Première date au format YYYY-MM-DD
 * @param dateStr2 Deuxième date au format YYYY-MM-DD
 * @returns Nombre de jours (positif si dateStr2 > dateStr1)
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number)
  const [y2, m2, d2] = dateStr2.split('-').map(Number)
  const date1 = new Date(y1, m1 - 1, d1)
  const date2 = new Date(y2, m2 - 1, d2)
  const diffTime = date2.getTime() - date1.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}
