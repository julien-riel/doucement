/**
 * Tests for useHabitForm hook
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHabitForm } from './useHabitForm'
import type { Habit } from '../types'
import { INITIAL_FORM_STATE } from '../types/habitForm'

// Helper to create a test habit
const createTestHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'test-habit-1',
  name: 'Test Habit',
  emoji: '💪',
  unit: 'répétitions',
  direction: 'increase',
  startValue: 10,
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

describe('useHabitForm', () => {
  describe('Create mode', () => {
    it('initializes with default form state', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      expect(result.current.form).toEqual(INITIAL_FORM_STATE)
    })

    it('returns isValid false for empty form', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      expect(result.current.isValid).toBe(false)
    })

    it('returns isValid true when name and unit are filled', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('name', 'My Habit')
        result.current.updateField('unit', 'minutes')
      })

      expect(result.current.isValid).toBe(true)
    })

    it('updates a single field correctly', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('name', 'Push-ups')
      })

      expect(result.current.form.name).toBe('Push-ups')
      expect(result.current.form.emoji).toBe(INITIAL_FORM_STATE.emoji)
    })

    it('resets form to initial state', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('name', 'Changed')
        result.current.updateField('emoji', '🎯')
      })

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.form).toEqual(INITIAL_FORM_STATE)
    })

    it('always reports hasChanges as true in create mode', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      expect(result.current.hasChanges).toBe(true)
    })
  })

  describe('Edit mode', () => {
    it('initializes with habit values', () => {
      const habit = createTestHabit({ name: 'Morning Run', emoji: '🏃' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      expect(result.current.form.name).toBe('Morning Run')
      expect(result.current.form.emoji).toBe('🏃')
      expect(result.current.form.direction).toBe('increase')
      expect(result.current.form.startValue).toBe(10)
    })

    it('returns hasChanges false when form matches initial habit', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      expect(result.current.hasChanges).toBe(false)
    })

    it('detects name change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('name', 'New Name')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects emoji change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('emoji', '🎯')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects direction change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('direction', 'maintain')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects progression changes', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('progressionValue', 10)
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects tracking mode change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('trackingMode', 'simple')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects tracking frequency change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('trackingFrequency', 'weekly')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects entry mode change', () => {
      const habit = createTestHabit()
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('entryMode', 'cumulative')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects identity statement change', () => {
      const habit = createTestHabit({ identityStatement: 'Initial' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('identityStatement', 'Changed')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects implementation intention trigger change', () => {
      const habit = createTestHabit({
        implementationIntention: { trigger: 'After breakfast' },
      })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('implementationIntention', {
          trigger: 'After lunch',
        })
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects time of day change', () => {
      const habit = createTestHabit({ timeOfDay: 'morning' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('timeOfDay', 'evening')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('detects description change', () => {
      const habit = createTestHabit({ description: 'Initial description' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('description', 'New description')
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it('resets form to initial habit values', () => {
      const habit = createTestHabit({ name: 'Original' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('name', 'Changed')
      })

      expect(result.current.form.name).toBe('Changed')

      act(() => {
        result.current.resetForm()
      })

      expect(result.current.form.name).toBe('Original')
    })
  })

  describe('Validation', () => {
    it('reports name error when empty', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      expect(result.current.errors.name).toBe('Le nom est requis')
    })

    it('reports unit error when empty', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      expect(result.current.errors.unit).toBe("L'unité est requise")
    })

    it('clears name error when name is provided', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('name', 'My Habit')
      })

      expect(result.current.errors.name).toBeUndefined()
    })

    it('reports startValue error when negative', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('startValue', -5)
      })

      expect(result.current.errors.startValue).toBe('La valeur de départ doit être positive')
    })

    it('reports progressionValue error when zero', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('direction', 'increase')
        result.current.updateField('progressionValue', 0)
      })

      expect(result.current.errors.progressionValue).toBe('La progression doit être positive')
    })

    it('does not report progressionValue error for maintain direction', () => {
      const { result } = renderHook(() => useHabitForm({ mode: 'create' }))

      act(() => {
        result.current.updateField('direction', 'maintain')
        result.current.updateField('progressionValue', 0)
      })

      expect(result.current.errors.progressionValue).toBeUndefined()
    })
  })

  describe('Edge cases', () => {
    it('handles habit without progression config', () => {
      const habit = createTestHabit({ progression: null, direction: 'maintain' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      expect(result.current.form.progressionMode).toBe('percentage')
      expect(result.current.form.progressionValue).toBe(5)
    })

    it('handles habit without optional fields', () => {
      const habit = createTestHabit({
        implementationIntention: undefined,
        identityStatement: undefined,
        timeOfDay: undefined,
        anchorHabitId: undefined,
      })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      expect(result.current.form.implementationIntention).toEqual({})
      expect(result.current.form.identityStatement).toBe('')
      expect(result.current.form.timeOfDay).toBeNull()
      expect(result.current.form.anchorHabitId).toBeUndefined()
    })

    it('trims whitespace when checking changes for name', () => {
      const habit = createTestHabit({ name: 'Test' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('name', 'Test ')
      })

      expect(result.current.hasChanges).toBe(false)
    })

    it('trims whitespace when checking changes for unit', () => {
      const habit = createTestHabit({ unit: 'minutes' })
      const { result } = renderHook(() => useHabitForm({ mode: 'edit', initialHabit: habit }))

      act(() => {
        result.current.updateField('unit', ' minutes ')
      })

      expect(result.current.hasChanges).toBe(false)
    })
  })
})
