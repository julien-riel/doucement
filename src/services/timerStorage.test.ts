/**
 * Tests unitaires pour le service timerStorage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  TIMER_STATES_KEY,
  loadTimerStates,
  saveTimerState,
  getTimerState,
  removeTimerState,
  removeTimerStatesForDate,
  removeTimerStatesForHabit,
  clearAllTimerStates,
} from './timerStorage'
import { TimerState } from '../types'

// Mock localStorage
const mockStorage: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key]
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  }),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('timerStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  const createTimerState = (overrides?: Partial<TimerState>): TimerState => ({
    habitId: 'habit-1',
    date: '2026-01-15',
    startedAt: '2026-01-15T10:00:00.000Z',
    accumulatedSeconds: 120,
    isRunning: true,
    ...overrides,
  })

  describe('loadTimerStates', () => {
    it("retourne un tableau vide si rien n'est stocké", () => {
      const result = loadTimerStates()
      expect(result).toEqual([])
    })

    it('retourne un tableau vide si les données sont invalides', () => {
      mockStorage[TIMER_STATES_KEY] = 'invalid json'
      const result = loadTimerStates()
      expect(result).toEqual([])
    })

    it('retourne un tableau vide si les données ne sont pas un tableau', () => {
      mockStorage[TIMER_STATES_KEY] = JSON.stringify({ not: 'array' })
      const result = loadTimerStates()
      expect(result).toEqual([])
    })

    it('charge les états valides', () => {
      const states = [createTimerState()]
      mockStorage[TIMER_STATES_KEY] = JSON.stringify(states)

      const result = loadTimerStates()
      expect(result).toEqual(states)
    })

    it('filtre les états invalides', () => {
      const validState = createTimerState()
      const invalidState = { habitId: 'habit-2' } // Missing required fields
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([validState, invalidState])

      const result = loadTimerStates()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(validState)
    })
  })

  describe('saveTimerState', () => {
    it('sauvegarde un nouvel état', () => {
      const state = createTimerState()
      saveTimerState(state)

      expect(localStorage.setItem).toHaveBeenCalledWith(TIMER_STATES_KEY, JSON.stringify([state]))
    })

    it('met à jour un état existant pour la même habitude et date', () => {
      const initialState = createTimerState({ accumulatedSeconds: 100 })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([initialState])

      const updatedState = createTimerState({ accumulatedSeconds: 200 })
      saveTimerState(updatedState)

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].accumulatedSeconds).toBe(200)
    })

    it('ajoute un état pour une habitude/date différente', () => {
      const state1 = createTimerState({ habitId: 'habit-1' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state1])

      const state2 = createTimerState({ habitId: 'habit-2' })
      saveTimerState(state2)

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(2)
    })
  })

  describe('getTimerState', () => {
    it("retourne undefined si aucun état n'existe", () => {
      const result = getTimerState('habit-1', '2026-01-15')
      expect(result).toBeUndefined()
    })

    it("retourne l'état correspondant", () => {
      const state = createTimerState()
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state])

      const result = getTimerState('habit-1', '2026-01-15')
      expect(result).toEqual(state)
    })

    it('retourne undefined si la date ne correspond pas', () => {
      const state = createTimerState({ date: '2026-01-14' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state])

      const result = getTimerState('habit-1', '2026-01-15')
      expect(result).toBeUndefined()
    })
  })

  describe('removeTimerState', () => {
    it('supprime un état spécifique', () => {
      const state1 = createTimerState({ habitId: 'habit-1' })
      const state2 = createTimerState({ habitId: 'habit-2' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state1, state2])

      removeTimerState('habit-1', '2026-01-15')

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].habitId).toBe('habit-2')
    })

    it("ne fait rien si l'état n'existe pas", () => {
      const state = createTimerState({ habitId: 'habit-1' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state])

      removeTimerState('habit-2', '2026-01-15')

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(1)
    })
  })

  describe('removeTimerStatesForDate', () => {
    it('supprime tous les états pour une date donnée', () => {
      const state1 = createTimerState({ habitId: 'habit-1', date: '2026-01-15' })
      const state2 = createTimerState({ habitId: 'habit-2', date: '2026-01-15' })
      const state3 = createTimerState({ habitId: 'habit-1', date: '2026-01-14' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state1, state2, state3])

      removeTimerStatesForDate('2026-01-15')

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].date).toBe('2026-01-14')
    })
  })

  describe('removeTimerStatesForHabit', () => {
    it('supprime tous les états pour une habitude donnée', () => {
      const state1 = createTimerState({ habitId: 'habit-1', date: '2026-01-15' })
      const state2 = createTimerState({ habitId: 'habit-1', date: '2026-01-14' })
      const state3 = createTimerState({ habitId: 'habit-2', date: '2026-01-15' })
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state1, state2, state3])

      removeTimerStatesForHabit('habit-1')

      const savedData = JSON.parse(mockStorage[TIMER_STATES_KEY])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].habitId).toBe('habit-2')
    })
  })

  describe('clearAllTimerStates', () => {
    it('efface tous les états', () => {
      const state = createTimerState()
      mockStorage[TIMER_STATES_KEY] = JSON.stringify([state])

      clearAllTimerStates()

      expect(localStorage.removeItem).toHaveBeenCalledWith(TIMER_STATES_KEY)
    })
  })
})
