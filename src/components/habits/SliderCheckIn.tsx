/**
 * SliderCheckIn - Widget slider avec emoji dynamique
 *
 * Permet de saisir une valeur sur une échelle visuelle avec
 * un emoji qui change selon la valeur sélectionnée.
 */

import { useState, useCallback } from 'react'
import { SliderConfig } from '../../types'
import { getEmojiForValue, DEFAULT_MOOD_SLIDER_CONFIG } from '../../utils/slider'
import Button from '../ui/Button'
import './SliderCheckIn.css'

export interface SliderCheckInProps {
  /** Configuration du slider */
  config?: SliderConfig
  /** Valeur actuelle */
  currentValue?: number
  /** Callback quand l'utilisateur valide */
  onCheckIn: (value: number) => void
  /** Désactivé */
  disabled?: boolean
}

/**
 * Composant de check-in slider avec emoji
 *
 * @example
 * <SliderCheckIn
 *   config={{
 *     min: 1,
 *     max: 10,
 *     step: 1,
 *     emojiRanges: [
 *       { from: 1, to: 3, emoji: '😢' },
 *       { from: 4, to: 7, emoji: '😐' },
 *       { from: 8, to: 10, emoji: '😊' },
 *     ]
 *   }}
 *   onCheckIn={(value) => handleCheckIn(value)}
 * />
 */
function SliderCheckIn({
  config = DEFAULT_MOOD_SLIDER_CONFIG,
  currentValue,
  onCheckIn,
  disabled = false,
}: SliderCheckInProps) {
  // Utiliser la valeur actuelle ou le milieu de la plage
  const initialValue = currentValue ?? Math.round((config.min + config.max) / 2)
  const [value, setValue] = useState(initialValue)
  const [hasChanged, setHasChanged] = useState(false)

  const emoji = getEmojiForValue(value, config)
  const hasExistingValue = currentValue !== undefined

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setValue(newValue)
    setHasChanged(true)
  }, [])

  const handleSubmit = useCallback(() => {
    onCheckIn(value)
    setHasChanged(false)
  }, [onCheckIn, value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permettre l'ajustement avec les touches fléchées
      const step = config.step
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        setValue((prev) => Math.max(config.min, prev - step))
        setHasChanged(true)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        setValue((prev) => Math.min(config.max, prev + step))
        setHasChanged(true)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [config.min, config.max, config.step, handleSubmit]
  )

  // Calculer le pourcentage pour la position du thumb
  const percentage = ((value - config.min) / (config.max - config.min)) * 100

  return (
    <div className="slider-checkin">
      {/* Emoji dynamique */}
      <div className="slider-checkin__emoji" aria-hidden="true">
        {emoji}
      </div>

      {/* Valeur numérique */}
      <div className="slider-checkin__value" aria-label={`Valeur: ${value}`}>
        {value}
      </div>

      {/* Slider */}
      <div className="slider-checkin__track-container">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="slider-checkin__input"
          aria-label="Sélectionner une valeur"
          aria-valuemin={config.min}
          aria-valuemax={config.max}
          aria-valuenow={value}
        />
        {/* Track de progression */}
        <div className="slider-checkin__progress" style={{ width: `${percentage}%` }} />
      </div>

      {/* Labels min/max */}
      <div className="slider-checkin__labels">
        <span className="slider-checkin__label">{config.min}</span>
        <span className="slider-checkin__label">{config.max}</span>
      </div>

      {/* Bouton de validation */}
      <Button
        variant={hasExistingValue && !hasChanged ? 'success' : 'primary'}
        onClick={handleSubmit}
        disabled={disabled}
        className="slider-checkin__submit"
        aria-label={hasExistingValue ? 'Modifier la valeur' : 'Valider la valeur'}
      >
        {hasExistingValue && !hasChanged ? '✓ Enregistré' : 'Valider'}
      </Button>
    </div>
  )
}

export default SliderCheckIn
