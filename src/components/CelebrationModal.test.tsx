/**
 * Tests for CelebrationModal component
 * Covers: rendering, milestone display, confetti, keyboard interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CelebrationModal from './CelebrationModal'
import type { Milestone, MilestoneLevel } from '../types/statistics'

// Mock the milestones service
vi.mock('../services/milestones', () => ({
  getMilestoneMessage: (level: MilestoneLevel) => {
    const messages: Record<MilestoneLevel, string> = {
      25: 'Tu as fait un quart du chemin !',
      50: 'À mi-chemin !',
      75: 'Plus que 25% !',
      100: 'Tu as atteint ton objectif !',
    }
    return messages[level]
  },
  getMilestoneEmoji: (level: MilestoneLevel) => {
    const emojis: Record<MilestoneLevel, string> = {
      25: '🌱',
      50: '🌿',
      75: '🌳',
      100: '🏆',
    }
    return emojis[level]
  },
}))

// Create a mock milestone
const createMockMilestone = (level: MilestoneLevel): Milestone => ({
  level,
  reachedAt: '2026-01-13',
  habitId: 'habit-1',
  celebrated: false,
})

describe('CelebrationModal', () => {
  let mockOnClose: () => void

  beforeEach(() => {
    mockOnClose = vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={false}
          onClose={mockOnClose}
          milestone={createMockMilestone(25)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(container.querySelector('.celebration-modal')).toBeNull()
    })

    it('renders modal when isOpen is true', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(25)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByRole('dialog')).toBeDefined()
    })

    it('displays habit name with percentage', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText(/50% de ta cible Push-ups/)).toBeDefined()
    })

    it('displays habit emoji', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(25)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText('💪')).toBeDefined()
    })
  })

  // ============================================================================
  // MILESTONE LEVEL TITLES
  // ============================================================================

  describe('Milestone titles', () => {
    it('displays "Premier quart !" for 25% milestone', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(25)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText('Premier quart !')).toBeDefined()
    })

    it('displays "Mi-parcours !" for 50% milestone', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText('Mi-parcours !')).toBeDefined()
    })

    it('displays "Trois quarts !" for 75% milestone', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(75)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText('Trois quarts !')).toBeDefined()
    })

    it('displays "Objectif atteint !" for 100% milestone', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(100)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      expect(screen.getByText('Objectif atteint !')).toBeDefined()
    })
  })

  // ============================================================================
  // MILESTONE EMOJIS
  // ============================================================================

  describe('Milestone emojis', () => {
    const emojiTestCases: { level: MilestoneLevel; expectedEmoji: string }[] = [
      { level: 25, expectedEmoji: '🌱' },
      { level: 50, expectedEmoji: '🌿' },
      { level: 75, expectedEmoji: '🌳' },
      { level: 100, expectedEmoji: '🏆' },
    ]

    emojiTestCases.forEach(({ level, expectedEmoji }) => {
      it(`displays ${expectedEmoji} emoji for ${level}% milestone`, () => {
        render(
          <CelebrationModal
            isOpen={true}
            onClose={mockOnClose}
            milestone={createMockMilestone(level)}
            habitName="Push-ups"
            habitEmoji="💪"
          />
        )

        expect(screen.getByText(expectedEmoji)).toBeDefined()
      })
    })
  })

  // ============================================================================
  // PROGRESS BAR
  // ============================================================================

  describe('Progress bar', () => {
    it('renders progress bar with correct fill width', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const progressFill = container.querySelector('.celebration-progress-fill') as HTMLElement
      expect(progressFill.style.width).toBe('50%')
    })

    it('marks completed milestones in progress markers', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(75)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const markers = container.querySelectorAll('.celebration-progress-markers span')
      // 25%, 50%, 75% should be active
      expect(markers[0].classList.contains('active')).toBe(true) // 25%
      expect(markers[1].classList.contains('active')).toBe(true) // 50%
      expect(markers[2].classList.contains('active')).toBe(true) // 75%
      expect(markers[3].classList.contains('active')).toBe(false) // 100%
    })
  })

  // ============================================================================
  // CONFETTI
  // ============================================================================

  describe('Confetti', () => {
    it('renders confetti container when open', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      // The confetti layer should be rendered with aria-hidden for accessibility
      const confettiLayer = container.querySelector('.celebration-confetti')
      expect(confettiLayer).not.toBeNull()
      expect(confettiLayer?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  describe('Interactions', () => {
    it('calls onClose when clicking the "Continuer" button', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      fireEvent.click(screen.getByText('Continuer'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking the overlay', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const overlay = screen.getByRole('dialog')
      fireEvent.click(overlay)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when clicking the modal content', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const modalContent = container.querySelector('.celebration-modal') as HTMLElement
      fireEvent.click(modalContent)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('calls onClose when pressing Escape key', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-modal')).toBe('true')
    })

    it('has aria-labelledby pointing to the title', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBe('celebration-title')

      const title = document.getElementById('celebration-title')
      expect(title).not.toBeNull()
    })

    it('hides decorative elements from screen readers', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const confettiLayer = container.querySelector('.celebration-confetti')
      expect(confettiLayer?.getAttribute('aria-hidden')).toBe('true')

      const emojis = container.querySelectorAll('[aria-hidden="true"]')
      expect(emojis.length).toBeGreaterThan(1)
    })
  })

  // ============================================================================
  // TONE TESTS (encouraging language)
  // ============================================================================

  describe('Tone and language', () => {
    it('uses positive, encouraging language', () => {
      render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      // Should contain encouraging message from the milestone service
      expect(screen.getByText('À mi-chemin !')).toBeDefined()
    })

    it('does not contain negative vocabulary', () => {
      const { container } = render(
        <CelebrationModal
          isOpen={true}
          onClose={mockOnClose}
          milestone={createMockMilestone(50)}
          habitName="Push-ups"
          habitEmoji="💪"
        />
      )

      const text = container.textContent || ''
      const bannedWords = ['échec', 'raté', 'manqué', 'retard', 'insuffisant']

      for (const word of bannedWords) {
        expect(text.toLowerCase()).not.toContain(word)
      }
    })
  })
})
