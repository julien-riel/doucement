/**
 * StepIndicator - Visual progress indicator for the wizard
 */

interface StepIndicatorProps {
  /** Current step index (0-based) */
  currentIndex: number
  /** Total number of steps */
  totalSteps: number
}

/**
 * Visual step indicator showing progress through the wizard
 */
export function StepIndicator({ currentIndex, totalSteps }: StepIndicatorProps) {
  return (
    <div className="create-habit__progress" aria-label="Progression du wizard">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            className={`create-habit__step-indicator ${
              i < currentIndex
                ? 'create-habit__step-indicator--completed'
                : i === currentIndex
                  ? 'create-habit__step-indicator--active'
                  : 'create-habit__step-indicator--pending'
            }`}
            aria-current={i === currentIndex ? 'step' : undefined}
          >
            {i < currentIndex ? '✓' : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`create-habit__step-line ${i < currentIndex ? 'create-habit__step-line--completed' : ''}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
