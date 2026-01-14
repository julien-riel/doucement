/**
 * Tests unitaires pour les utilitaires d'affichage des habitudes
 * Phase 6: Implementation Intentions & Habit Stacking
 */

import { describe, it, expect } from 'vitest'
import {
  buildIntentionText,
  buildHabitChains,
  HabitDataItem,
  getDaysSinceCreation,
  buildIdentityText,
  hasIdentityStatement,
  getHabitsWithIdentity,
} from './habitDisplay'
import { Habit } from '../types'
import { createHabit } from '../test/fixtures'

// ============================================================================
// FIXTURES SPÉCIFIQUES AU MODULE
// ============================================================================

/**
 * Crée un HabitDataItem de test
 */
function createHabitDataItem(
  habit: Habit,
  overrides: Partial<Omit<HabitDataItem, 'habit'>> = {}
): HabitDataItem {
  return {
    habit,
    targetDose: 10,
    currentValue: undefined,
    status: 'pending',
    anchorHabitName: undefined,
    ...overrides,
  }
}

// ============================================================================
// buildIntentionText TESTS
// ============================================================================

describe('buildIntentionText', () => {
  it("retourne null si pas d'implementation intention", () => {
    const habit = createHabit()
    expect(buildIntentionText(habit)).toBeNull()
  })

  it('retourne null si implementation intention est vide', () => {
    const habit = createHabit({
      implementationIntention: {},
    })
    expect(buildIntentionText(habit)).toBeNull()
  })

  it('affiche uniquement le déclencheur', () => {
    const habit = createHabit({
      implementationIntention: {
        trigger: 'Après mon café du matin',
      },
    })
    expect(buildIntentionText(habit)).toBe('Après mon café du matin')
  })

  it('affiche uniquement le lieu', () => {
    const habit = createHabit({
      implementationIntention: {
        location: 'Dans le salon',
      },
    })
    expect(buildIntentionText(habit)).toBe('à Dans le salon')
  })

  it("affiche uniquement l'heure", () => {
    const habit = createHabit({
      implementationIntention: {
        time: '08:00',
      },
    })
    expect(buildIntentionText(habit)).toBe('vers 08:00')
  })

  it('affiche déclencheur et lieu', () => {
    const habit = createHabit({
      implementationIntention: {
        trigger: 'Après mon café du matin',
        location: 'Dans le salon',
      },
    })
    expect(buildIntentionText(habit)).toBe('Après mon café du matin à Dans le salon')
  })

  it('affiche déclencheur, lieu et heure', () => {
    const habit = createHabit({
      implementationIntention: {
        trigger: 'Après mon café du matin',
        location: 'Dans le salon',
        time: '08:00',
      },
    })
    expect(buildIntentionText(habit)).toBe('Après mon café du matin à Dans le salon vers 08:00')
  })

  it('affiche déclencheur et heure sans lieu', () => {
    const habit = createHabit({
      implementationIntention: {
        trigger: 'Après le déjeuner',
        time: '14:00',
      },
    })
    expect(buildIntentionText(habit)).toBe('Après le déjeuner vers 14:00')
  })
})

// ============================================================================
// buildHabitChains TESTS
// ============================================================================

