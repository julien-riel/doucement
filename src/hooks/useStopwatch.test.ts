/**
 * Tests pour useStopwatch hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStopwatch } from './useStopwatch'
import * as timerStorage from '../services/timerStorage'

// Mock timerStorage
vi.mock('../services/timerStorage', () => ({
  getTimerState: vi.fn(),
  saveTimerState: vi.fn(),
  removeTimerState: vi.fn(),
}))

describe('useStopwatch', () => {
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
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      expect(result.current.elapsedSeconds).toBe(0)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(false)
    })

    it('utilise initialValue si fourni', () => {
      const { result } = renderHook(() => useStopwatch({ ...defaultOptions, initialValue: 60 }))

      expect(result.current.elapsedSeconds).toBe(60)
      expect(result.current.hasStarted).toBe(true)
    })

    it('restaure un état sauvegardé en pause', () => {
      vi.mocked(timerStorage.getTimerState).mockReturnValue({
        habitId: 'habit-1',
        date: '2026-01-15',
        startedAt: new Date().toISOString(),
        accumulatedSeconds: 120,
        isRunning: false,
      })

      const { result } = renderHook(() => useStopwatch(defaultOptions))

      expect(result.current.elapsedSeconds).toBe(120)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(true)
    })

    it('restaure et reprend un chrono qui était en cours', () => {
      const startedAt = new Date(Date.now() - 30000).toISOString() // 30 secondes ago

      vi.mocked(timerStorage.getTimerState).mockReturnValue({
        habitId: 'habit-1',
        date: '2026-01-15',
        startedAt,
        accumulatedSeconds: 60, // 60 secondes accumulées avant
        isRunning: true,
      })

      const { result } = renderHook(() => useStopwatch(defaultOptions))

      // 60 secondes accumulées + 30 secondes écoulées depuis startedAt
      expect(result.current.elapsedSeconds).toBe(90)
      expect(result.current.isRunning).toBe(true)
    })
  })

  describe('start()', () => {
    it('démarre le chronomètre', () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      expect(result.current.isRunning).toBe(true)
      expect(result.current.hasStarted).toBe(true)
    })

    it("sauvegarde l'état au démarrage", () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      expect(timerStorage.saveTimerState).toHaveBeenCalledWith(
        expect.objectContaining({
          habitId: 'habit-1',
          date: '2026-01-15',
          isRunning: true,
        })
      )
    })

    it('ne fait rien si déjà en cours', () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      vi.clearAllMocks()

      act(() => {
        result.current.start()
      })

      expect(timerStorage.saveTimerState).not.toHaveBeenCalled()
    })
  })

  describe('Mise à jour du temps', () => {
    it('incrémente le temps écoulé', () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      expect(result.current.elapsedSeconds).toBe(0)

      // Avancer de 5 secondes (avec plusieurs ticks pour la boucle de mise à jour)
      act(() => {
        vi.advanceTimersByTime(5100)
      })

      // Le temps devrait être mis à jour
      expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(5)
    })
  })

  describe('pause()', () => {
    it('met en pause le chronomètre', async () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      act(() => {
        result.current.pause()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(true)
    })

    it("sauvegarde l'état à la pause", async () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      vi.clearAllMocks()

      act(() => {
        result.current.pause()
      })

      expect(timerStorage.saveTimerState).toHaveBeenCalledWith(
        expect.objectContaining({
          isRunning: false,
        })
      )
    })

    it('ne fait rien si pas en cours', () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.pause()
      })

      expect(timerStorage.saveTimerState).not.toHaveBeenCalled()
    })
  })

  describe('stop()', () => {
    it('arrête le chronomètre et appelle onStop', async () => {
      const onStop = vi.fn()
      const { result } = renderHook(() => useStopwatch({ ...defaultOptions, onStop }))

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      act(() => {
        result.current.stop()
      })

      expect(result.current.isRunning).toBe(false)
      expect(onStop).toHaveBeenCalledWith(expect.any(Number))
    })

    it("supprime l'état persisté", () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.stop()
      })

      expect(timerStorage.removeTimerState).toHaveBeenCalledWith('habit-1', '2026-01-15')
    })
  })

  describe('reset()', () => {
    it('réinitialise complètement le chronomètre', async () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.elapsedSeconds).toBe(0)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.hasStarted).toBe(false)
    })

    it("supprime l'état persisté", () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.reset()
      })

      expect(timerStorage.removeTimerState).toHaveBeenCalledWith('habit-1', '2026-01-15')
    })
  })

  describe('Persistance', () => {
    it("sauvegarde l'état avant de quitter la page", () => {
      const { result } = renderHook(() => useStopwatch(defaultOptions))

      act(() => {
        result.current.start()
      })

      vi.clearAllMocks()

      // Simuler beforeunload
      act(() => {
        window.dispatchEvent(new Event('beforeunload'))
      })

      expect(timerStorage.saveTimerState).toHaveBeenCalled()
    })
  })
})
