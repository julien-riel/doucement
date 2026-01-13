import { HabitDifficulty } from '../../types'
import './DifficultyBadge.css'

export interface DifficultyBadgeProps {
  /** Niveau de difficulté */
  difficulty: HabitDifficulty
  /** Afficher le texte complet (défaut: true) */
  showLabel?: boolean
}

/**
 * Configuration pour chaque niveau de difficulté
 */
const DIFFICULTY_CONFIG: Record<
  HabitDifficulty,
  {
    label: string
    icon: string
    tooltip: string
  }
> = {
  easy: {
    label: 'Facile',
    icon: '🌱',
    tooltip: 'Idéal pour commencer doucement',
  },
  moderate: {
    label: 'Modéré',
    icon: '🌿',
    tooltip: "Demande un peu plus d'engagement",
  },
  challenging: {
    label: 'Exigeant',
    icon: '🌳',
    tooltip: 'Pour ceux qui aiment les défis',
  },
}

/**
 * Badge de difficulté coloré
 * Couleurs: easy=vert, moderate=orange, challenging=violet
 */
function DifficultyBadge({ difficulty, showLabel = true }: DifficultyBadgeProps) {
  const config = DIFFICULTY_CONFIG[difficulty]

  return (
    <span
      className={`difficulty-badge difficulty-badge--${difficulty}`}
      title={config.tooltip}
      aria-label={`Difficulté : ${config.label}. ${config.tooltip}`}
    >
      <span className="difficulty-badge__icon" aria-hidden="true">
        {config.icon}
      </span>
      {showLabel && <span className="difficulty-badge__label">{config.label}</span>}
    </span>
  )
}

export default DifficultyBadge
