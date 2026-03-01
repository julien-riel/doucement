/**
 * Tests pour le service de détection des jalons
 */

import { describe, it, expect } from 'vitest'
import { Habit } from '../types'
import { Milestone } from '../types/statistics'
import {
  calculateProgressPercentage,
  getReachedLevels,
  detectNewMilestones,
  getUncelebratedMilestones,
  getMilestonesForHabit,
  markMilestoneAsCelebrated,
  addMilestones,
  getMilestoneMessage,
  getMilestoneEmoji,
  checkForNewMilestoneAfterCheckIn,
} from './milestones'

// Helpers pour créer des fixtures de test
function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-habit',
    name: 'Test Habit',
    emoji: '💪',
    direction: 'increase',
    startValue: 10,
    unit: 'reps',
    progression: { mode: 'absolute', value: 1, period: 'weekly' },
    trackingMode: 'detailed',
    targetValue: 50,
    createdAt: '2026-01-01',
    archivedAt: null,
    ...overrides,
  } as Habit
}

function createMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    habitId: 'test-habit',
    level: 25,
    reachedAt: '2026-01-10',
    celebrated: false,
    ...overrides,
  }
}

describe('calculateProgressPercentage', () => {
  describe('habitudes en augmentation (increase)', () => {
    it('calcule 0% au point de départ', () => {
      const habit = createHabit({ startValue: 10, targetValue: 50 })
      expect(calculateProgressPercentage(habit, 10)).toBe(0)
    })

    it('calcule 25% à un quart du chemin', () => {
      const habit = createHabit({ startValue: 10, targetValue: 50 })
      // 10 -> 50 = 40 unités de progression
      // 25% = 10 unités de plus = valeur 20
      expect(calculateProgressPercentage(habit, 20)).toBe(25)
    })

    it('calcule 50% à mi-chemin', () => {
      const habit = createHabit({ startValue: 10, targetValue: 50 })
      expect(calculateProgressPercentage(habit, 30)).toBe(50)
    })

    it('calcule 100% à la cible', () => {
      const habit = createHabit({ startValue: 10, targetValue: 50 })
      expect(calculateProgressPercentage(habit, 50)).toBe(100)
    })

    it('calcule plus de 100% si dépassé', () => {
      const habit = createHabit({ startValue: 10, targetValue: 50 })
      expect(calculateProgressPercentage(habit, 60)).toBe(125)
    })

    it('retourne 100 si startValue >= targetValue et valeur atteinte', () => {
      const habit = createHabit({ startValue: 50, targetValue: 50 })
      expect(calculateProgressPercentage(habit, 50)).toBe(100)
    })
  })

  describe('habitudes en diminution (decrease)', () => {
    it('calcule 0% au point de départ', () => {
      const habit = createHabit({ direction: 'decrease', startValue: 50, targetValue: 10 })
      expect(calculateProgressPercentage(habit, 50)).toBe(0)
    })

    it('calcule 25% à un quart du chemin', () => {
      const habit = createHabit({ direction: 'decrease', startValue: 50, targetValue: 10 })
      // 50 -> 10 = 40 unités de réduction
      // 25% = 10 unités de moins = valeur 40
      expect(calculateProgressPercentage(habit, 40)).toBe(25)
    })

    it('calcule 50% à mi-chemin', () => {
      const habit = createHabit({ direction: 'decrease', startValue: 50, targetValue: 10 })
      expect(calculateProgressPercentage(habit, 30)).toBe(50)
    })

    it('calcule 100% à la cible', () => {
      const habit = createHabit({ direction: 'decrease', startValue: 50, targetValue: 10 })
      expect(calculateProgressPercentage(habit, 10)).toBe(100)
    })

    it('calcule plus de 100% si dépassé', () => {
      const habit = createHabit({ direction: 'decrease', startValue: 50, targetValue: 10 })
      expect(calculateProgressPercentage(habit, 5)).toBe(112.5)
    })
  })

  describe('cas limites', () => {
    it('retourne 0 sans targetValue', () => {
      const habit = createHabit({ targetValue: undefined })
      expect(calculateProgressPercentage(habit, 30)).toBe(0)
    })

    it('retourne 0 pour maintain', () => {
      const habit = createHabit({ direction: 'maintain', targetValue: 50 })
      expect(calculateProgressPercentage(habit, 50)).toBe(0)
    })
  })
})

