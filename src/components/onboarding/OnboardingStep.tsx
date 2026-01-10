import { ReactNode } from 'react'
import './OnboardingStep.css'

export interface OnboardingStepProps {
  /** Titre principal de l'étape */
  title: string
  /** Illustration (emoji ou élément React) */
  illustration?: ReactNode
  /** Texte descriptif */
  description: string
  /** Contenu additionnel optionnel */
  children?: ReactNode
}

/**
 * Composant OnboardingStep
 * Une étape de l'écran d'onboarding avec titre, illustration et texte
 *
 * @example
 * <OnboardingStep
 *   title="Bienvenue"
 *   illustration="🌱"
 *   description="Commençons doucement..."
 * />
 */
function OnboardingStep({ title, illustration, description, children }: OnboardingStepProps) {
  return (
    <div className="onboarding-step">
      {illustration && (
        <div className="onboarding-step__illustration" aria-hidden="true">
          {illustration}
        </div>
      )}
      <h1 className="onboarding-step__title">{title}</h1>
      <p className="onboarding-step__description">
        {description.split('\n').map((line, index, arr) => (
          <span key={index}>
            {line}
            {index < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
      {children && <div className="onboarding-step__content">{children}</div>}
    </div>
  )
}

export default OnboardingStep