describe('buildHabitChains', () => {
  it("retourne un tableau vide si pas d'habitudes", () => {
    const result = buildHabitChains([], [])
    expect(result).toEqual([])
  })

  it('retourne chaque habitude dans sa propre chaîne si aucun ancrage', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Habitude 1' })
    const habit2 = createHabit({ id: 'h2', name: 'Habitude 2' })

    const habitData: HabitDataItem[] = [createHabitDataItem(habit1), createHabitDataItem(habit2)]

    const result = buildHabitChains(habitData, [habit1, habit2])

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(1)
    expect(result[1]).toHaveLength(1)
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[1][0].habit.id).toBe('h2')
  })

  it('groupe une habitude avec son ancre', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Habitude de base' })
    const habit2 = createHabit({
      id: 'h2',
      name: 'Habitude ancrée',
      anchorHabitId: 'h1',
    })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2, { anchorHabitName: 'Habitude de base' }),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2])

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(2)
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[0][1].habit.id).toBe('h2')
  })

  it('construit une chaîne de 3 habitudes', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Habitude 1' })
    const habit2 = createHabit({
      id: 'h2',
      name: 'Habitude 2',
      anchorHabitId: 'h1',
    })
    const habit3 = createHabit({
      id: 'h3',
      name: 'Habitude 3',
      anchorHabitId: 'h2',
    })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2),
      createHabitDataItem(habit3),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2, habit3])

    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(3)
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[0][1].habit.id).toBe('h2')
    expect(result[0][2].habit.id).toBe('h3')
  })

  it('gère plusieurs chaînes indépendantes', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Base 1' })
    const habit2 = createHabit({
      id: 'h2',
      name: 'Ancrée à 1',
      anchorHabitId: 'h1',
    })
    const habit3 = createHabit({ id: 'h3', name: 'Base 2' })
    const habit4 = createHabit({
      id: 'h4',
      name: 'Ancrée à 3',
      anchorHabitId: 'h3',
    })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2),
      createHabitDataItem(habit3),
      createHabitDataItem(habit4),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2, habit3, habit4])

    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(2)
    expect(result[1]).toHaveLength(2)
    // Chaîne 1: h1 -> h2
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[0][1].habit.id).toBe('h2')
    // Chaîne 2: h3 -> h4
    expect(result[1][0].habit.id).toBe('h3')
    expect(result[1][1].habit.id).toBe('h4')
  })

  it("gère une ancre dont l'habitude n'est pas dans la liste", () => {
    // L'habitude h1 est l'ancre mais n'est pas dans allHabits (archivée par ex.)
    const habit2 = createHabit({
      id: 'h2',
      name: 'Habitude orpheline',
      anchorHabitId: 'h1-inexistant',
    })

    const habitData: HabitDataItem[] = [createHabitDataItem(habit2)]

    const result = buildHabitChains(habitData, [habit2])

    // L'habitude orpheline devient racine de sa propre chaîne
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(1)
    expect(result[0][0].habit.id).toBe('h2')
  })

  it('gère plusieurs habitudes ancrées à la même base (branches)', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Base' })
    const habit2 = createHabit({
      id: 'h2',
      name: 'Branche A',
      anchorHabitId: 'h1',
    })
    const habit3 = createHabit({
      id: 'h3',
      name: 'Branche B',
      anchorHabitId: 'h1',
    })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2),
      createHabitDataItem(habit3),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2, habit3])

    // Une seule chaîne avec toutes les habitudes
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveLength(3)
    expect(result[0][0].habit.id).toBe('h1')
    // Les branches peuvent être dans n'importe quel ordre
    const branchIds = [result[0][1].habit.id, result[0][2].habit.id]
    expect(branchIds).toContain('h2')
    expect(branchIds).toContain('h3')
  })

  it("préserve l'ordre des habitudes non ancrées", () => {
    const habit1 = createHabit({ id: 'h1', name: 'Solo 1' })
    const habit2 = createHabit({ id: 'h2', name: 'Solo 2' })
    const habit3 = createHabit({ id: 'h3', name: 'Solo 3' })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2),
      createHabitDataItem(habit3),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2, habit3])

    expect(result).toHaveLength(3)
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[1][0].habit.id).toBe('h2')
    expect(result[2][0].habit.id).toBe('h3')
  })

  it('gère un cas mixte: chaînes et solo', () => {
    const habit1 = createHabit({ id: 'h1', name: 'Base chaîne' })
    const habit2 = createHabit({
      id: 'h2',
      name: 'Ancrée',
      anchorHabitId: 'h1',
    })
    const habit3 = createHabit({ id: 'h3', name: 'Solo' })

    const habitData: HabitDataItem[] = [
      createHabitDataItem(habit1),
      createHabitDataItem(habit2),
      createHabitDataItem(habit3),
    ]

    const result = buildHabitChains(habitData, [habit1, habit2, habit3])

    expect(result).toHaveLength(2)
    // Chaîne: h1 -> h2
    expect(result[0]).toHaveLength(2)
    expect(result[0][0].habit.id).toBe('h1')
    expect(result[0][1].habit.id).toBe('h2')
    // Solo: h3
    expect(result[1]).toHaveLength(1)
    expect(result[1][0].habit.id).toBe('h3')
  })
})

// ============================================================================
// getDaysSinceCreation TESTS
// ============================================================================

