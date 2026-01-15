/**
 * Tests for useTimer hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'

// Mock timerStorage
vi.mock('../services/timerStorage', () => ({
  getTimerState: vi.fn(() => null),
  saveTimerState: vi.fn(),
  removeTimerState: vi.fn(),
}))

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct values', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    expect(result.current.elapsedSeconds).toBe(0)
    expect(result.current.remainingSeconds).toBe(120)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.hasStarted).toBe(false)
    expect(result.current.isTargetReached).toBe(false)
  })

  it('should start the timer', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    act(() => {
      result.current.start()
    })

    expect(result.current.isRunning).toBe(true)
    expect(result.current.hasStarted).toBe(true)
  })

  it('should count down correctly', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    act(() => {
      result.current.start()
    })

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(result.current.elapsedSeconds).toBe(30)
    expect(result.current.remainingSeconds).toBe(90)
    expect(result.current.isTargetReached).toBe(false)
  })

  it('should detect when target is reached', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 60,
      })
    )

    act(() => {
      result.current.start()
    })

    // Advance time by 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.isTargetReached).toBe(true)
    expect(result.current.remainingSeconds).toBe(0)
  })

  it('should show negative remaining seconds for overtime', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 60,
      })
    )

    act(() => {
      result.current.start()
    })

    // Advance time by 75 seconds (15 seconds overtime)
    act(() => {
      vi.advanceTimersByTime(75000)
    })

    expect(result.current.elapsedSeconds).toBe(75)
    expect(result.current.remainingSeconds).toBe(-15)
    expect(result.current.isTargetReached).toBe(true)
  })

  it('should pause the timer', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    act(() => {
      result.current.pause()
    })

    expect(result.current.isRunning).toBe(false)
    const pausedTime = result.current.elapsedSeconds

    // Advance time but timer should not change
    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(result.current.elapsedSeconds).toBe(pausedTime)
  })

  it('should resume after pause', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    act(() => {
      result.current.pause()
    })

    const pausedTime = result.current.elapsedSeconds

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    expect(result.current.elapsedSeconds).toBe(pausedTime + 30)
  })

  it('should stop and call onStop with elapsed time', () => {
    const onStop = vi.fn()
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
        onStop,
      })
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(45000)
    })

    act(() => {
      result.current.stop()
    })

    expect(onStop).toHaveBeenCalledWith(45)
    expect(result.current.isRunning).toBe(false)
  })

  it('should reset the timer', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
      })
    )

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.elapsedSeconds).toBe(0)
    expect(result.current.remainingSeconds).toBe(120)
    expect(result.current.isRunning).toBe(false)
    expect(result.current.hasStarted).toBe(false)
  })

  it('should initialize with initial value', () => {
    const { result } = renderHook(() =>
      useTimer({
        habitId: 'test-habit',
        date: '2026-01-15',
        targetSeconds: 120,
        initialValue: 30,
      })
    )

    expect(result.current.elapsedSeconds).toBe(30)
    expect(result.current.remainingSeconds).toBe(90)
    expect(result.current.hasStarted).toBe(true)
  })
})
