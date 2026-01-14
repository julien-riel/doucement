/**
 * StepFirstCheckIn - Optional first check-in after habit creation
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../../hooks'
import { FirstCheckInPrompt } from '../../../components/habits'
import { calculateTargetDose } from '../../../services/progression'
import { getCurrentDate } from '../../../utils'
import type { Habit } from '../../../types'

/**
 * Step for the first check-in after habit creation
 * Note: This step gets the created habit from useAppData since the context
 * may not have access to it directly after creation.
 */
export function StepFirstCheckIn() {
  const navigate = useNavigate()
  const { habits, addEntry } = useAppData()
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null)

  // Get the most recently created habit
  useEffect(() => {
    if (habits.length > 0) {
      const sortedByCreation = [...habits].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setCreatedHabit(sortedByCreation[0])
    }
  }, [habits])

  const handleResponse = (actualValue: number | null) => {
    if (actualValue !== null && createdHabit) {
      const today = getCurrentDate()
      const targetDose = calculateTargetDose(createdHabit, today)
      addEntry({
        habitId: createdHabit.id,
        date: today,
        targetDose,
        actualValue,
      })
    }
    navigate('/')
  }

  if (!createdHabit) {
    return null
  }

  return (
    <div className="step-first-checkin">
      <FirstCheckInPrompt habit={createdHabit} onResponse={handleResponse} />
    </div>
  )
}
