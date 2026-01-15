/**
 * Tests pour les utilitaires du slider
 */

import { describe, it, expect } from 'vitest'
import {
  getEmojiForValue,
  isValidSliderConfig,
  DEFAULT_MOOD_SLIDER_CONFIG,
  DEFAULT_ENERGY_SLIDER_CONFIG,
  DEFAULT_PAIN_SLIDER_CONFIG,
} from './slider'
import { SliderConfig } from '../types'

describe('slider utilities', () => {
  describe('getEmojiForValue', () => {
    const moodConfig: SliderConfig = {
      min: 1,
      max: 10,
      step: 1,
      emojiRanges: [
        { from: 1, to: 3, emoji: '😢' },
        { from: 4, to: 6, emoji: '😐' },
        { from: 7, to: 10, emoji: '😊' },
      ],
    }

    it("retourne l'emoji correct pour une valeur dans une plage", () => {
      expect(getEmojiForValue(1, moodConfig)).toBe('😢')
      expect(getEmojiForValue(2, moodConfig)).toBe('😢')
      expect(getEmojiForValue(3, moodConfig)).toBe('😢')
    })

    it("retourne l'emoji correct pour une valeur au milieu", () => {
      expect(getEmojiForValue(4, moodConfig)).toBe('😐')
      expect(getEmojiForValue(5, moodConfig)).toBe('😐')
      expect(getEmojiForValue(6, moodConfig)).toBe('😐')
    })

    it("retourne l'emoji correct pour une valeur haute", () => {
      expect(getEmojiForValue(7, moodConfig)).toBe('😊')
      expect(getEmojiForValue(8, moodConfig)).toBe('😊')
      expect(getEmojiForValue(9, moodConfig)).toBe('😊')
      expect(getEmojiForValue(10, moodConfig)).toBe('😊')
    })

    it("retourne l'emoji par défaut si pas de config", () => {
      expect(getEmojiForValue(5, undefined)).toBe('😐')
    })

    it("retourne l'emoji par défaut si pas de ranges", () => {
      const configWithoutRanges: SliderConfig = {
        min: 1,
        max: 10,
        step: 1,
      }
      expect(getEmojiForValue(5, configWithoutRanges)).toBe('😐')
    })

    it("retourne l'emoji par défaut si ranges vide", () => {
      const configEmptyRanges: SliderConfig = {
        min: 1,
        max: 10,
        step: 1,
        emojiRanges: [],
      }
      expect(getEmojiForValue(5, configEmptyRanges)).toBe('😐')
    })

    it("retourne l'emoji par défaut si valeur hors plages", () => {
      expect(getEmojiForValue(0, moodConfig)).toBe('😐')
      expect(getEmojiForValue(11, moodConfig)).toBe('😐')
    })

    it('gère les valeurs aux bornes des plages', () => {
      expect(getEmojiForValue(3, moodConfig)).toBe('😢')
      expect(getEmojiForValue(4, moodConfig)).toBe('😐')
      expect(getEmojiForValue(6, moodConfig)).toBe('😐')
      expect(getEmojiForValue(7, moodConfig)).toBe('😊')
    })
  })

  describe('isValidSliderConfig', () => {
    it('valide une configuration correcte', () => {
      const validConfig: SliderConfig = {
        min: 0,
        max: 10,
        step: 1,
        emojiRanges: [
          { from: 0, to: 5, emoji: '😐' },
          { from: 6, to: 10, emoji: '😊' },
        ],
      }
      expect(isValidSliderConfig(validConfig)).toBe(true)
    })

    it('valide une configuration sans ranges', () => {
      const configNoRanges: SliderConfig = {
        min: 0,
        max: 10,
        step: 1,
      }
      expect(isValidSliderConfig(configNoRanges)).toBe(true)
    })

    it('rejette undefined', () => {
      expect(isValidSliderConfig(undefined)).toBe(false)
    })

    it('rejette si min >= max', () => {
      const invalidConfig: SliderConfig = {
        min: 10,
        max: 5,
        step: 1,
      }
      expect(isValidSliderConfig(invalidConfig)).toBe(false)
    })

    it('rejette si min === max', () => {
      const invalidConfig: SliderConfig = {
        min: 5,
        max: 5,
        step: 1,
      }
      expect(isValidSliderConfig(invalidConfig)).toBe(false)
    })

    it('rejette si step <= 0', () => {
      const invalidConfig: SliderConfig = {
        min: 0,
        max: 10,
        step: 0,
      }
      expect(isValidSliderConfig(invalidConfig)).toBe(false)

      const negativeStep: SliderConfig = {
        min: 0,
        max: 10,
        step: -1,
      }
      expect(isValidSliderConfig(negativeStep)).toBe(false)
    })

    it('rejette si une range est invalide (from > to)', () => {
      const invalidConfig: SliderConfig = {
        min: 0,
        max: 10,
        step: 1,
        emojiRanges: [{ from: 5, to: 3, emoji: '😐' }],
      }
      expect(isValidSliderConfig(invalidConfig)).toBe(false)
    })

    it('rejette si emoji est vide', () => {
      const invalidConfig: SliderConfig = {
        min: 0,
        max: 10,
        step: 1,
        emojiRanges: [{ from: 0, to: 10, emoji: '' }],
      }
      expect(isValidSliderConfig(invalidConfig)).toBe(false)
    })
  })

  describe('Default configs', () => {
    it('DEFAULT_MOOD_SLIDER_CONFIG est valide', () => {
      expect(isValidSliderConfig(DEFAULT_MOOD_SLIDER_CONFIG)).toBe(true)
    })

    it('DEFAULT_ENERGY_SLIDER_CONFIG est valide', () => {
      expect(isValidSliderConfig(DEFAULT_ENERGY_SLIDER_CONFIG)).toBe(true)
    })

    it('DEFAULT_PAIN_SLIDER_CONFIG est valide', () => {
      expect(isValidSliderConfig(DEFAULT_PAIN_SLIDER_CONFIG)).toBe(true)
    })

    it('mood config couvre toutes les valeurs 1-10', () => {
      for (let i = 1; i <= 10; i++) {
        const emoji = getEmojiForValue(i, DEFAULT_MOOD_SLIDER_CONFIG)
        expect(emoji).not.toBe('😐') // Ne devrait pas tomber sur le défaut
      }
    })

    it('pain config couvre toutes les valeurs 0-10', () => {
      for (let i = 0; i <= 10; i++) {
        const emoji = getEmojiForValue(i, DEFAULT_PAIN_SLIDER_CONFIG)
        expect(emoji.length).toBeGreaterThan(0)
      }
    })
  })
})
