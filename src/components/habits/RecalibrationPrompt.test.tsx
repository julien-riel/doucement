/**
 * Tests for RecalibrationPrompt component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecalibrationPrompt from './RecalibrationPrompt'
import type { Habit } from '../../types'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'recalibration.title': 'Tu as dépassé tes objectifs !',
        'recalibration.subtitle': 'Prêt·e à viser plus haut ?',
        'recalibration.description': 'Tu dépasses régulièrement ta dose cible.',
        'recalibration.levels.gentle.label': 'Progression douce',
        'recalibration.levels.gentle.desc': 'Une marche à la fois',
        'recalibration.levels.balanced.label': 'Progression équilibrée',
        'recalibration.levels.balanced.desc': 'Recommandé',
        'recalibration.levels.ambitious.label': 'Progression ambitieuse',
        'recalibration.levels.ambitious.desc': 'Pour les plus motivé·e·s',
        'recalibration.dismiss': 'Pas maintenant',
        'recalibration.confirm': 'Recalibrer',
        'recalibration.confirmMessage': `Ta nouvelle dose de départ passera de ${options?.oldValue} à ${options?.newValue} ${options?.unit}.`,
        'common.cancel': 'Annuler',
      }
      return translations[key] || key
    },
  }),
}))

// Mock getCurrentDate
vi.mock('../../utils', () => ({
  getCurrentDate: () => '2026-01-13',
}))

// Create a mock habit for testing
const createMockHabit = (overrides?: Partial<Habit>): Habit => ({
  id: 'habit-1',
  name: 'Push-ups',
  emoji: '💪',
  direction: 'increase',
  startValue: 10,
  unit: 'répétitions',
  progression: {
    mode: 'percentage',
    value: 5,
    period: 'weekly',
  },
  createdAt: '2026-01-01',
  archivedAt: null,
  ...overrides,
})

describe('RecalibrationPrompt', () => {
  let mockOnRecalibrate: ReturnType<typeof vi.fn>
  let mockOnDismiss: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnRecalibrate = vi.fn()
    mockOnDismiss = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('renders the component with title and subtitle', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      expect(screen.getByText('Tu as dépassé tes objectifs !')).toBeDefined()
      expect(screen.getByText('Prêt·e à viser plus haut ?')).toBeDefined()
    })

    it('renders all three recalibration level options', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      expect(screen.getByText('Progression douce')).toBeDefined()
      expect(screen.getByText('Progression équilibrée')).toBeDefined()
      expect(screen.getByText('Progression ambitieuse')).toBeDefined()
    })

    it('renders the dismiss button', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      expect(screen.getByText('Pas maintenant')).toBeDefined()
    })

    it('displays the celebration emoji', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      expect(screen.getByText('🎉')).toBeDefined()
    })
  })

  // ============================================================================
  // CALCULATION TESTS
  // ============================================================================

  describe('Value calculations', () => {
    it('calculates correct values for each level (startValue=10, target=20)', () => {
      const habit = createMockHabit({ startValue: 10 })

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={20}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // 50% of difference (10) = 5, so new value = 10 + 5 = 15
      expect(screen.getByText('15 répétitions')).toBeDefined()
      // 75% of difference (10) = 7.5 rounded to 8, so new value = 10 + 8 = 18
      expect(screen.getByText('18 répétitions')).toBeDefined()
      // 100% of difference (10) = 10, so new value = 10 + 10 = 20
      expect(screen.getByText('20 répétitions')).toBeDefined()
    })

    it('displays the habit unit with each value', () => {
      const habit = createMockHabit({ unit: 'minutes' })

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={20}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      const allMinutesText = screen.getAllByText(/minutes/)
      expect(allMinutesText.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // INTERACTION TESTS
  // ============================================================================

  describe('Interactions', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      fireEvent.click(screen.getByText('Pas maintenant'))

      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })

    it('shows confirmation view when a level is selected', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={20}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // Click on the balanced option
      fireEvent.click(screen.getByText('Progression équilibrée'))

      // Should show confirmation message
      expect(screen.getByText('Recalibrer')).toBeDefined()
      expect(screen.getByText('Annuler')).toBeDefined()
    })

    it('returns to level selection when cancel is clicked in confirmation', () => {
      const habit = createMockHabit()

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={20}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // Select a level
      fireEvent.click(screen.getByText('Progression douce'))

      // Click cancel
      fireEvent.click(screen.getByText('Annuler'))

      // Should show levels again
      expect(screen.getByText('Progression douce')).toBeDefined()
      expect(screen.getByText('Progression équilibrée')).toBeDefined()
    })

    it('calls onRecalibrate with correct values when confirmed', () => {
      const habit = createMockHabit({ startValue: 10 })

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={20}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // Select the balanced option (75%)
      fireEvent.click(screen.getByText('Progression équilibrée'))

      // Confirm
      fireEvent.click(screen.getByText('Recalibrer'))

      expect(mockOnRecalibrate).toHaveBeenCalledTimes(1)

      // Check the new start value (10 + 75% of 10 = 18)
      const [newStartValue, record] = mockOnRecalibrate.mock.calls[0]
      expect(newStartValue).toBe(18)

      // Check the record
      expect(record).toMatchObject({
        date: '2026-01-13',
        previousStartValue: 10,
        newStartValue: 18,
        previousStartDate: '2026-01-01',
        level: 0.75,
      })
    })
  })

  // ============================================================================
  // TONE TESTS (non-judgmental language)
  // ============================================================================

  describe('Tone and language', () => {
    it('uses encouraging language (no negative words)', () => {
      const habit = createMockHabit()

      const { container } = render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      const text = container.textContent || ''

      // Should not contain negative words
      const bannedWords = ['échec', 'raté', 'manqué', 'retard', 'insuffisant', 'mal', 'faible']
      for (const word of bannedWords) {
        expect(text.toLowerCase()).not.toContain(word)
      }
    })

    it('uses celebratory language for achievement', () => {
      const habit = createMockHabit()

      const { container } = render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={15}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      const text = container.textContent || ''

      // Should contain positive words
      expect(text.toLowerCase()).toContain('dépassé')
      expect(text.toLowerCase()).toContain('objectifs')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge cases', () => {
    it('handles when startValue equals currentTargetDose', () => {
      const habit = createMockHabit({ startValue: 10 })

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={10}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // All levels should show 10 (no difference to apply)
      const values = screen.getAllByText('10 répétitions')
      expect(values.length).toBe(3)
    })

    it('handles large values correctly', () => {
      const habit = createMockHabit({ startValue: 100 })

      render(
        <RecalibrationPrompt
          habit={habit}
          currentTargetDose={200}
          onRecalibrate={mockOnRecalibrate}
          onDismiss={mockOnDismiss}
        />
      )

      // 50% = 150, 75% = 175, 100% = 200
      expect(screen.getByText('150 répétitions')).toBeDefined()
      expect(screen.getByText('175 répétitions')).toBeDefined()
      expect(screen.getByText('200 répétitions')).toBeDefined()
    })
  })
})
