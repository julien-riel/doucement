import { useTranslation } from 'react-i18next'
import { HabitDifficulty } from '../../types'
import './DifficultyBadge.css'

export interface DifficultyBadgeProps {
  /** Niveau de difficulté */
  difficulty: HabitDifficulty
  /** Afficher le texte complet (défaut: true) */
  showLabel?: boolean
}

/**
 * Configuration des icônes pour chaque niveau de difficulté
 */
const DIFFICULTY_ICONS: Record<HabitDifficulty, string> = {
  easy: '🌱',
  moderate: '🌿',
  challenging: '🌳',
}

/**
 * Badge de difficulté coloré
 * Couleurs: easy=vert, moderate=orange, challenging=violet
 */
function DifficultyBadge({ difficulty, showLabel = true }: DifficultyBadgeProps) {
  const { t } = useTranslation()
  const icon = DIFFICULTY_ICONS[difficulty]
  const label = t(`habits.difficulty.${difficulty}`)
  const tooltip = t(`habits.difficulty.tooltips.${difficulty}`)
  const difficultyLabel = t('habits.difficulty.label')

  return (
    <span
      className={`difficulty-badge difficulty-badge--${difficulty}`}
      title={tooltip}
      aria-label={`${difficultyLabel} : ${label}. ${tooltip}`}
    >
      <span className="difficulty-badge__icon" aria-hidden="true">
        {icon}
      </span>
      {showLabel && <span className="difficulty-badge__label">{label}</span>}
    </span>
  )
}

export default DifficultyBadge