describe('getDaysSinceCreation', () => {
  it('retourne 0 si créé le même jour', () => {
    const habit = createHabit({ createdAt: '2026-01-10' })
    expect(getDaysSinceCreation(habit, '2026-01-10')).toBe(0)
  })

  it('retourne le nombre exact de jours', () => {
    const habit = createHabit({ createdAt: '2026-01-01' })
    expect(getDaysSinceCreation(habit, '2026-01-10')).toBe(9)
  })

  it('retourne 30 jours exactement', () => {
    const habit = createHabit({ createdAt: '2025-12-11' })
    expect(getDaysSinceCreation(habit, '2026-01-10')).toBe(30)
  })

  it('fonctionne sur plusieurs mois', () => {
    const habit = createHabit({ createdAt: '2025-10-01' })
    expect(getDaysSinceCreation(habit, '2026-01-10')).toBe(101)
  })
})

// ============================================================================
// buildIdentityText TESTS (Phase 9)
// ============================================================================

describe('buildIdentityText', () => {
  it("retourne null si pas d'identityStatement", () => {
    const habit = createHabit()
    expect(buildIdentityText(habit)).toBeNull()
  })

  it('retourne null si identityStatement est une chaîne vide', () => {
    const habit = createHabit({
      identityStatement: '',
    })
    expect(buildIdentityText(habit)).toBeNull()
  })

  it('retourne null si identityStatement ne contient que des espaces', () => {
    const habit = createHabit({
      identityStatement: '   ',
    })
    expect(buildIdentityText(habit)).toBeNull()
  })

  it("retourne la phrase d'identité complète", () => {
    const habit = createHabit({
      identityStatement: 'prend soin de son corps',
    })
    expect(buildIdentityText(habit)).toBe("Je deviens quelqu'un qui... prend soin de son corps")
  })

  it('préserve le texte tel quel sans modification', () => {
    const habit = createHabit({
      identityStatement: "maîtrise son temps d'écran",
    })
    expect(buildIdentityText(habit)).toBe("Je deviens quelqu'un qui... maîtrise son temps d'écran")
  })
})

// ============================================================================
// hasIdentityStatement TESTS (Phase 9)
// ============================================================================

describe('hasIdentityStatement', () => {
  it("retourne false si pas d'identityStatement", () => {
    const habit = createHabit()
    expect(hasIdentityStatement(habit)).toBe(false)
  })

  it('retourne false si identityStatement est une chaîne vide', () => {
    const habit = createHabit({
      identityStatement: '',
    })
    expect(hasIdentityStatement(habit)).toBe(false)
  })

  it('retourne false si identityStatement ne contient que des espaces', () => {
    const habit = createHabit({
      identityStatement: '   ',
    })
    expect(hasIdentityStatement(habit)).toBe(false)
  })

  it("retourne true si l'habitude a une identité", () => {
    const habit = createHabit({
      identityStatement: 'prend soin de son corps',
    })
    expect(hasIdentityStatement(habit)).toBe(true)
  })
})

// ============================================================================
// getHabitsWithIdentity TESTS (Phase 9)
// ============================================================================

describe('getHabitsWithIdentity', () => {
  it('retourne un tableau vide si aucune habitude', () => {
    expect(getHabitsWithIdentity([])).toEqual([])
  })

  it("retourne un tableau vide si aucune habitude n'a d'identité", () => {
    const habit1 = createHabit({ id: 'h1' })
    const habit2 = createHabit({ id: 'h2', identityStatement: '' })
    expect(getHabitsWithIdentity([habit1, habit2])).toEqual([])
  })

  it('filtre uniquement les habitudes avec identité', () => {
    const habitWithIdentity = createHabit({
      id: 'h1',
      identityStatement: 'prend soin de son corps',
    })
    const habitWithoutIdentity = createHabit({ id: 'h2' })
    const habitWithEmptyIdentity = createHabit({ id: 'h3', identityStatement: '' })

    const result = getHabitsWithIdentity([
      habitWithIdentity,
      habitWithoutIdentity,
      habitWithEmptyIdentity,
    ])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('h1')
  })

  it('retourne plusieurs habitudes avec identité', () => {
    const habit1 = createHabit({
      id: 'h1',
      identityStatement: 'prend soin de son corps',
    })
    const habit2 = createHabit({
      id: 'h2',
      identityStatement: 'lit chaque jour',
    })
    const habit3 = createHabit({ id: 'h3' })

    const result = getHabitsWithIdentity([habit1, habit2, habit3])

    expect(result).toHaveLength(2)
    expect(result.map((h) => h.id)).toEqual(['h1', 'h2'])
  })
})