describe('getReachedLevels', () => {
  it('retourne un tableau vide pour 0%', () => {
    expect(getReachedLevels(0)).toEqual([])
  })

  it('retourne [25] pour 25%', () => {
    expect(getReachedLevels(25)).toEqual([25])
  })

  it('retourne [25] pour 30%', () => {
    expect(getReachedLevels(30)).toEqual([25])
  })

  it('retourne [25, 50] pour 50%', () => {
    expect(getReachedLevels(50)).toEqual([25, 50])
  })

  it('retourne [25, 50, 75] pour 75%', () => {
    expect(getReachedLevels(75)).toEqual([25, 50, 75])
  })

  it('retourne tous les niveaux pour 100%', () => {
    expect(getReachedLevels(100)).toEqual([25, 50, 75, 100])
  })

  it('retourne tous les niveaux pour plus de 100%', () => {
    expect(getReachedLevels(120)).toEqual([25, 50, 75, 100])
  })
})

describe('detectNewMilestones', () => {
  it('détecte tous les jalons atteints pour une nouvelle habitude', () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    const currentValue = 30 // 50% de progression

    const newMilestones = detectNewMilestones(habit, currentValue, [])

    expect(newMilestones).toHaveLength(2)
    expect(newMilestones[0].level).toBe(25)
    expect(newMilestones[1].level).toBe(50)
    expect(newMilestones[0].celebrated).toBe(false)
  })

  it("n'inclut pas les jalons déjà atteints", () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    const currentValue = 30 // 50%
    const existingMilestones = [createMilestone({ habitId: habit.id, level: 25 })]

    const newMilestones = detectNewMilestones(habit, currentValue, existingMilestones)

    expect(newMilestones).toHaveLength(1)
    expect(newMilestones[0].level).toBe(50)
  })

  it('retourne un tableau vide si tous les jalons sont déjà atteints', () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    const currentValue = 30 // 50%
    const existingMilestones = [
      createMilestone({ habitId: habit.id, level: 25 }),
      createMilestone({ habitId: habit.id, level: 50 }),
    ]

    const newMilestones = detectNewMilestones(habit, currentValue, existingMilestones)

    expect(newMilestones).toHaveLength(0)
  })

  it('retourne un tableau vide sans targetValue', () => {
    const habit = createHabit({ targetValue: undefined })

    const newMilestones = detectNewMilestones(habit, 30, [])

    expect(newMilestones).toHaveLength(0)
  })
})

describe('getUncelebratedMilestones', () => {
  it('retourne les jalons non célébrés pour une habitude', () => {
    const milestones = [
      createMilestone({ habitId: 'habit-1', level: 25, celebrated: false }),
      createMilestone({ habitId: 'habit-1', level: 50, celebrated: true }),
      createMilestone({ habitId: 'habit-2', level: 25, celebrated: false }),
    ]

    const uncelebrated = getUncelebratedMilestones('habit-1', milestones)

    expect(uncelebrated).toHaveLength(1)
    expect(uncelebrated[0].level).toBe(25)
  })

  it('retourne un tableau vide si tous sont célébrés', () => {
    const milestones = [createMilestone({ habitId: 'habit-1', level: 25, celebrated: true })]

    const uncelebrated = getUncelebratedMilestones('habit-1', milestones)

    expect(uncelebrated).toHaveLength(0)
  })
})

describe('getMilestonesForHabit', () => {
  it("retourne les jalons d'une habitude triés par niveau", () => {
    const milestones = [
      createMilestone({ habitId: 'habit-1', level: 75 }),
      createMilestone({ habitId: 'habit-1', level: 25 }),
      createMilestone({ habitId: 'habit-2', level: 50 }),
      createMilestone({ habitId: 'habit-1', level: 50 }),
    ]

    const habitMilestones = getMilestonesForHabit('habit-1', milestones)

    expect(habitMilestones).toHaveLength(3)
    expect(habitMilestones[0].level).toBe(25)
    expect(habitMilestones[1].level).toBe(50)
    expect(habitMilestones[2].level).toBe(75)
  })
})

