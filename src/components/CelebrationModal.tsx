/**
 * Doucement - Modale de célébration des jalons
 * Affichée quand un utilisateur atteint 25%, 50%, 75% ou 100% de sa cible finale
 * Inclut une animation de confetti et un message personnalisé
 */

import { useEffect, useRef, useCallback } from 'react'
import { Milestone, MilestoneLevel } from '../types/statistics'
import { getMilestoneMessage, getMilestoneEmoji } from '../services/milestones'
import Button from './ui/Button'
import './CelebrationModal.css'

interface CelebrationModalProps {
  /** Afficher la modale */
  isOpen: boolean
  /** Callback de fermeture */
  onClose: () => void
  /** Jalon atteint */
  milestone: Milestone
  /** Nom de l'habitude */
  habitName: string
  /** Emoji de l'habitude */
  habitEmoji: string
}

/**
 * Retourne le titre de célébration selon le niveau
 */
function getCelebrationTitle(level: MilestoneLevel): string {
  switch (level) {
    case 25:
      return 'Premier quart !'
    case 50:
      return 'Mi-parcours !'
    case 75:
      return 'Trois quarts !'
    case 100:
      return 'Objectif atteint !'
    default:
      return 'Félicitations !'
  }
}

/**
 * Génère une particule de confetti
 */
interface ConfettiParticle {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
  size: number
}

/**
 * Couleurs de confetti (conformes au design system)
 */
const CONFETTI_COLORS = [
  '#F27D16', // primary-500
  '#FF9A3D', // primary-400
  '#FFB870', // primary-300
  '#22C55E', // secondary-500
  '#4ADE80', // secondary-400
  '#86EFAC', // secondary-300
  '#FBBF24', // ambre
]

/**
 * Génère un ensemble de particules de confetti
 */
function generateConfetti(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
      size: 8 + Math.random() * 8,
    })
  }

  return particles
}

/**
 * Modale de célébration avec animation de confetti
 */
function CelebrationModal({
  isOpen,
  onClose,
  milestone,
  habitName,
  habitEmoji,
}: CelebrationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<ConfettiParticle[]>([])

  // Génère le confetti à l'ouverture
  useEffect(() => {
    if (isOpen) {
      confettiRef.current = generateConfetti(50)
    }
  }, [isOpen])

  // Gestion de la touche Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Écouteur clavier
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const title = getCelebrationTitle(milestone.level)
  const message = getMilestoneMessage(milestone.level)
  const milestoneEmoji = getMilestoneEmoji(milestone.level)
  const confetti = confettiRef.current

  return (
    <div
      className="celebration-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      {/* Confetti layer */}
      <div className="celebration-confetti" aria-hidden="true">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="celebration-confetti-particle"
            style={{
              left: `${particle.x}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `rotate(${particle.rotation}deg)`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
          />
        ))}
      </div>

      {/* Modal content */}
      <div
        ref={modalRef}
        className="celebration-modal"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <header className="celebration-header">
          <div className="celebration-emoji-container">
            <span className="celebration-milestone-emoji" aria-hidden="true">
              {milestoneEmoji}
            </span>
            <span className="celebration-habit-emoji" aria-hidden="true">
              {habitEmoji}
            </span>
          </div>

          <h2 id="celebration-title" className="celebration-title">
            {title}
          </h2>

          <p className="celebration-level">
            {milestone.level}% de ta cible {habitName}
          </p>
        </header>

        <div className="celebration-content">
          <p className="celebration-message">{message}</p>

          <div className="celebration-progress-visual" aria-hidden="true">
            <div className="celebration-progress-bar">
              <div className="celebration-progress-fill" style={{ width: `${milestone.level}%` }} />
            </div>
            <div className="celebration-progress-markers">
              <span className={milestone.level >= 25 ? 'active' : ''}>25%</span>
              <span className={milestone.level >= 50 ? 'active' : ''}>50%</span>
              <span className={milestone.level >= 75 ? 'active' : ''}>75%</span>
              <span className={milestone.level >= 100 ? 'active' : ''}>100%</span>
            </div>
          </div>
        </div>

        <footer className="celebration-footer">
          <Button variant="success" onClick={onClose} fullWidth>
            Continuer
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default CelebrationModal
