/**
 * Tests pour useChronometer hook
 * Teste la logique commune de chronométrage avec persistance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChronometer } from './useChronometer'
import * as timerStorage from '../services/timerStorage'

// Mock timerStorage
vi.mock('../services/timerStorage', () => ({
  getTimerState: vi.fn(),
  saveTimerState: vi.fn(),
  removeTimerState: vi.fn(),
}))

describe('useChronometer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(timerStorage.getTimerState).mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultOptions = {
    habitId: 'habit-1',
    date: '2026-01-15',
  }

  describe('État initial', () => {
    it('démarre avec les valeurs par défaut', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      expect(result.current.elapsedSeconds).toBe(0)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(false)
    })

    it('utilise initialValue si fourni', () => {
      const { result } = renderHook(() => useChronometer({ ...defaultOptions, initialValue: 60 }))

      expect(result.current.elapsedSeconds).toBe(60)
      expect(result.current.hasStarted).toBe(true)
    })
  })

  describe('Start/Pause/Stop', () => {
    it('démarre le chronomètre', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })

      expect(result.current.isRunning).toBe(true)
      expect(result.current.hasStarted).toBe(true)
      expect(timerStorage.saveTimerState).toHaveBeenCalledWith(
        expect.objectContaining({ isRunning: true })
      )
    })

    it('met en pause et sauvegarde', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })
      act(() => {
        result.current.pause()
      })

      expect(result.current.isRunning).toBe(false)
      expect(timerStorage.saveTimerState).toHaveBeenLastCalledWith(
        expect.objectContaining({ isRunning: false })
      )
    })

    it('arrête et notifie onStop', () => {
      const onStop = vi.fn()
      const { result } = renderHook(() => useChronometer({ ...defaultOptions, onStop }))

      act(() => {
        result.current.start()
      })
      act(() => {
        result.current.stop()
      })

      expect(result.current.isRunning).toBe(false)
      expect(onStop).toHaveBeenCalledWith(expect.any(Number))
      expect(timerStorage.removeTimerState).toHaveBeenCalledWith('habit-1', '2026-01-15')
    })

    it('ne démarre pas si déjà en cours', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })

      vi.mocked(timerStorage.saveTimerState).mockClear()

      act(() => {
        result.current.start()
      })

      expect(timerStorage.saveTimerState).not.toHaveBeenCalled()
    })

    it('ne met pas en pause si pas en cours', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      vi.mocked(timerStorage.saveTimerState).mockClear()

      act(() => {
        result.current.pause()
      })

      expect(timerStorage.saveTimerState).not.toHaveBeenCalled()
    })
  })

  describe('Reset', () => {
    it('réinitialise complètement', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })
      act(() => {
        result.current.reset()
      })

      expect(result.current.elapsedSeconds).toBe(0)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(false)
      expect(timerStorage.removeTimerState).toHaveBeenCalledWith('habit-1', '2026-01-15')
    })
  })

  describe("Restauration d'état", () => {
    it('restaure un état en pause', () => {
      vi.mocked(timerStorage.getTimerState).mockReturnValue({
        habitId: 'habit-1',
        date: '2026-01-15',
        startedAt: new Date().toISOString(),
        accumulatedSeconds: 120,
        isRunning: false,
      })

      const { result } = renderHook(() => useChronometer(defaultOptions))

      expect(result.current.elapsedSeconds).toBe(120)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(true)
    })

    it('restaure un état en cours et recalcule le temps écoulé', () => {
      const startedAt = new Date(Date.now() - 30000).toISOString() // 30s ago

      vi.mocked(timerStorage.getTimerState).mockReturnValue({
        habitId: 'habit-1',
        date: '2026-01-15',
        startedAt,
        accumulatedSeconds: 10,
        isRunning: true,
      })

      const { result } = renderHook(() => useChronometer(defaultOptions))

      expect(result.current.isRunning).toBe(true)
      expect(result.current.hasStarted).toBe(true)
      // 10 accumulated + 30 elapsed since = 40
      expect(result.current.elapsedSeconds).toBe(40)
    })
  })

  describe('Comptage du temps', () => {
    it('incrémente le temps quand en cours', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })

      // Avancer de 5 secondes
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(5)
    })

    it('accumule le temps après pause et reprise', () => {
      const { result } = renderHook(() => useChronometer(defaultOptions))

      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      act(() => {
        result.current.pause()
      })

      const afterPause = result.current.elapsedSeconds

      act(() => {
        result.current.start()
      })
      act(() => {
        vi.advanceTimersByTime(2000)
      })
      act(() => {
        result.current.pause()
      })

      expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(afterPause + 2)
    })
  })
})
