import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { OnboardingStep, HabitSuggestions } from '../components/onboarding'
import { Button } from '../components/ui'
import { SuggestedHabit } from '../constants/suggestedHabits'
import { CreateHabitInput } from '../types'
import './Onboarding.css'

/**
 * Contenu des étapes d'onboarding (condensé à 3 écrans)
 * Messages bienveillants tirés de la banque de messages
 */
const ONBOARDING_STEPS = [
  {
    illustration: '🌱',
    title: 'Bienvenue',
    description:
      "Doucement t'aide à améliorer tes habitudes progressivement, sans culpabilité.\n\n🔒 Tes données restent sur ton appareil. Aucun compte, aucun cloud, aucun tracking.",
  },
  {
    illustration: '📊',
    title: 'La dose du jour',
    description:
      "Oublie les objectifs intimidants. Concentre-toi uniquement sur ta dose du jour.\n\nLa dose évolue automatiquement selon ta progression : +1%, +2%... l'effet composé fait le travail.",
  },
  {
    illustration: '💚',
    title: 'Chaque effort compte',
    description: "Faire un peu, c'est déjà beaucoup. Ici, 70% c'est une victoire.",
  },
]

/**
 * Types d'étapes de l'onboarding
 */
type OnboardingStepType = 'intro' | 'suggestions'

/**
 * Écran d'onboarding
 * Introduction à l'application pour les nouveaux utilisateurs
 * 4 écrans intro + 1 écran de suggestions d'habitudes
 */
function Onboarding() {
  const [stepType, setStepType] = useState<OnboardingStepType>('intro')
  const [introStep, setIntroStep] = useState(0)
  const [selectedHabits, setSelectedHabits] = useState<SuggestedHabit[]>([])
  const navigate = useNavigate()
  const { updatePreferences, addHabit } = useAppData()

  const isFirstIntroStep = introStep === 0
  const isLastIntroStep = introStep === ONBOARDING_STEPS.length - 1
  const step = ONBOARDING_STEPS[introStep]

  /**
   * Crée les habitudes sélectionnées et termine l'onboarding
   */
  const completeOnboarding = useCallback(() => {
    // Créer les habitudes sélectionnées
    selectedHabits.forEach((suggestedHabit) => {
      const habitInput: CreateHabitInput = {
        name: suggestedHabit.name,
        emoji: suggestedHabit.emoji,
        direction: suggestedHabit.direction,
        startValue: suggestedHabit.startValue,
        unit: suggestedHabit.unit,
        progression: suggestedHabit.progression,
      }
      addHabit(habitInput)
    })

    updatePreferences({ onboardingCompleted: true })
    navigate('/')
  }, [selectedHabits, addHabit, updatePreferences, navigate])

  /**
   * Passe à l'étape suivante
   */
  const handleNext = useCallback(() => {
    if (stepType === 'intro') {
      if (isLastIntroStep) {
        setStepType('suggestions')
      } else {
        setIntroStep((prev) => prev + 1)
      }
    } else {
      completeOnboarding()
    }
  }, [stepType, isLastIntroStep, completeOnboarding])

  /**
   * Retourne à l'étape précédente
   */
  const handlePrevious = useCallback(() => {
    if (stepType === 'suggestions') {
      setStepType('intro')
    } else if (!isFirstIntroStep) {
      setIntroStep((prev) => prev - 1)
    }
  }, [stepType, isFirstIntroStep])

  /**
   * Skip l'onboarding entièrement
   */
  const handleSkip = useCallback(() => {
    updatePreferences({ onboardingCompleted: true })
    navigate('/')
  }, [updatePreferences, navigate])

  /**
   * Calcul du nombre total d'étapes pour les dots
   */
  const totalSteps = ONBOARDING_STEPS.length + 1
  const currentStepIndex = stepType === 'intro' ? introStep : ONBOARDING_STEPS.length

  /**
   * Texte du bouton suivant
   */
  const getNextButtonText = () => {
    if (stepType === 'suggestions') {
      return selectedHabits.length > 0
        ? `Créer ${selectedHabits.length} habitude${selectedHabits.length > 1 ? 's' : ''}`
        : 'Commencer sans habitude'
    }
    return isLastIntroStep ? 'Choisir mes habitudes' : 'Suivant'
  }

  return (
    <div className="page page-onboarding">
      <div className="onboarding__container">
        {stepType === 'intro' ? (
          <OnboardingStep
            key={introStep}
            illustration={step.illustration}
            title={step.title}
            description={step.description}
          />
        ) : (
          <HabitSuggestions
            selectedHabits={selectedHabits}
            onSelectionChange={setSelectedHabits}
            maxSelection={3}
          />
        )}
      </div>

      <footer className="onboarding__footer">
        <nav className="onboarding__navigation" aria-label="Navigation onboarding">
          {/* Indicateurs de progression */}
          <div className="onboarding__dots" role="tablist" aria-label="Étapes">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`onboarding__dot ${index === currentStepIndex ? 'onboarding__dot--active' : ''}`}
                role="tab"
                aria-selected={index === currentStepIndex}
                aria-label={`Étape ${index + 1} sur ${totalSteps}`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="onboarding__buttons">
            {(stepType === 'suggestions' || !isFirstIntroStep) && (
              <Button variant="ghost" onClick={handlePrevious} aria-label="Étape précédente">
                Retour
              </Button>
            )}
            <Button
              variant={
                stepType === 'suggestions' && selectedHabits.length > 0 ? 'success' : 'primary'
              }
              onClick={handleNext}
              fullWidth={stepType === 'intro' && isFirstIntroStep}
            >
              {getNextButtonText()}
            </Button>
          </div>

          {/* Bouton Skip (sauf dernière étape) */}
          {stepType === 'intro' && (
            <div className="onboarding__skip">
              <button type="button" className="onboarding__skip-button" onClick={handleSkip}>
                Passer l'introduction
              </button>
            </div>
          )}
        </nav>
      </footer>
    </div>
  )
}

export default Onboarding
