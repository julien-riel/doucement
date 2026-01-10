/**
 * Doucement - Types pour les release notes
 * Structure des données de versioning et changelog
 */

// ============================================================================
// RELEASE NOTES TYPES
// ============================================================================

/**
 * Point fort d'une release
 */
export interface ReleaseHighlight {
  /** Nom de l'emoji (sans les :) - sera converti en emoji unicode */
  emoji: string
  /** Description courte du changement */
  text: string
}

/**
 * Structure d'une release
 */
export interface Release {
  /** Version semver (ex: "1.1.0") */
  version: string
  /** Date de publication (YYYY-MM-DD) */
  date: string
  /** Titre de la release */
  title: string
  /** Points forts de la release */
  highlights: ReleaseHighlight[]
  /** Description détaillée optionnelle */
  details?: string
}

/**
 * Structure du fichier release-notes.json
 */
export interface ReleaseNotes {
  /** Version actuelle de l'application */
  currentVersion: string
  /** Historique des releases (plus récente en premier) */
  releases: Release[]
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Clé localStorage pour stocker la dernière version vue
 */
export const LAST_SEEN_VERSION_KEY = 'doucement_last_seen_version'

/**
 * Map des noms d'emoji vers les caractères unicode
 */
export const EMOJI_MAP: Record<string, string> = {
  sparkles: '\u2728',
  bell: '\uD83D\uDD14',
  rocket: '\uD83D\uDE80',
  star: '\u2B50',
  gift: '\uD83C\uDF81',
  heart: '\u2764\uFE0F',
  check: '\u2705',
  zap: '\u26A1',
  paint: '\uD83C\uDFA8',
  bug: '\uD83D\uDC1B',
  tools: '\uD83D\uDEE0\uFE0F',
  chart: '\uD83D\uDCCA',
  lock: '\uD83D\uDD12',
  sun: '\u2600\uFE0F',
  moon: '\uD83C\uDF19',
  calendar: '\uD83D\uDCC5',
  target: '\uD83C\uDFAF',
  muscle: '\uD83D\uDCAA',
  leaf: '\uD83C\uDF3F',
  fire: '\uD83D\uDD25',
}
