/**
 * Tests for HabitCard component
 * Covers: rendering, status display, check-in interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HabitCard from './HabitCard'
import type { Habit, CompletionStatus } from '../../types'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, unknown> = {
        'habitCard.progressionIncrease': `+${options?.diff} depuis ${options?.startValue}`,
        'habitCard.progressionDecrease': `-${options?.diff}`,
        'habits.thisWeek': 'cette semaine',
        'habitStacking.afterLabel': 'Après :',
        'decreaseMessages.zero': ['Journée parfaite !', 'Zéro. Bravo !'],
        'decreaseMessages.zeroBadge': 'Journée sans',
        'decreaseMessages.successBadge': 'En contrôle',
        'checkIn.exceeded': 'Dépassé !',
        'checkIn.completed': 'Complété',
        'checkIn.cumulative': '(cumul)',
      }
      return translations[key] ?? key
    },
  }),
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
  trackingMode: 'detailed',
  trackingFrequency: 'daily',
  entryMode: 'replace',
  ...overrides,
})

describe('HabitCard', () => {
  let mockOnCheckIn: (habitId: string, value: number) => void

  beforeEach(() => {
    mockOnCheckIn = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('renders habit name and emoji', () => {
      const habit = createMockHabit()

      render(<HabitCard habit={habit} targetDose={12} status="pending" onCheckIn={mockOnCheckIn} />)

      expect(screen.getByText('Push-ups')).toBeDefined()
      expect(screen.getByText('💪')).toBeDefined()
    })

    it('renders target dose with unit', () => {
      const habit = createMockHabit()

      render(<HabitCard habit={habit} targetDose={12} status="pending" onCheckIn={mockOnCheckIn} />)

      expect(screen.getByText('12')).toBeDefined()
      expect(screen.getByText('répétitions')).toBeDefined()
    })

    it('renders description when provided', () => {
      const habit = createMockHabit({ description: 'Muscler le haut du corps' })

      render(<HabitCard habit={habit} targetDose={12} status="pending" onCheckIn={mockOnCheckIn} />)

      expect(screen.getByText('Muscler le haut du corps')).toBeDefined()
    })

    it('does not render description when not provided', () => {
      const habit = createMockHabit({ description: undefined })

      const { container } = render(
        <HabitCard habit={habit} targetDose={12} status="pending" onCheckIn={mockOnCheckIn} />
      )

      expect(container.querySelector('.habit-card__description')).toBeNull()
    })
  })

  // ============================================================================
  // STATUS DISPLAY TESTS
  // ============================================================================

  describe('Status display', () => {
    it('displays current value when provided', () => {
      const habit = createMockHabit()

      render(
        <HabitCard
          habit={habit}
          targetDose={12}
          currentValue={8}
          status="partial"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText(/8 \/ 12/)).toBeDefined()
    })

    it('displays completed badge when status is completed', () => {
      const habit = createMockHabit()

      render(
        <HabitCard
          habit={habit}
          targetDose={12}
          currentValue={12}
          status="completed"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('Complété')).toBeDefined()
    })

    it('displays exceeded badge for increase habits', () => {
      const habit = createMockHabit({ direction: 'increase' })

      render(
        <HabitCard
          habit={habit}
          targetDose={12}
          currentValue={15}
          status="exceeded"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('Dépassé !')).toBeDefined()
    })

    it('displays success badge for decrease habits that exceeded (did less)', () => {
      const habit = createMockHabit({ direction: 'decrease' })

      render(
        <HabitCard
          habit={habit}
          targetDose={5}
          currentValue={3}
          status="exceeded"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('En contrôle')).toBeDefined()
    })
  })

  // ============================================================================
  // DECREASE ZERO MESSAGE TESTS
  // ============================================================================

  describe('Decrease habits - zero value', () => {
    it('displays zero victory message when decrease habit has value 0', () => {
      const habit = createMockHabit({ direction: 'decrease' })

      render(
        <HabitCard
          habit={habit}
          targetDose={5}
          currentValue={0}
          status="exceeded"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('Journée sans')).toBeDefined()
    })

    it('does not display zero message for increase habits', () => {
      const habit = createMockHabit({ direction: 'increase' })

      render(
        <HabitCard
          habit={habit}
          targetDose={10}
          currentValue={0}
          status="pending"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.queryByText('Journée sans')).toBeNull()
    })
  })

  // ============================================================================
  // WEEKLY HABITS TESTS
  // ============================================================================

  describe('Weekly habits', () => {
    it('displays weekly progress for weekly habits', () => {
      const habit = createMockHabit({ trackingFrequency: 'weekly' })

      render(
        <HabitCard
          habit={habit}
          targetDose={1}
          status="pending"
          weeklyProgress={{
            completedDays: 3,
            weeklyTarget: 5,
          }}
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('3/5')).toBeDefined()
      expect(screen.getByText('cette semaine')).toBeDefined()
    })
  })

  // ============================================================================
  // HABIT STACKING TESTS
  // ============================================================================

  describe('Habit stacking', () => {
    it('displays anchor habit name when provided', () => {
      const habit = createMockHabit()

      render(
        <HabitCard
          habit={habit}
          targetDose={12}
          status="pending"
          anchorHabitName="Café du matin"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('Après :')).toBeDefined()
      expect(screen.getByText('Café du matin')).toBeDefined()
    })
  })

  // ============================================================================
  // IMPLEMENTATION INTENTION TESTS
  // ============================================================================

  describe('Implementation intention', () => {
    it('displays when-where info when habit has implementation intention', () => {
      const habit = createMockHabit({
        implementationIntention: {
          trigger: 'Après le réveil',
          location: 'Dans le salon',
        },
      })

      render(<HabitCard habit={habit} targetDose={12} status="pending" onCheckIn={mockOnCheckIn} />)

      // The buildIntentionText function should format this
      expect(screen.getByText(/Après le réveil/)).toBeDefined()
    })
  })

  // ============================================================================
  // CHECK-IN INTERACTION TESTS
  // ============================================================================

  describe('Check-in interactions', () => {
    it('calls onCheckIn when check-in button is clicked', () => {
      const habit = createMockHabit({ trackingMode: 'simple' })

      render(<HabitCard habit={habit} targetDose={10} status="pending" onCheckIn={mockOnCheckIn} />)

      // Find and click the check-in button (for simple mode)
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])

      expect(mockOnCheckIn).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // CUMULATIVE MODE TESTS
  // ============================================================================

  describe('Cumulative mode', () => {
    it('displays cumulative indicator for cumulative entry mode', () => {
      const habit = createMockHabit({ entryMode: 'cumulative' })

      render(
        <HabitCard
          habit={habit}
          targetDose={100}
          currentValue={50}
          status="partial"
          onCheckIn={mockOnCheckIn}
        />
      )

      expect(screen.getByText('(cumul)')).toBeDefined()
    })
  })

  // ============================================================================
  // CARD VARIANT TESTS
  // ============================================================================

  describe('Card variants', () => {
    const testCases: { status: CompletionStatus; expectedClass: string }[] = [
      { status: 'pending', expectedClass: 'habit-card--pending' },
      { status: 'partial', expectedClass: 'habit-card--partial' },
      { status: 'completed', expectedClass: 'habit-card--completed' },
      { status: 'exceeded', expectedClass: 'habit-card--exceeded' },
    ]

    testCases.forEach(({ status, expectedClass }) => {
      it(`applies ${expectedClass} class for ${status} status`, () => {
        const habit = createMockHabit()

        const { container } = render(
          <HabitCard
            habit={habit}
            targetDose={12}
            currentValue={status === 'pending' ? undefined : 10}
            status={status}
            onCheckIn={mockOnCheckIn}
          />
        )

        expect(container.querySelector(`.${expectedClass}`)).not.toBeNull()
      })
    })
  })

  // ============================================================================
  // PROGRESSION MESSAGE TESTS
  // ============================================================================

  describe('Progression messages', () => {
    it('displays progression message for increase habits', () => {
      const habit = createMockHabit({ direction: 'increase', startValue: 10 })

      render(<HabitCard habit={habit} targetDose={15} status="pending" onCheckIn={mockOnCheckIn} />)

      // The progression message should show the difference from start
      expect(screen.getByText(/\+5 depuis 10/)).toBeDefined()
    })

    it('displays progression message for decrease habits', () => {
      const habit = createMockHabit({ direction: 'decrease', startValue: 10 })

      render(<HabitCard habit={habit} targetDose={5} status="pending" onCheckIn={mockOnCheckIn} />)

      expect(screen.getByText(/-5/)).toBeDefined()
    })

    it('does not display progression message for maintain habits', () => {
      const habit = createMockHabit({ direction: 'maintain', progression: null })

      const { container } = render(
        <HabitCard habit={habit} targetDose={10} status="pending" onCheckIn={mockOnCheckIn} />
      )

      expect(container.querySelector('.habit-card__progression')).toBeNull()
    })
  })
})
