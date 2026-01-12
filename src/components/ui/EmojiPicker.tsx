import { useState, useRef, useEffect } from 'react'
import EmojiPickerLib, { EmojiClickData, Theme, Categories } from 'emoji-picker-react'
import './EmojiPicker.css'

export interface EmojiPickerProps {
  /** Emoji actuellement sélectionné */
  value: string
  /** Callback appelé lors de la sélection d'un emoji */
  onChange: (emoji: string) => void
  /** Label affiché au-dessus du sélecteur */
  label?: string
}

/**
 * Composant de sélection d'emoji avec picker complet
 *
 * @example
 * <EmojiPicker
 *   label="Emoji"
 *   value={emoji}
 *   onChange={(e) => setEmoji(e)}
 * />
 */
export default function EmojiPicker({ value, onChange, label }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji)
    setIsOpen(false)
  }

  // Fermer le picker si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="emoji-picker" ref={pickerRef}>
      {label && <span className="emoji-picker__label">{label}</span>}

      <button
        type="button"
        className="emoji-picker__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Emoji sélectionné: ${value}. Cliquer pour changer`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="emoji-picker__current">{value || '😀'}</span>
        <span className="emoji-picker__hint">Changer</span>
      </button>

      {isOpen && (
        <div className="emoji-picker__dropdown" role="dialog" aria-label="Sélecteur d'emoji">
          <EmojiPickerLib
            onEmojiClick={handleEmojiClick}
            theme={Theme.LIGHT}
            searchPlaceHolder="Rechercher..."
            skinTonesDisabled
            width="100%"
            height={350}
            categories={[
              { category: Categories.SUGGESTED, name: 'Récents' },
              { category: Categories.SMILEYS_PEOPLE, name: 'Visages' },
              { category: Categories.ANIMALS_NATURE, name: 'Animaux' },
              { category: Categories.FOOD_DRINK, name: 'Nourriture' },
              { category: Categories.TRAVEL_PLACES, name: 'Voyages' },
              { category: Categories.ACTIVITIES, name: 'Activités' },
              { category: Categories.OBJECTS, name: 'Objets' },
              { category: Categories.SYMBOLS, name: 'Symboles' },
              { category: Categories.FLAGS, name: 'Drapeaux' },
            ]}
          />
        </div>
      )}
    </div>
  )
}
