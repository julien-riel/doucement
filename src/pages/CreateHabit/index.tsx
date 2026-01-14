/**
 * CreateHabit - Habit creation wizard
 * Main entry point that orchestrates the wizard steps
 *
 * This is the refactored version that uses context for state management
 * and separate components for each step.
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CreateHabitProvider, useCreateHabitContext } from './CreateHabitContext'
import { StepChoose } from './steps/StepChoose'
import { StepType } from './steps/StepType'
import { StepDetails } from './steps/StepDetails'
import { StepIntentions } from './steps/StepIntentions'
import { StepIdentity } from './steps/StepIdentity'
import { StepConfirm } from './steps/StepConfirm'
import { StepFirstCheckIn } from './steps/StepFirstCheckIn'
import { StepIndicator } from './components/StepIndicator'
import { NavigationButtons } from './components/NavigationButtons'
import '../CreateHabit.css'

/**
 * Inner component that consumes the context
 */
function CreateHabitInner() {
  const { t } = useTranslation()
  const { step, form, stepIndex, handleNext, handleBack, isStepValid } = useCreateHabitContext()

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  /**
   * Get subtitle for current step
   */
  const getSubtitle = () => {
    switch (step) {
      case 'choose':
        return t('createHabit.steps.choose')
      case 'type':
        return t('createHabit.steps.type')
      case 'details':
        return t('createHabit.steps.details')
      case 'intentions':
        return t('createHabit.steps.intentions')
      case 'identity':
        return t('createHabit.steps.identity')
      case 'confirm':
        return t('createHabit.steps.confirm')
      default:
        return ''
    }
  }

  /**
   * Get habit preview (name with emoji) for steps 3+
   */
  const getHabitPreview = () => {
    if ((step === 'details' || step === 'intentions' || step === 'identity') && form.name.trim()) {
      return `${form.emoji} ${form.name}`
    }
    return null
  }

  /**
   * Get next button text
   */
  const getNextButtonText = () => {
    switch (step) {
      case 'choose':
        return t('createHabit.buttons.customize')
      case 'type':
        return t('common.continue')
      case 'details':
        return t('common.continue')
      case 'intentions':
        return t('common.continue')
      case 'identity':
        return t('createHabit.buttons.preview')
      case 'confirm':
        return t('createHabit.buttons.create')
      default:
        return t('common.continue')
    }
  }

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (step) {
      case 'choose':
        return <StepChoose />
      case 'type':
        return <StepType />
      case 'details':
        return <StepDetails />
      case 'intentions':
        return <StepIntentions />
      case 'identity':
        return <StepIdentity />
      case 'confirm':
        return <StepConfirm />
      case 'first-checkin':
        return <StepFirstCheckIn />
      default:
        return null
    }
  }

  // First check-in step has simplified layout (no header or footer)
  if (step === 'first-checkin') {
    return (
      <div className="page page-create-habit page-create-habit--first-checkin">
        <StepFirstCheckIn />
      </div>
    )
  }

  return (
    <div className="page page-create-habit">
      <header className="create-habit__header">
        <h1 className="create-habit__title">{t('createHabit.title')}</h1>
        <p className="create-habit__subtitle">{getSubtitle()}</p>
        {getHabitPreview() && <p className="create-habit__habit-preview">{getHabitPreview()}</p>}
      </header>

      {/* Progress indicator (hidden for choose step) */}
      {step !== 'choose' && <StepIndicator currentIndex={stepIndex - 1} totalSteps={5} />}

      {/* Step content */}
      {renderStepContent()}

      {/* Footer with navigation buttons (hidden for choose step) */}
      {step !== 'choose' && (
        <NavigationButtons
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={getNextButtonText()}
          nextVariant={step === 'confirm' ? 'success' : 'primary'}
          nextDisabled={!isStepValid}
        />
      )}
    </div>
  )
}

/**
 * CreateHabit page component
 * Wraps the inner component with the context provider
 */
function CreateHabit() {
  return (
    <CreateHabitProvider>
      <CreateHabitInner />
    </CreateHabitProvider>
  )
}

export default CreateHabit
