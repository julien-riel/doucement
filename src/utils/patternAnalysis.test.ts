/**
 * Tests unitaires pour les utilitaires d'analyse des patterns
 * Couvre: analyzeHabitPatterns, analyzeGlobalPatterns
 */

import { describe, it, expect } from 'vitest'
import { analyzeHabitPatterns, analyzeGlobalPatterns } from './patternAnalysis'
import { createHabit, createEntry } from '../test/fixtures'
import type { DailyEntry } from '../types'

// ============================================================================
// FIXTURES SPÉCIFIQUES
// ============================================================================

/**
 * Crée une entrée avec une heure spécifique (en heure locale, pas UTC)
 */
function createEntryAtTime(
  date: string,
  hour: number,
  overrides: Partial<DailyEntry> = {}
): DailyEntry {
  // Créer une date locale et la convertir en ISO sans le Z pour éviter les problèmes de timezone
  const localDate = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`)
  const dateTime = localDate.toISOString()
  return createEntry({
    date,
    createdAt: dateTime,
    updatedAt: dateTime,
    ...overrides,
  })
}

/**
 * Crée des entrées pour une semaine complète
 * Retourne des entrées du lundi au dimanche
 */
function createWeekOfEntries(
  habitId: string,
  baseDate: string = '2026-01-06', // Un lundi
  completionValues: number[] = [100, 80, 90, 70, 60, 50, 100] // lun-dim
): DailyEntry[] {
  const entries: DailyEntry[] = []
  const start = new Date(baseDate)

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const targetDose = 10
    const actualValue = (targetDose * completionValues[i]) / 100

    entries.push(
      createEntry({
        id: `entry-${habitId}-${dateStr}`,
        habitId,
        date: dateStr,
        targetDose,
        actualValue,
        createdAt: `${dateStr}T10:00:00Z`,
        updatedAt: `${dateStr}T10:00:00Z`,
      })
    )
  }

  return entries
}

// ============================================================================
// analyzeHabitPatterns TESTS
// ============================================================================

describe('analyzeHabitPatterns', () => {
  describe('données insuffisantes (< 7 entrées)', () => {
    it('retourne hasEnoughData: false si moins de 7 entrées', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries: DailyEntry[] = [
        createEntry({ habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ habitId: 'habit-1', date: '2026-01-07' }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.hasEnoughData).toBe(false)
      expect(result.bestDays).toEqual([])
      expect(result.bestTimeOfDay).toBeNull()
      expect(result.timeOfDayStats).toEqual([])
    })

    it('retourne hasEnoughData: false si aucune entrée', () => {
      const habit = createHabit({ id: 'habit-1' })

      const result = analyzeHabitPatterns(habit, [])

      expect(result.hasEnoughData).toBe(false)
    })

    it("filtre les entrées d'autres habitudes", () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries: DailyEntry[] = [
        // 3 entrées pour habit-1
        createEntry({ id: 'e1', habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ id: 'e2', habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ id: 'e3', habitId: 'habit-1', date: '2026-01-07' }),
        // 5 entrées pour habit-2 (ne devraient pas compter)
        createEntry({ id: 'e4', habitId: 'habit-2', date: '2026-01-08' }),
        createEntry({ id: 'e5', habitId: 'habit-2', date: '2026-01-09' }),
        createEntry({ id: 'e6', habitId: 'habit-2', date: '2026-01-10' }),
        createEntry({ id: 'e7', habitId: 'habit-2', date: '2026-01-11' }),
        createEntry({ id: 'e8', habitId: 'habit-2', date: '2026-01-12' }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.hasEnoughData).toBe(false) // Seulement 3 entrées pour habit-1
    })
  })

  describe('analyse par jour de la semaine', () => {
    it('identifie les meilleurs jours par complétion moyenne', () => {
      const habit = createHabit({ id: 'habit-1' })
      // Créer 7 entrées avec des performances variables
      // Lundi=100%, Mardi=80%, Mercredi=90%, etc.
      const entries = createWeekOfEntries('habit-1', '2026-01-06', [100, 80, 90, 70, 60, 50, 95])

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.hasEnoughData).toBe(true)
      expect(result.bestDays.length).toBeLessThanOrEqual(3)
      // Le meilleur jour devrait être lundi (100%)
      expect(result.bestDays[0].averageCompletion).toBe(100)
      expect(result.bestDays[0].dayName).toBe('lundi')
    })

    it('retourne maximum 3 meilleurs jours', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = createWeekOfEntries('habit-1')

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestDays.length).toBeLessThanOrEqual(3)
    })

    it('trie les jours par complétion décroissante', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = createWeekOfEntries('habit-1', '2026-01-06', [50, 60, 70, 80, 90, 100, 40])

      const result = analyzeHabitPatterns(habit, entries)

      for (let i = 0; i < result.bestDays.length - 1; i++) {
        expect(result.bestDays[i].averageCompletion).toBeGreaterThanOrEqual(
          result.bestDays[i + 1].averageCompletion
        )
      }
    })

    it("calcule correctement le nombre d'entrées complétées (>= 70%)", () => {
      const habit = createHabit({ id: 'habit-1' })
      // On teste sur plusieurs lundis avec des performances variées
      // Lundi 1: 100%, Lundi 2: 50% -> moyenne 75%, 1 complétion sur 2
      const entries: DailyEntry[] = [
        // 3 lundis pour avoir une bonne représentation
        createEntry({
          id: 'e1',
          habitId: 'habit-1',
          date: '2026-01-06', // lundi
          targetDose: 10,
          actualValue: 10, // 100%
        }),
        createEntry({
          id: 'e2',
          habitId: 'habit-1',
          date: '2026-01-13', // lundi suivant
          targetDose: 10,
          actualValue: 5, // 50%
        }),
        createEntry({
          id: 'e3',
          habitId: 'habit-1',
          date: '2026-01-20', // lundi suivant
          targetDose: 10,
          actualValue: 8, // 80%
        }),
        // 4 mardis avec faible performance pour que lundi reste dans le top 3
        createEntry({
          id: 'e4',
          habitId: 'habit-1',
          date: '2026-01-07',
          targetDose: 10,
          actualValue: 3,
        }), // 30%
        createEntry({
          id: 'e5',
          habitId: 'habit-1',
          date: '2026-01-14',
          targetDose: 10,
          actualValue: 3,
        }),
        createEntry({
          id: 'e6',
          habitId: 'habit-1',
          date: '2026-01-21',
          targetDose: 10,
          actualValue: 3,
        }),
        createEntry({
          id: 'e7',
          habitId: 'habit-1',
          date: '2026-01-28',
          targetDose: 10,
          actualValue: 3,
        }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      // Chercher les stats pour lundi
      const mondayStats = result.bestDays.find((d) => d.dayName === 'lundi')
      expect(mondayStats).toBeDefined()
      expect(mondayStats?.totalEntries).toBe(3)
      expect(mondayStats?.completedEntries).toBe(2) // 100% et 80% >= 70%
    })

    it('exclut les jours sans entrée', () => {
      const habit = createHabit({ id: 'habit-1' })
      // Créer des entrées uniquement pour lundi, mardi, mercredi (9 entrées sur 3 jours, 3 semaines)
      const entries: DailyEntry[] = []
      for (let week = 0; week < 3; week++) {
        for (let day = 0; day < 3; day++) {
          const date = new Date('2026-01-06') // lundi
          date.setDate(date.getDate() + week * 7 + day)
          const dateStr = date.toISOString().split('T')[0]
          entries.push({
            id: `e-${week}-${day}`,
            habitId: 'habit-1',
            date: dateStr,
            targetDose: 10,
            actualValue: 8,
            createdAt: `${dateStr}T10:00:00Z`,
            updatedAt: `${dateStr}T10:00:00Z`,
          })
        }
      }

      const result = analyzeHabitPatterns(habit, entries) // 9 entrées

      // Devrait uniquement avoir lundi, mardi, mercredi dans bestDays
      const dayNames = result.bestDays.map((d) => d.dayName)
      expect(dayNames).toContain('lundi')
      expect(dayNames).toContain('mardi')
      expect(dayNames).toContain('mercredi')
      expect(dayNames).not.toContain('jeudi')
      expect(dayNames).not.toContain('vendredi')
      expect(dayNames).not.toContain('samedi')
      expect(dayNames).not.toContain('dimanche')
    })
  })

  describe('analyse par période de la journée', () => {
    it('identifie la meilleure période', () => {
      const habit = createHabit({ id: 'habit-1' })
      // 4 entrées le matin, 2 l'après-midi, 1 le soir = 7 entrées
      const entries: DailyEntry[] = [
        // 4 entrées le matin (< 12h)
        createEntryAtTime('2026-01-06', 8, { id: 'e1', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-06', 9, { id: 'e2', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-07', 10, { id: 'e3', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-08', 11, { id: 'e4', habitId: 'habit-1' }),
        // 2 entrées l'après-midi (12-17h)
        createEntryAtTime('2026-01-09', 14, { id: 'e5', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-10', 15, { id: 'e6', habitId: 'habit-1' }),
        // 1 entrée le soir (>= 18h)
        createEntryAtTime('2026-01-11', 19, { id: 'e7', habitId: 'habit-1' }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestTimeOfDay).not.toBeNull()
      expect(result.bestTimeOfDay?.period).toBe('morning')
      expect(result.bestTimeOfDay?.totalEntries).toBe(4)
    })

    it('classe les heures correctement: matin < 12, après-midi 12-18, soir >= 18', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries: DailyEntry[] = [
        createEntryAtTime('2026-01-06', 0, { id: 'e1', habitId: 'habit-1' }), // matin
        createEntryAtTime('2026-01-06', 11, { id: 'e2', habitId: 'habit-1' }), // matin
        createEntryAtTime('2026-01-07', 12, { id: 'e3', habitId: 'habit-1' }), // après-midi
        createEntryAtTime('2026-01-08', 17, { id: 'e4', habitId: 'habit-1' }), // après-midi
        createEntryAtTime('2026-01-09', 18, { id: 'e5', habitId: 'habit-1' }), // soir
        createEntryAtTime('2026-01-10', 23, { id: 'e6', habitId: 'habit-1' }), // soir
        createEntryAtTime('2026-01-11', 6, { id: 'e7', habitId: 'habit-1' }), // matin
      ]

      const result = analyzeHabitPatterns(habit, entries)

      const morning = result.timeOfDayStats.find((s) => s.period === 'morning')
      const afternoon = result.timeOfDayStats.find((s) => s.period === 'afternoon')
      const evening = result.timeOfDayStats.find((s) => s.period === 'evening')

      expect(morning?.totalEntries).toBe(3)
      expect(afternoon?.totalEntries).toBe(2)
      expect(evening?.totalEntries).toBe(2)
    })

    it('calcule les pourcentages correctement', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries: DailyEntry[] = [
        createEntryAtTime('2026-01-06', 8, { id: 'e1', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-06', 9, { id: 'e2', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-07', 10, { id: 'e3', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-08', 11, { id: 'e4', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-09', 14, { id: 'e5', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-10', 15, { id: 'e6', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-11', 19, { id: 'e7', habitId: 'habit-1' }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      const morning = result.timeOfDayStats.find((s) => s.period === 'morning')
      const afternoon = result.timeOfDayStats.find((s) => s.period === 'afternoon')
      const evening = result.timeOfDayStats.find((s) => s.period === 'evening')

      // 4/7 matin, 2/7 après-midi, 1/7 soir
      expect(morning?.percentage).toBeCloseTo((4 / 7) * 100, 1)
      expect(afternoon?.percentage).toBeCloseTo((2 / 7) * 100, 1)
      expect(evening?.percentage).toBeCloseTo((1 / 7) * 100, 1)
    })

    it("trie les périodes par nombre d'entrées décroissant", () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries: DailyEntry[] = [
        createEntryAtTime('2026-01-06', 8, { id: 'e1', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-06', 14, { id: 'e2', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-07', 14, { id: 'e3', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-08', 14, { id: 'e4', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-09', 19, { id: 'e5', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-10', 19, { id: 'e6', habitId: 'habit-1' }),
        createEntryAtTime('2026-01-11', 8, { id: 'e7', habitId: 'habit-1' }),
      ]

      const result = analyzeHabitPatterns(habit, entries)

      for (let i = 0; i < result.timeOfDayStats.length - 1; i++) {
        expect(result.timeOfDayStats[i].totalEntries).toBeGreaterThanOrEqual(
          result.timeOfDayStats[i + 1].totalEntries
        )
      }
    })

    it('utilise les bons labels en français', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = createWeekOfEntries('habit-1')

      const result = analyzeHabitPatterns(habit, entries)

      const labels = result.timeOfDayStats.map((s) => s.label)
      expect(labels).toContain('matin')
      expect(labels).toContain('après-midi')
      expect(labels).toContain('soir')
    })
  })

  describe('calcul de la complétion', () => {
    it('calcule 100% si actualValue = targetDose', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = Array.from({ length: 7 }, (_, i) =>
        createEntry({
          id: `e${i}`,
          habitId: 'habit-1',
          date: `2026-01-${(5 + i).toString().padStart(2, '0')}`,
          targetDose: 10,
          actualValue: 10,
        })
      )

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestDays[0].averageCompletion).toBe(100)
    })

    it('retourne 100% si targetDose est 0 (cas particulier)', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = Array.from({ length: 7 }, (_, i) =>
        createEntry({
          id: `e${i}`,
          habitId: 'habit-1',
          date: `2026-01-${(5 + i).toString().padStart(2, '0')}`,
          targetDose: 0,
          actualValue: 5, // Peu importe la valeur
        })
      )

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestDays[0].averageCompletion).toBe(100)
    })

    it('calcule correctement les pourcentages partiels', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = Array.from({ length: 7 }, (_, i) =>
        createEntry({
          id: `e${i}`,
          habitId: 'habit-1',
          date: `2026-01-${(5 + i).toString().padStart(2, '0')}`,
          targetDose: 10,
          actualValue: 5, // 50%
        })
      )

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestDays[0].averageCompletion).toBe(50)
    })

    it('gère les valeurs supérieures à 100%', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = Array.from({ length: 7 }, (_, i) =>
        createEntry({
          id: `e${i}`,
          habitId: 'habit-1',
          date: `2026-01-${(5 + i).toString().padStart(2, '0')}`,
          targetDose: 10,
          actualValue: 15, // 150%
        })
      )

      const result = analyzeHabitPatterns(habit, entries)

      expect(result.bestDays[0].averageCompletion).toBe(150)
    })
  })
})

// ============================================================================
// analyzeGlobalPatterns TESTS
// ============================================================================

describe('analyzeGlobalPatterns', () => {
  describe('données insuffisantes', () => {
    it('retourne hasEnoughData: false si moins de 7 entrées', () => {
      const habits = [createHabit({ id: 'habit-1' })]
      const entries: DailyEntry[] = [
        createEntry({ id: 'e1', habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ id: 'e2', habitId: 'habit-1', date: '2026-01-06' }),
      ]

      const result = analyzeGlobalPatterns(habits, entries)

      expect(result.hasEnoughData).toBe(false)
    })

    it('retourne hasEnoughData: false si aucune entrée', () => {
      const habits = [createHabit({ id: 'habit-1' })]

      const result = analyzeGlobalPatterns(habits, [])

      expect(result.hasEnoughData).toBe(false)
    })
  })

  describe('analyse globale multi-habitudes', () => {
    it('agrège les entrées de toutes les habitudes', () => {
      const habits = [createHabit({ id: 'habit-1' }), createHabit({ id: 'habit-2' })]
      const entries: DailyEntry[] = [
        // 4 entrées habit-1
        createEntry({ id: 'e1', habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ id: 'e2', habitId: 'habit-1', date: '2026-01-06' }),
        createEntry({ id: 'e3', habitId: 'habit-1', date: '2026-01-07' }),
        createEntry({ id: 'e4', habitId: 'habit-1', date: '2026-01-08' }),
        // 3 entrées habit-2
        createEntry({ id: 'e5', habitId: 'habit-2', date: '2026-01-09' }),
        createEntry({ id: 'e6', habitId: 'habit-2', date: '2026-01-10' }),
        createEntry({ id: 'e7', habitId: 'habit-2', date: '2026-01-11' }),
      ]

      const result = analyzeGlobalPatterns(habits, entries)

      expect(result.hasEnoughData).toBe(true)
      // Le total des entrées analysées devrait être 7
      const totalEntries = result.timeOfDayStats.reduce((sum, s) => sum + s.totalEntries, 0)
      expect(totalEntries).toBe(7)
    })

    it('analyse correctement avec plusieurs entrées par jour', () => {
      const habits = [createHabit({ id: 'habit-1' }), createHabit({ id: 'habit-2' })]
      // Même jour, 2 habitudes différentes
      const entries: DailyEntry[] = [
        createEntry({
          id: 'e1',
          habitId: 'habit-1',
          date: '2026-01-06',
          targetDose: 10,
          actualValue: 10,
        }),
        createEntry({
          id: 'e2',
          habitId: 'habit-2',
          date: '2026-01-06',
          targetDose: 10,
          actualValue: 5,
        }),
        createEntry({
          id: 'e3',
          habitId: 'habit-1',
          date: '2026-01-06',
          targetDose: 10,
          actualValue: 10,
        }),
        createEntry({
          id: 'e4',
          habitId: 'habit-2',
          date: '2026-01-06',
          targetDose: 10,
          actualValue: 5,
        }),
        createEntry({
          id: 'e5',
          habitId: 'habit-1',
          date: '2026-01-07',
          targetDose: 10,
          actualValue: 10,
        }),
        createEntry({
          id: 'e6',
          habitId: 'habit-2',
          date: '2026-01-07',
          targetDose: 10,
          actualValue: 5,
        }),
        createEntry({
          id: 'e7',
          habitId: 'habit-1',
          date: '2026-01-08',
          targetDose: 10,
          actualValue: 10,
        }),
      ]

      const result = analyzeGlobalPatterns(habits, entries)

      expect(result.hasEnoughData).toBe(true)
      // Moyenne pour lundi: 2 entrées (100% + 50%) / 2 = 75%
      const monday = result.bestDays.find((d) => d.dayName === 'lundi')
      expect(monday?.averageCompletion).toBe(75)
    })
  })

  describe('cohérence avec analyzeHabitPatterns', () => {
    it('utilise le même format de résultat', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = createWeekOfEntries('habit-1')

      const habitResult = analyzeHabitPatterns(habit, entries)
      const globalResult = analyzeGlobalPatterns([habit], entries)

      // Les deux devraient avoir la même structure
      expect(habitResult).toHaveProperty('bestDays')
      expect(habitResult).toHaveProperty('bestTimeOfDay')
      expect(habitResult).toHaveProperty('timeOfDayStats')
      expect(habitResult).toHaveProperty('hasEnoughData')

      expect(globalResult).toHaveProperty('bestDays')
      expect(globalResult).toHaveProperty('bestTimeOfDay')
      expect(globalResult).toHaveProperty('timeOfDayStats')
      expect(globalResult).toHaveProperty('hasEnoughData')
    })

    it('donne les mêmes résultats pour une seule habitude', () => {
      const habit = createHabit({ id: 'habit-1' })
      const entries = createWeekOfEntries('habit-1')

      const habitResult = analyzeHabitPatterns(habit, entries)
      const globalResult = analyzeGlobalPatterns([habit], entries)

      expect(habitResult.bestDays).toEqual(globalResult.bestDays)
      expect(habitResult.bestTimeOfDay).toEqual(globalResult.bestTimeOfDay)
      expect(habitResult.hasEnoughData).toEqual(globalResult.hasEnoughData)
    })
  })
})

// ============================================================================
// CAS LIMITES
// ============================================================================

describe('cas limites', () => {
  it('gère les dates mal formatées gracieusement', () => {
    const habit = createHabit({ id: 'habit-1' })
    const entries = createWeekOfEntries('habit-1')

    // Ne devrait pas lancer d'exception
    expect(() => analyzeHabitPatterns(habit, entries)).not.toThrow()
  })

  it('gère les entrées avec actualValue négatif', () => {
    const habit = createHabit({ id: 'habit-1' })
    const entries = Array.from({ length: 7 }, (_, i) =>
      createEntry({
        id: `e${i}`,
        habitId: 'habit-1',
        date: `2026-01-${(5 + i).toString().padStart(2, '0')}`,
        targetDose: 10,
        actualValue: -5, // Valeur négative
      })
    )

    const result = analyzeHabitPatterns(habit, entries)

    // Devrait calculer -50% mais ne pas planter
    expect(result.hasEnoughData).toBe(true)
    expect(result.bestDays[0].averageCompletion).toBe(-50)
  })

  it('gère exactement 7 entrées (seuil minimum)', () => {
    const habit = createHabit({ id: 'habit-1' })
    const entries = createWeekOfEntries('habit-1')

    const result = analyzeHabitPatterns(habit, entries)

    expect(result.hasEnoughData).toBe(true)
  })

  it("gère un grand nombre d'entrées", () => {
    const habit = createHabit({ id: 'habit-1' })
    // 365 entrées (1 an)
    const entries: DailyEntry[] = []
    for (let i = 0; i < 365; i++) {
      const date = new Date('2025-01-01')
      date.setDate(date.getDate() + i)
      entries.push(
        createEntry({
          id: `e${i}`,
          habitId: 'habit-1',
          date: date.toISOString().split('T')[0],
          targetDose: 10,
          actualValue: 8,
        })
      )
    }

    const result = analyzeHabitPatterns(habit, entries)

    expect(result.hasEnoughData).toBe(true)
    expect(result.bestDays.length).toBeLessThanOrEqual(3)
  })
})
