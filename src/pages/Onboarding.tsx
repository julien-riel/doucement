import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../hooks'
import { OnboardingStep, HabitSuggestions } from '../components/onboarding'
import { Button } from '../components/ui'
import { SuggestedHabit } from '../constants/suggestedHabits'
import { CreateHabitInput } from '../types'
import './Onboarding.css'

/**
 * Clés de traduction pour les étapes d'onboarding
 */
const ONBOARDING_STEP_KEYS = ['welcome', 'dose', 'effort'] as const

/**
 * Types d'étapes de l'onboarding
 */
type OnboardingStepType = 'intro' | 'suggestions'

/**
 * Illustrations (emojis) pour chaque étape d'onboarding
 */
const ONBOARDING_ILLUSTRATIONS = ['🌱', '📊', '💚'] as const

/**
 * Écran d'onboarding
 * Introduction à l'application pour les nouveaux utilisateurs
 * 3 écrans intro + 1 écran de suggestions d'habitudes
 */
function Onboarding() {
  const { t } = useTranslation()
  const [stepType, setStepType] = useState<OnboardingStepType>('intro')
  const [introStep, setIntroStep] = useState(0)
  const [selectedHabits, setSelectedHabits] = useState<SuggestedHabit[]>([])
  const navigate = useNavigate()
  const { updatePreferences, addHabit } = useAppData()

  const isFirstIntroStep = introStep === 0
  const isLastIntroStep = introStep === ONBOARDING_STEP_KEYS.length - 1
  const stepKey = ONBOARDING_STEP_KEYS[introStep]

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
  const totalSteps = ONBOARDING_STEP_KEYS.length + 1
  const currentStepIndex = stepType === 'intro' ? introStep : ONBOARDING_STEP_KEYS.length

  /**
   * Texte du bouton suivant
   */
  const getNextButtonText = () => {
    if (stepType === 'suggestions') {
      return selectedHabits.length > 0
        ? t('onboarding.navigation.createCount', { count: selectedHabits.length })
        : t('onboarding.navigation.startWithout')
    }
    return isLastIntroStep
      ? t('onboarding.navigation.chooseHabits')
      : t('onboarding.navigation.next')
  }

  return (
    <div className="page page-onboarding">
      <div className="onboarding__container">
        {stepType === 'intro' ? (
          <OnboardingStep
            key={introStep}
            illustration={ONBOARDING_ILLUSTRATIONS[introStep]}
            title={t(`onboarding.steps.${stepKey}.title`)}
            description={t(`onboarding.steps.${stepKey}.description`)}
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
          <div className="onboarding__dots" role="tablist" aria-label={t('navigation.today')}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`onboarding__dot ${index === currentStepIndex ? 'onboarding__dot--active' : ''}`}
                role="tab"
                aria-selected={index === currentStepIndex}
                aria-label={`${index + 1}/${totalSteps}`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="onboarding__buttons">
            {(stepType === 'suggestions' || !isFirstIntroStep) && (
              <Button variant="ghost" onClick={handlePrevious} aria-label={t('common.previous')}>
                {t('common.back')}
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
                {t('onboarding.navigation.skip')}
              </button>
            </div>
          )}
        </nav>
      </footer>
    </div>
  )
}

export default Onboarding
