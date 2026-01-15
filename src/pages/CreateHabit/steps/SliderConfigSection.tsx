/**
 * SliderConfigSection - Configuration du slider avec mapping emoji pour CreateHabit
 *
 * Permet de configurer min/max et les plages emoji pour le mode slider.
 * Affiche une prévisualisation du slider en temps réel.
 */

import { useState, useCallback, useEffect } from 'react'
import { SliderConfig, EmojiRange } from '../../../types'
import { HabitFormState } from '../../../types/habitForm'
import { getEmojiForValue, DEFAULT_MOOD_SLIDER_CONFIG } from '../../../utils/slider'
import EmojiPicker from '../../../components/ui/EmojiPicker'
import './SliderConfigSection.css'

/**
 * Messages pour la section SliderConfig
 */
const SLIDER_CONFIG = {
  sectionTitle: 'Configuration du slider',
  sectionHint: 'Définissez la plage de valeurs et les emojis associés',
  minLabel: 'Valeur minimale',
  maxLabel: 'Valeur maximale',
  stepLabel: 'Pas',
  emojiRangesTitle: 'Plages emoji',
  emojiRangesHint: 'Associez un emoji à chaque plage de valeurs',
  addRangeButton: 'Ajouter une plage',
  removeRangeButton: 'Supprimer',
  previewTitle: 'Prévisualisation',
  presets: {
    title: 'Préréglages',
    mood: 'Humeur',
    energy: 'Énergie',
    pain: 'Douleur',
    custom: 'Personnalisé',
  },
  fromLabel: 'De',
  toLabel: 'À',
  emojiLabel: 'Emoji',
} as const

/**
 * Presets for common slider configurations
 */
const SLIDER_PRESETS: Record<string, SliderConfig> = {
  mood: {
    min: 1,
    max: 10,
    step: 1,
    emojiRanges: [
      { from: 1, to: 3, emoji: '😢' },
      { from: 4, to: 5, emoji: '😕' },
      { from: 6, to: 7, emoji: '😊' },
      { from: 8, to: 10, emoji: '😄' },
    ],
  },
  energy: {
    min: 1,
    max: 10,
    step: 1,
    emojiRanges: [
      { from: 1, to: 2, emoji: '😴' },
      { from: 3, to: 4, emoji: '🥱' },
      { from: 5, to: 6, emoji: '😐' },
      { from: 7, to: 8, emoji: '⚡' },
      { from: 9, to: 10, emoji: '🔥' },
    ],
  },
  pain: {
    min: 0,
    max: 10,
    step: 1,
    emojiRanges: [
      { from: 0, to: 0, emoji: '😊' },
      { from: 1, to: 3, emoji: '🙂' },
      { from: 4, to: 6, emoji: '😐' },
      { from: 7, to: 8, emoji: '😣' },
      { from: 9, to: 10, emoji: '😖' },
    ],
  },
}

/**
 * Props for SliderConfigSection
 */
interface SliderConfigSectionProps {
  form: HabitFormState
  updateForm: <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => void
}

/**
 * Component for a single emoji range row
 */
interface EmojiRangeRowProps {
  range: EmojiRange
  index: number
  min: number
  max: number
  onUpdate: (index: number, range: EmojiRange) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function EmojiRangeRow({
  range,
  index,
  min,
  max,
  onUpdate,
  onRemove,
  canRemove,
}: EmojiRangeRowProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (!isNaN(value)) {
        onUpdate(index, { ...range, from: value })
      }
    },
    [index, range, onUpdate]
  )

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      if (!isNaN(value)) {
        onUpdate(index, { ...range, to: value })
      }
    },
    [index, range, onUpdate]
  )

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      onUpdate(index, { ...range, emoji })
      setShowEmojiPicker(false)
    },
    [index, range, onUpdate]
  )

  return (
    <div className="slider-config__range-row">
      <div className="slider-config__range-values">
        <label className="slider-config__range-label">
          <span className="slider-config__range-label-text">{SLIDER_CONFIG.fromLabel}</span>
          <input
            type="number"
            className="slider-config__range-input"
            value={range.from}
            onChange={handleFromChange}
            min={min}
            max={max}
          />
        </label>
        <label className="slider-config__range-label">
          <span className="slider-config__range-label-text">{SLIDER_CONFIG.toLabel}</span>
          <input
            type="number"
            className="slider-config__range-input"
            value={range.to}
            onChange={handleToChange}
            min={min}
            max={max}
          />
        </label>
      </div>
      <div className="slider-config__range-emoji">
        <button
          type="button"
          className="slider-config__emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          aria-label={`Choisir emoji pour plage ${range.from}-${range.to}`}
        >
          {range.emoji}
        </button>
        {showEmojiPicker && (
          <div className="slider-config__emoji-picker-container">
            <EmojiPicker value={range.emoji} onChange={handleEmojiSelect} />
          </div>
        )}
      </div>
      {canRemove && (
        <button
          type="button"
          className="slider-config__remove-button"
          onClick={() => onRemove(index)}
          aria-label="Supprimer cette plage"
        >
          ×
        </button>
      )}
    </div>
  )
}

/**
 * SliderConfigSection component
 * Displayed when trackingMode='slider' in CreateHabit wizard
 */