describe('markMilestoneAsCelebrated', () => {
  it('marque le jalon correspondant comme célébré', () => {
    const milestones = [
      createMilestone({ habitId: 'habit-1', level: 25, celebrated: false }),
      createMilestone({ habitId: 'habit-1', level: 50, celebrated: false }),
    ]

    const updated = markMilestoneAsCelebrated(milestones, 'habit-1', 25)

    expect(updated[0].celebrated).toBe(true)
    expect(updated[1].celebrated).toBe(false)
  })

  it('ne modifie pas les autres habitudes', () => {
    const milestones = [
      createMilestone({ habitId: 'habit-1', level: 25, celebrated: false }),
      createMilestone({ habitId: 'habit-2', level: 25, celebrated: false }),
    ]

    const updated = markMilestoneAsCelebrated(milestones, 'habit-1', 25)

    expect(updated[0].celebrated).toBe(true)
    expect(updated[1].celebrated).toBe(false)
  })
})

describe('addMilestones', () => {
  it('ajoute les nouveaux jalons à la liste existante', () => {
    const state = { milestones: [createMilestone({ level: 25 })] }
    const newMilestones = [createMilestone({ level: 50 })]

    const updated = addMilestones(state, newMilestones)

    expect(updated.milestones).toHaveLength(2)
    expect(updated.milestones[1].level).toBe(50)
  })
})

describe('getMilestoneMessage', () => {
  it('retourne le bon message pour 25%', () => {
    expect(getMilestoneMessage(25)).toContain('quart du chemin')
  })

  it('retourne le bon message pour 50%', () => {
    expect(getMilestoneMessage(50)).toContain('Mi-parcours')
  })

  it('retourne le bon message pour 75%', () => {
    expect(getMilestoneMessage(75)).toContain('Trois quarts')
  })

  it('retourne le bon message pour 100%', () => {
    expect(getMilestoneMessage(100)).toContain('Objectif atteint')
  })
})

describe('getMilestoneEmoji', () => {
  it('retourne 🌱 pour 25%', () => {
    expect(getMilestoneEmoji(25)).toBe('🌱')
  })

  it('retourne 🌿 pour 50%', () => {
    expect(getMilestoneEmoji(50)).toBe('🌿')
  })

  it('retourne 🌳 pour 75%', () => {
    expect(getMilestoneEmoji(75)).toBe('🌳')
  })

  it('retourne 🎉 pour 100%', () => {
    expect(getMilestoneEmoji(100)).toBe('🎉')
  })
})

describe('checkForNewMilestoneAfterCheckIn', () => {
  it('détecte un nouveau jalon lors du passage de seuil', () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    // Avant: 19 (22.5%), Après: 21 (27.5%) -> passe le seuil 25%

    const milestone = checkForNewMilestoneAfterCheckIn(habit, 19, 21, [])

    expect(milestone).not.toBeNull()
    expect(milestone?.level).toBe(25)
    expect(milestone?.celebrated).toBe(false)
  })

  it("retourne null si aucun seuil n'est franchi", () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    // Avant: 12 (5%), Après: 14 (10%) -> pas de seuil franchi

    const milestone = checkForNewMilestoneAfterCheckIn(habit, 12, 14, [])

    expect(milestone).toBeNull()
  })

  it('retourne le jalon le plus élevé si plusieurs sont franchis', () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    // Avant: 10 (0%), Après: 35 (62.5%) -> passe 25% et 50%

    const milestone = checkForNewMilestoneAfterCheckIn(habit, 10, 35, [])

    expect(milestone).not.toBeNull()
    expect(milestone?.level).toBe(50)
  })

  it("ne retourne pas un jalon déjà atteint même s'il est repassé", () => {
    const habit = createHabit({ startValue: 10, targetValue: 50 })
    const existingMilestones = [createMilestone({ habitId: habit.id, level: 25 })]

    const milestone = checkForNewMilestoneAfterCheckIn(habit, 10, 25, existingMilestones)

    // Le jalon 25 existe déjà, donc il ne doit pas être retourné
    expect(milestone).toBeNull()
  })

  it('retourne null sans targetValue', () => {
    const habit = createHabit({ targetValue: undefined })

    const milestone = checkForNewMilestoneAfterCheckIn(habit, 10, 30, [])

    expect(milestone).toBeNull()
  })
})
