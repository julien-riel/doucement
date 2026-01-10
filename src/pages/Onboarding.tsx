import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../hooks'
import { OnboardingStep } from '../components/onboarding'
import { Button } from '../components/ui'
import './Onboarding.css'

/**
 * Contenu des étapes d'onboarding
 * Messages bienveillants tirés de la banque de messages
 */
const ONBOARDING_STEPS = [
  {
    illustration: '🌱',
    title: 'Bienvenue',
    description:
      'Doucement vous aide à améliorer vos habitudes progressivement, sans culpabilité.',
  },
  {
    illustration: '📊',
    title: 'La dose du jour',
    description:
      'Oubliez les objectifs intimidants. Concentrez-vous uniquement sur votre dose du jour.',
  },
  {
    illustration: '📈',
    title: 'Progression douce',
    description:
      "Vos doses évoluent automatiquement. +1%, +2%... l'effet composé fait le travail.",
  },
  {
    illustration: '💚',
    title: 'Chaque effort compte',
    description:
      "Faire un peu, c'est déjà beaucoup. Ici, 70% c'est une victoire.",
  },
]

/**
 * Écran d'onboarding
 * Introduction à l'application pour les nouveaux utilisateurs
 * 4 écrans avec navigation, skip, et flag onboardingCompleted
 */
function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()
  const { updatePreferences } = useAppData()

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1
  const step = ONBOARDING_STEPS[currentStep]

  /**
   * Termine l'onboarding et redirige vers l'écran principal
   */
  const completeOnboarding = useCallback(() => {
    updatePreferences({ onboardingCompleted: true })
    navigate('/')
  }, [updatePreferences, navigate])

  /**
   * Passe à l'étape suivante ou termine l'onboarding
   */
  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }, [isLastStep, completeOnboarding])

  /**
   * Retourne à l'étape précédente
   */
  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [isFirstStep])

  /**
   * Skip l'onboarding entièrement
   */
  const handleSkip = useCallback(() => {
    completeOnboarding()
  }, [completeOnboarding])

  return (
    <div className="page page-onboarding">
      <div className="onboarding__container">
        <OnboardingStep
          key={currentStep}
          illustration={step.illustration}
          title={step.title}
          description={step.description}
        />
      </div>

      <footer className="onboarding__footer">
        <nav className="onboarding__navigation" aria-label="Navigation onboarding">
          {/* Indicateurs de progression */}
          <div className="onboarding__dots" role="tablist" aria-label="Étapes">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`onboarding__dot ${index === currentStep ? 'onboarding__dot--active' : ''}`}
                role="tab"
                aria-selected={index === currentStep}
                aria-label={`Étape ${index + 1} sur ${ONBOARDING_STEPS.length}`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="onboarding__buttons">
            {!isFirstStep && (
              <Button
                variant="ghost"
                onClick={handlePrevious}
                aria-label="Étape précédente"
              >
                Retour
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              fullWidth={isFirstStep}
            >
              {isLastStep ? 'Commencer' : 'Suivant'}
            </Button>
          </div>

          {/* Bouton Skip (sauf dernière étape) */}
          {!isLastStep && (
            <div className="onboarding__skip">
              <button
                type="button"
                className="onboarding__skip-button"
                onClick={handleSkip}
              >
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