export function SliderConfigSection({ form, updateForm }: SliderConfigSectionProps) {
  // Initialize config with default if not set
  const config: SliderConfig = form.sliderConfig ?? DEFAULT_MOOD_SLIDER_CONFIG

  // Local state for preview value
  const [previewValue, setPreviewValue] = useState(Math.round((config.min + config.max) / 2))

  // Update preview value when min/max changes
  useEffect(() => {
    const mid = Math.round((config.min + config.max) / 2)
    if (previewValue < config.min || previewValue > config.max) {
      setPreviewValue(mid)
    }
  }, [config.min, config.max, previewValue])

  const updateConfig = useCallback(
    (updates: Partial<SliderConfig>) => {
      updateForm('sliderConfig', { ...config, ...updates })
    },
    [config, updateForm]
  )

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value < config.max) {
      updateConfig({ min: value })
    }
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > config.min) {
      updateConfig({ max: value })
    }
  }

  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      updateConfig({ step: value })
    }
  }

  const handleRangeUpdate = (index: number, range: EmojiRange) => {
    const newRanges = [...(config.emojiRanges ?? [])]
    newRanges[index] = range
    updateConfig({ emojiRanges: newRanges })
  }

  const handleRangeRemove = (index: number) => {
    const newRanges = [...(config.emojiRanges ?? [])]
    newRanges.splice(index, 1)
    updateConfig({ emojiRanges: newRanges })
  }

  const handleAddRange = () => {
    const ranges = config.emojiRanges ?? []
    const lastRange = ranges[ranges.length - 1]
    const newFrom = lastRange ? lastRange.to + 1 : config.min
    const newTo = Math.min(newFrom + 2, config.max)
    const newRange: EmojiRange = {
      from: newFrom,
      to: newTo,
      emoji: '😐',
    }
    updateConfig({ emojiRanges: [...ranges, newRange] })
  }

  const handlePresetSelect = (preset: string) => {
    if (preset === 'custom') {
      // Keep current config but allow editing
      return
    }
    const presetConfig = SLIDER_PRESETS[preset]
    if (presetConfig) {
      updateForm('sliderConfig', presetConfig)
      setPreviewValue(Math.round((presetConfig.min + presetConfig.max) / 2))
    }
  }

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewValue(parseInt(e.target.value, 10))
  }

  const previewEmoji = getEmojiForValue(previewValue, config)
  const previewPercentage = ((previewValue - config.min) / (config.max - config.min)) * 100

  return (
    <div className="slider-config card card--default">
      <h3 className="slider-config__title">{SLIDER_CONFIG.sectionTitle}</h3>
      <p className="slider-config__hint">{SLIDER_CONFIG.sectionHint}</p>

      {/* Presets */}
      <div className="slider-config__presets">
        <span className="slider-config__presets-label">{SLIDER_CONFIG.presets.title}</span>
        <div className="slider-config__presets-buttons">
          <button
            type="button"
            className="slider-config__preset-button"
            onClick={() => handlePresetSelect('mood')}
          >
            {SLIDER_CONFIG.presets.mood}
          </button>
          <button
            type="button"
            className="slider-config__preset-button"
            onClick={() => handlePresetSelect('energy')}
          >
            {SLIDER_CONFIG.presets.energy}
          </button>
          <button
            type="button"
            className="slider-config__preset-button"
            onClick={() => handlePresetSelect('pain')}
          >
            {SLIDER_CONFIG.presets.pain}
          </button>
        </div>
      </div>

      {/* Min/Max/Step */}
      <div className="slider-config__values">
        <label className="slider-config__value-label">
          <span>{SLIDER_CONFIG.minLabel}</span>
          <input
            type="number"
            className="slider-config__value-input"
            value={config.min}
            onChange={handleMinChange}
          />
        </label>
        <label className="slider-config__value-label">
          <span>{SLIDER_CONFIG.maxLabel}</span>
          <input
            type="number"
            className="slider-config__value-input"
            value={config.max}
            onChange={handleMaxChange}
          />
        </label>
        <label className="slider-config__value-label">
          <span>{SLIDER_CONFIG.stepLabel}</span>
          <input
            type="number"
            className="slider-config__value-input"
            value={config.step}
            onChange={handleStepChange}
            min={1}
          />
        </label>
      </div>

      {/* Emoji Ranges */}
      <div className="slider-config__ranges">
        <h4 className="slider-config__ranges-title">{SLIDER_CONFIG.emojiRangesTitle}</h4>
        <p className="slider-config__ranges-hint">{SLIDER_CONFIG.emojiRangesHint}</p>
        <div className="slider-config__ranges-list">
          {(config.emojiRanges ?? []).map((range, index) => (
            <EmojiRangeRow
              key={index}
              range={range}
              index={index}
              min={config.min}
              max={config.max}
              onUpdate={handleRangeUpdate}
              onRemove={handleRangeRemove}
              canRemove={(config.emojiRanges?.length ?? 0) > 2}
            />
          ))}
        </div>
        {(config.emojiRanges?.length ?? 0) < 4 && (
          <button
            type="button"
            className="slider-config__add-range-button"
            onClick={handleAddRange}
          >
            + {SLIDER_CONFIG.addRangeButton}
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="slider-config__preview">
        <h4 className="slider-config__preview-title">{SLIDER_CONFIG.previewTitle}</h4>
        <div className="slider-config__preview-content">
          <div className="slider-config__preview-emoji">{previewEmoji}</div>
          <div className="slider-config__preview-value">{previewValue}</div>
          <div className="slider-config__preview-slider-container">
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={previewValue}
              onChange={handlePreviewChange}
              className="slider-config__preview-slider"
            />
            <div
              className="slider-config__preview-progress"
              style={{ width: `${previewPercentage}%` }}
            />
          </div>
          <div className="slider-config__preview-labels">
            <span>{config.min}</span>
            <span>{config.max}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
