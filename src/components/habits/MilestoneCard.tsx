/**
 * MilestoneCard Component
 * Célébration des paliers de progression (milestones)
 * Phase 11 - Visualisation de l'Effet Composé
 */

import { Card, Button } from '../ui'
import { MILESTONE_CELEBRATION } from '../../constants/messages'
import type { MilestoneType } from '../../services/progression'
import './MilestoneCard.css'

export interface MilestoneCardProps {
  /** Type de milestone atteint */
  milestone: NonNullable<MilestoneType>
  /** Callback quand l'utilisateur ferme la carte */
  onDismiss: () => void
}

/**
 * Carte de célébration affichée quand un palier significatif est atteint
 * Design: fond gradient vert, animation celebrate, palier en grand
 */
function MilestoneCard({ milestone, onDismiss }: MilestoneCardProps) {
  const milestoneData = MILESTONE_CELEBRATION[milestone]

  if (!milestoneData) {
    return null
  }

  return (
    <Card variant="elevated" className="milestone-card">
      <div className="milestone-card__content">
        <div className="milestone-card__emoji" aria-hidden="true">
          {milestoneData.emoji}
        </div>

        <h2 className="milestone-card__title">{milestoneData.title}</h2>

        <p className="milestone-card__message">{milestoneData.message}</p>

        <Button variant="success" onClick={onDismiss} className="milestone-card__button">
          Continuer
        </Button>
      </div>
    </Card>
  )
}

export default MilestoneCard
