/**
 * NavigationButtons - Footer navigation for the wizard
 */

import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui'

interface NavigationButtonsProps {
  /** Callback for back button */
  onBack: () => void
  /** Callback for next button */
  onNext: () => void
  /** Label for the next button */
  nextLabel: string
  /** Variant for the next button */
  nextVariant?: 'primary' | 'success'
  /** Whether the next button is disabled */
  nextDisabled?: boolean
}

/**
 * Footer navigation buttons for the wizard
 */
export function NavigationButtons({
  onBack,
  onNext,
  nextLabel,
  nextVariant = 'primary',
  nextDisabled = false,
}: NavigationButtonsProps) {
  const { t } = useTranslation()

  return (
    <footer className="create-habit__footer">
      <div className="create-habit__buttons">
        <Button variant="ghost" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button variant={nextVariant} onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </footer>
  )
}
