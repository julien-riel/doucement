/**
 * Tests unitaires pour CheckInButtons
 * Couvre: les messages de zéro pour les habitudes decrease (unit.3)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CheckInButtons from './CheckInButtons'
import { DECREASE_ZERO_MESSAGES, DECREASE_SUCCESS_MESSAGES } from '../../constants/messages'

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================================================
// BUTTON LABELS TESTS
// ============================================================================

describe('CheckInButtons - Labels selon direction', () => {
  describe('direction: increase (défaut)', () => {
    it('affiche les labels pour augmentation', () => {
      const onCheckIn = vi.fn()

      render(
        <CheckInButtons
          targetDose={10}
          unit="répétitions"
          onCheckIn={onCheckIn}
          direction="increase"
        />
      )

      expect(screen.getByText('Un peu')).toBeDefined()
      expect(screen.getByText('Fait !')).toBeDefined()
      expect(screen.getByText('Encore +')).toBeDefined()
    })
  })

  describe('direction: decrease', () => {
    it('affiche les labels pour réduction', () => {
      const onCheckIn = vi.fn()

      render(
        <CheckInButtons
          targetDose={5}
          unit="cigarettes"
          onCheckIn={onCheckIn}
          direction="decrease"
        />
      )

      expect(screen.getByText('Un peu +')).toBeDefined()
      expect(screen.getByText('Pile poil')).toBeDefined()
      expect(screen.getByText('Moins')).toBeDefined()
    })
  })
})

// ============================================================================
// DECREASE ZERO MESSAGE TESTS (unit.3)
// ============================================================================

describe('CheckInButtons - Saisie zéro pour decrease (unit.3)', () => {
  it('permet de saisir 0 via le bouton "Moins"', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    // Cliquer sur "Moins" pour ouvrir l'input
    fireEvent.click(screen.getByText('Moins'))

    // L'input devrait être visible
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input).toBeDefined()

    // Changer la valeur à 0
    fireEvent.change(input, { target: { value: '0' } })

    // Valider
    fireEvent.click(screen.getByText('Valider'))

    expect(onCheckIn).toHaveBeenCalledWith(0)
  })

  it('suggère la valeur targetDose - 1 pour le bouton "Moins"', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    // Cliquer sur "Moins"
    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    // La valeur suggérée devrait être 4 (5 - 1)
    expect(input.value).toBe('4')
  })

  it('suggère 0 quand targetDose est 1', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={1} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    // Cliquer sur "Moins"
    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    // Max(0, 1-1) = 0
    expect(input.value).toBe('0')
  })

  it('suggère 0 quand targetDose est 0', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={0} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    // Cliquer sur "Moins"
    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    // Max(0, 0-1) = 0
    expect(input.value).toBe('0')
  })
})

// ============================================================================
// DECREASE BUTTON BEHAVIORS
// ============================================================================

describe('CheckInButtons - Comportement boutons decrease', () => {
  it('le bouton "Pile poil" enregistre la dose cible', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Pile poil'))

    expect(onCheckIn).toHaveBeenCalledWith(5)
  })

  it('le bouton "Un peu +" ouvre le champ de saisie', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Un peu +'))

    expect(screen.getByRole('spinbutton')).toBeDefined()
    expect(screen.getByText('Valider')).toBeDefined()
    expect(screen.getByText('Annuler')).toBeDefined()
  })

  it('permet d annuler la saisie', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    // Ouvrir le champ de saisie
    fireEvent.click(screen.getByText('Moins'))

    // Annuler
    fireEvent.click(screen.getByText('Annuler'))

    // Les boutons originaux devraient réapparaître
    expect(screen.getByText('Moins')).toBeDefined()
    expect(onCheckIn).not.toHaveBeenCalled()
  })

  it('valide avec la touche Entrée', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '2' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onCheckIn).toHaveBeenCalledWith(2)
  })

  it('annule avec la touche Escape', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.getByText('Moins')).toBeDefined()
    expect(onCheckIn).not.toHaveBeenCalled()
  })
})

// ============================================================================
// VISUAL FEEDBACK TESTS
// ============================================================================

describe('CheckInButtons - Feedback visuel decrease', () => {
  it('affiche le variant success quand valeur <= cible (moins = bien)', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        currentValue={3}
        onCheckIn={onCheckIn}
        direction="decrease"
      />
    )

    // Le bouton "Pile poil" devrait avoir le variant success
    const completeButton = screen.getByText(/Pile poil/).closest('button')
    expect(completeButton?.className).toContain('btn--success')
  })

  it('affiche le variant success pour "Moins" quand valeur < cible', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        currentValue={3}
        onCheckIn={onCheckIn}
        direction="decrease"
      />
    )

    // Le bouton "Moins" devrait avoir le variant success (valeur < cible)
    const lessButton = screen.getByText('Moins').closest('button')
    expect(lessButton?.className).toContain('btn--success')
  })

  it('affiche le variant secondary pour "Un peu +" quand valeur est au-dessus de la cible', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        currentValue={7}
        onCheckIn={onCheckIn}
        direction="decrease"
      />
    )

    // Le bouton "Un peu +" devrait avoir le variant secondary (pas bien)
    const partialButton = screen.getByText('Un peu +').closest('button')
    expect(partialButton?.className).toContain('btn--secondary')
  })

  it('affiche le checkmark quand une valeur est enregistrée', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        currentValue={5}
        onCheckIn={onCheckIn}
        direction="decrease"
      />
    )

    // Le bouton devrait afficher la coche
    expect(screen.getByText(/✓/)).toBeDefined()
  })
})

// ============================================================================
// INCREASE BUTTON BEHAVIORS (contraste)
// ============================================================================

describe('CheckInButtons - Comportement boutons increase', () => {
  it('suggère targetDose + 1 pour le bouton "Encore +"', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={10}
        unit="répétitions"
        onCheckIn={onCheckIn}
        direction="increase"
      />
    )

    fireEvent.click(screen.getByText('Encore +'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.value).toBe('11') // 10 + 1
  })

  it('le bouton "Fait !" enregistre la dose cible', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={10}
        unit="répétitions"
        onCheckIn={onCheckIn}
        direction="increase"
      />
    )

    fireEvent.click(screen.getByText('Fait !'))

    expect(onCheckIn).toHaveBeenCalledWith(10)
  })

  it('affiche le variant success quand valeur >= cible', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={10}
        unit="répétitions"
        currentValue={12}
        onCheckIn={onCheckIn}
        direction="increase"
      />
    )

    const completeButton = screen.getByText(/Fait !/).closest('button')
    expect(completeButton?.className).toContain('btn--success')
  })
})

// ============================================================================
// MESSAGES CONSTANTS TESTS
// ============================================================================

describe('Messages constants - Messages zéro decrease', () => {
  it('DECREASE_ZERO_MESSAGES contient des messages appropriés', () => {
    expect(DECREASE_ZERO_MESSAGES).toBeDefined()
    expect(DECREASE_ZERO_MESSAGES.length).toBeGreaterThan(0)

    // Vérifier qu'aucun message ne contient de mots interdits
    const bannedWords = ['échec', 'raté', 'manqué', 'retard', 'insuffisant']

    for (const message of DECREASE_ZERO_MESSAGES) {
      const lowerMessage = message.toLowerCase()
      for (const word of bannedWords) {
        expect(lowerMessage).not.toContain(word)
      }
    }
  })

  it('DECREASE_ZERO_MESSAGES contient des messages de victoire', () => {
    const victoryKeywords = ['parfait', 'bravo', 'victoire', 'impressionnant', 'zéro']
    let hasVictoryMessage = false

    for (const message of DECREASE_ZERO_MESSAGES) {
      const lowerMessage = message.toLowerCase()
      for (const keyword of victoryKeywords) {
        if (lowerMessage.includes(keyword)) {
          hasVictoryMessage = true
          break
        }
      }
    }

    expect(hasVictoryMessage).toBe(true)
  })

  it('DECREASE_SUCCESS_MESSAGES contient des messages de réussite', () => {
    expect(DECREASE_SUCCESS_MESSAGES).toBeDefined()
    expect(DECREASE_SUCCESS_MESSAGES.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// DISABLED STATE TESTS
// ============================================================================

describe('CheckInButtons - État désactivé', () => {
  it('désactive tous les boutons quand disabled=true', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        onCheckIn={onCheckIn}
        direction="decrease"
        disabled={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    for (const button of buttons) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('ne déclenche pas onCheckIn quand disabled', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons
        targetDose={5}
        unit="cigarettes"
        onCheckIn={onCheckIn}
        direction="decrease"
        disabled={true}
      />
    )

    // Essayer de cliquer sur un bouton désactivé
    const button = screen.getByText('Pile poil')
    fireEvent.click(button)

    expect(onCheckIn).not.toHaveBeenCalled()
  })
})

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

describe('CheckInButtons - Validation du champ de saisie', () => {
  it('n accepte pas les valeurs négatives', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '-1' } })

    const validateButton = screen.getByText('Valider') as HTMLButtonElement
    expect(validateButton.disabled).toBe(true)
  })

  it('accepte les valeurs décimales', () => {
    const onCheckIn = vi.fn()

    render(<CheckInButtons targetDose={5} unit="km" onCheckIn={onCheckIn} direction="decrease" />)

    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '2.5' } })
    fireEvent.click(screen.getByText('Valider'))

    expect(onCheckIn).toHaveBeenCalledWith(2.5)
  })

  it('affiche le placeholder approprié pour "Un peu"', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Un peu +'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.placeholder).toBe('0')
  })

  it('affiche l unité à côté du champ de saisie', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Moins'))

    expect(screen.getByText('cigarettes')).toBeDefined()
  })

  it('a un aria-label approprié pour l accessibilité', () => {
    const onCheckIn = vi.fn()

    render(
      <CheckInButtons targetDose={5} unit="cigarettes" onCheckIn={onCheckIn} direction="decrease" />
    )

    fireEvent.click(screen.getByText('Moins'))

    const input = screen.getByRole('spinbutton') as HTMLInputElement
    expect(input.getAttribute('aria-label')).toBe('Entrer le nombre de cigarettes')
  })
})
