/**
 * Utilitaires pour le slider avec mapping emoji
 *
 * Fonctions pour déterminer quel emoji afficher selon
 * la valeur sélectionnée et la configuration des plages.
 */

import { EmojiRange, SliderConfig } from '../types'

/** Emoji par défaut si aucune plage ne correspond */
const DEFAULT_EMOJI = '😐'

/**
 * Détermine l'emoji à afficher selon la valeur et la configuration
 *
 * @param value - La valeur actuelle du slider
 * @param config - Configuration du slider avec les plages emoji
 * @returns L'emoji correspondant à la plage, ou l'emoji par défaut
 *
 * @example
 * const config: SliderConfig = {
 *   min: 1,
 *   max: 10,
 *   step: 1,
 *   emojiRanges: [
 *     { from: 1, to: 3, emoji: '😢' },
 *     { from: 4, to: 6, emoji: '😐' },
 *     { from: 7, to: 10, emoji: '😊' },
 *   ]
 * }
 *
 * getEmojiForValue(2, config)  // '😢'
 * getEmojiForValue(5, config)  // '😐'
 * getEmojiForValue(9, config)  // '😊'
 */
export function getEmojiForValue(value: number, config?: SliderConfig): string {
  // Si pas de config ou pas de ranges, retourner l'emoji par défaut
  if (!config?.emojiRanges || config.emojiRanges.length === 0) {
    return DEFAULT_EMOJI
  }

  // Chercher la plage qui contient la valeur
  for (const range of config.emojiRanges) {
    if (value >= range.from && value <= range.to) {
      return range.emoji
    }
  }

  // Si aucune plage ne correspond, retourner l'emoji par défaut
  return DEFAULT_EMOJI
}

/**
 * Vérifie si la configuration du slider est valide
 *
 * @param config - Configuration du slider à valider
 * @returns true si la configuration est valide
 */
export function isValidSliderConfig(config?: SliderConfig): boolean {
  if (!config) {
    return false
  }

  // Vérifier les valeurs min/max/step
  if (typeof config.min !== 'number' || typeof config.max !== 'number') {
    return false
  }

  if (config.min >= config.max) {
    return false
  }

  if (config.step !== undefined && config.step <= 0) {
    return false
  }

  // Si des ranges sont définies, vérifier qu'elles sont valides
  if (config.emojiRanges) {
    for (const range of config.emojiRanges) {
      if (!isValidEmojiRange(range)) {
        return false
      }
    }
  }

  return true
}

/**
 * Vérifie si une plage emoji est valide
 */
function isValidEmojiRange(range: EmojiRange): boolean {
  return (
    typeof range.from === 'number' &&
    typeof range.to === 'number' &&
    range.from <= range.to &&
    typeof range.emoji === 'string' &&
    range.emoji.length > 0
  )
}

/**
 * Configuration par défaut pour un slider d'humeur (1-10)
 */
export const DEFAULT_MOOD_SLIDER_CONFIG: SliderConfig = {
  min: 1,
  max: 10,
  step: 1,
  emojiRanges: [
    { from: 1, to: 3, emoji: '😢' },
    { from: 4, to: 5, emoji: '😕' },
    { from: 6, to: 7, emoji: '😊' },
    { from: 8, to: 10, emoji: '😄' },
  ],
}

/**
 * Configuration par défaut pour un slider d'énergie (1-10)
 */
export const DEFAULT_ENERGY_SLIDER_CONFIG: SliderConfig = {
  min: 1,
  max: 10,
  step: 1,
  emojiRanges: [
    { from: 1, to: 2, emoji: '😴' },
    { from: 3, to: 4, emoji: '🥱' },
    { from: 5, to: 6, emoji: '😐' },
    { from: 7, to: 8, emoji: '⚡' },
    { from: 9, to: 10, emoji: '🔥' },
  ],
}

/**
 * Configuration par défaut pour un slider de douleur (0-10)
 */
export const DEFAULT_PAIN_SLIDER_CONFIG: SliderConfig = {
  min: 0,
  max: 10,
  step: 1,
  emojiRanges: [
    { from: 0, to: 0, emoji: '😊' },
    { from: 1, to: 3, emoji: '🙂' },
    { from: 4, to: 6, emoji: '😐' },
    { from: 7, to: 8, emoji: '😣' },
    { from: 9, to: 10, emoji: '😖' },
  ],
}
