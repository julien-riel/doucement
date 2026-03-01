/**
 * Tests unitaires du hook useCelebrations
 * Couvre la détection, le check-in et le marquage des jalons
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCelebrations } from './useCelebrations'
import type { Habit, DailyEntry } from '../types'
import type { Milestone, MilestonesState } from '../types/statistics'

// ============================================================================
// FIXTURES
// ============================================================================

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Push-ups',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'reps',
    progression: { mode: 'absolute', value: 1, period: 'weekly' },
    createdAt: '2026-01-01',
    archivedAt: null,
    targetValue: 50,
    ...overrides,
  }
}

function createMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    habitId: 'habit-1',
    level: 25,
    reachedAt: '2026-01-15',
    celebrated: false,
    ...overrides,
  }
}

function createEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: 'entry-1',
    habitId: 'habit-1',
    date: '2026-01-15',
    targetDose: 10,
    actualValue: 10,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    ...overrides,
  }
}

// ============================================================================
// INITIAL STATE TESTS
// ============================================================================

describe('useCelebrations', () => {
  describe('état initial', () => {
    it('initialise avec un état vide par défaut', () => {
      const { result } = renderHook(() => useCelebrations())

      expect(result.current.currentMilestone).toBeNull()
      expect(result.current.currentHabit).toBeNull()
      expect(result.current.isModalOpen).toBe(false)
      expect(result.current.uncelebratedMilestones).toEqual([])
    })

    it('initialise avec des milestones existants', () => {
      const initialMilestones: MilestonesState = {
        milestones: [
          createMilestone({ level: 25, celebrated: true }),
          createMilestone({ level: 50, celebrated: false }),
        ],
      }

      const { result } = renderHook(() => useCelebrations({ initialMilestones }))

      expect(result.current.uncelebratedMilestones).toHaveLength(1)
      expect(result.current.uncelebratedMilestones[0].level).toBe(50)
    })
  })

  // ============================================================================
  // SHOW/CLOSE CELEBRATION TESTS
  // ============================================================================

  describe('showCelebration', () => {
    it('ouvre la modale avec le bon jalon et habitude', () => {
      const { result } = renderHook(() => useCelebrations())
      const habit = createHabit()
      const milestone = createMilestone({ level: 50 })

      act(() => {
        result.current.showCelebration(milestone, habit)
      })

      expect(result.current.isModalOpen).toBe(true)
      expect(result.current.currentMilestone).toEqual(milestone)
      expect(result.current.currentHabit).toEqual(habit)
    })
  })

  describe('closeCelebration', () => {
    it('ferme la modale et marque le jalon comme célébré', () => {
      const onMilestonesUpdate = vi.fn()
      const initialMilestones: MilestonesState = {
        milestones: [createMilestone({ level: 25, celebrated: false })],
      }

      const { result } = renderHook(() =>
        useCelebrations({ initialMilestones, onMilestonesUpdate })
      )

      const habit = createHabit()
      const milestone = createMilestone({ level: 25 })

      // Ouvrir puis fermer
      act(() => {
        result.current.showCelebration(milestone, habit)
      })

      act(() => {
        result.current.closeCelebration()
      })

      expect(result.current.isModalOpen).toBe(false)
      expect(result.current.currentMilestone).toBeNull()
      expect(result.current.currentHabit).toBeNull()

      // Vérifier que onMilestonesUpdate a été appelé avec le milestone marqué célébré
      expect(onMilestonesUpdate).toHaveBeenCalled()
      const updatedState =
        onMilestonesUpdate.mock.calls[onMilestonesUpdate.mock.calls.length - 1][0]
      expect(updatedState.milestones[0].celebrated).toBe(true)
    })

    it('ne fait rien si aucun jalon courant', () => {
      const onMilestonesUpdate = vi.fn()
      const { result } = renderHook(() => useCelebrations({ onMilestonesUpdate }))

      act(() => {
        result.current.closeCelebration()
      })

      expect(result.current.isModalOpen).toBe(false)
      // onMilestonesUpdate n'est pas appelé quand il n'y a pas de milestone courant
      expect(onMilestonesUpdate).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // CHECK MILESTONES AFTER CHECK-IN TESTS
  // ============================================================================

  describe('checkMilestonesAfterCheckIn', () => {
    it('détecte un nouveau jalon après un check-in', () => {
      const onMilestonesUpdate = vi.fn()
      const { result } = renderHook(() => useCelebrations({ onMilestonesUpdate }))

      const habit = createHabit({
        direction: 'increase',
        startValue: 0,
        targetValue: 100,
      })

      // De 20 à 30 -> franchit le seuil 25%
      let milestone: Milestone | null = null
      act(() => {
        milestone = result.current.checkMilestonesAfterCheckIn(habit, 20, 30)
      })

      expect(milestone).not.toBeNull()
      expect(milestone!.level).toBe(25)
      expect(milestone!.habitId).toBe(habit.id)
      expect(milestone!.celebrated).toBe(false)
    })

    it('retourne null si aucun jalon franchi', () => {
      const { result } = renderHook(() => useCelebrations())

      const habit = createHabit({
        direction: 'increase',
        startValue: 0,
        targetValue: 100,
      })

      // De 10 à 15 -> pas de seuil franchi
      let milestone: Milestone | null = null
      act(() => {
        milestone = result.current.checkMilestonesAfterCheckIn(habit, 10, 15)
      })

      expect(milestone).toBeNull()
    })

    it('retourne null pour habitude sans targetValue', () => {
      const { result } = renderHook(() => useCelebrations())

      const habit = createHabit({ targetValue: undefined })

      let milestone: Milestone | null = null
      act(() => {
        milestone = result.current.checkMilestonesAfterCheckIn(habit, 10, 30)
      })

      expect(milestone).toBeNull()
    })

    it('ne détecte pas un jalon déjà enregistré', () => {
      const initialMilestones: MilestonesState = {
        milestones: [createMilestone({ level: 25, celebrated: true })],
      }

      const { result } = renderHook(() => useCelebrations({ initialMilestones }))

      const habit = createHabit({
        direction: 'increase',
        startValue: 0,
        targetValue: 100,
      })

      // De 20 à 30 -> 25% déjà enregistré
      let milestone: Milestone | null = null
      act(() => {
        milestone = result.current.checkMilestonesAfterCheckIn(habit, 20, 30)
      })

      expect(milestone).toBeNull()
    })

    it('détecte le plus haut jalon franchi quand plusieurs sont franchis', () => {
      const { result } = renderHook(() => useCelebrations())

      const habit = createHabit({
        direction: 'increase',
        startValue: 0,
        targetValue: 100,
      })

      // De 10 à 60 -> franchit 25% et 50%, retourne le plus haut
      let milestone: Milestone | null = null
      act(() => {
        milestone = result.current.checkMilestonesAfterCheckIn(habit, 10, 60)
      })

      expect(milestone).not.toBeNull()
      expect(milestone!.level).toBe(50)
    })
  })

  // ============================================================================
  // DETECT ALL NEW MILESTONES TESTS
  // ============================================================================

  describe('detectAllNewMilestones', () => {
    it('détecte les jalons pour plusieurs habitudes', () => {
      const onMilestonesUpdate = vi.fn()
      const { result } = renderHook(() => useCelebrations({ onMilestonesUpdate }))

      const habits = [
        createHabit({
          id: 'h1',
          startValue: 0,
          targetValue: 100,
          direction: 'increase',
        }),
        createHabit({
          id: 'h2',
          startValue: 0,
          targetValue: 40,
          direction: 'increase',
        }),
      ]

      const entries: DailyEntry[] = [
        createEntry({ habitId: 'h1', date: '2026-01-15', actualValue: 30 }),
        createEntry({ habitId: 'h2', date: '2026-01-15', actualValue: 25 }),
      ]

      let newMilestones: Milestone[] = []
      act(() => {
        newMilestones = result.current.detectAllNewMilestones(habits, entries)
      })

      // h1: 30/100 = 30% -> 25% atteint
      // h2: 25/40 = 62.5% -> 25% et 50% atteints
      expect(newMilestones.length).toBeGreaterThanOrEqual(3)
      expect(onMilestonesUpdate).toHaveBeenCalled()
    })

    it('ignore les habitudes sans targetValue', () => {
      const { result } = renderHook(() => useCelebrations())

      const habits = [createHabit({ id: 'h1', targetValue: undefined })]

      const entries: DailyEntry[] = [createEntry({ habitId: 'h1', actualValue: 30 })]

      let newMilestones: Milestone[] = []
      act(() => {
        newMilestones = result.current.detectAllNewMilestones(habits, entries)
      })

      expect(newMilestones).toHaveLength(0)
    })

    it('ignore les habitudes sans entrées', () => {
      const { result } = renderHook(() => useCelebrations())

      const habits = [createHabit({ id: 'h1', startValue: 0, targetValue: 100 })]

      let newMilestones: Milestone[] = []
      act(() => {
        newMilestones = result.current.detectAllNewMilestones(habits, [])
      })

      expect(newMilestones).toHaveLength(0)
    })

    it('ne duplique pas les jalons existants', () => {
      const initialMilestones: MilestonesState = {
        milestones: [createMilestone({ habitId: 'h1', level: 25 })],
      }

      const { result } = renderHook(() => useCelebrations({ initialMilestones }))

      const habits = [
        createHabit({
          id: 'h1',
          startValue: 0,
          targetValue: 100,
          direction: 'increase',
        }),
      ]

      const entries: DailyEntry[] = [createEntry({ habitId: 'h1', actualValue: 30 })]

      let newMilestones: Milestone[] = []
      act(() => {
        newMilestones = result.current.detectAllNewMilestones(habits, entries)
      })

      // 25% déjà enregistré, pas de nouveau milestone
      expect(newMilestones).toHaveLength(0)
    })
  })

  // ============================================================================
  // GET MILESTONES STATE TESTS
  // ============================================================================

  describe('getMilestonesState', () => {
    it('retourne l état actuel des jalons', () => {
      const initialMilestones: MilestonesState = {
        milestones: [createMilestone({ level: 25 })],
      }

      const { result } = renderHook(() => useCelebrations({ initialMilestones }))

      const state = result.current.getMilestonesState()
      expect(state.milestones).toHaveLength(1)
      expect(state.milestones[0].level).toBe(25)
    })
  })
})
