/**
 * FilterChips - Composant générique pour les filtres en chips
 *
 * Utilisé pour afficher une liste de filtres sélectionnables avec support
 * du mode 'all' pour désélection.
 */

export interface FilterOption<T extends string> {
  /** Valeur unique de l'option */
  value: T
  /** Label affiché */
  label: string
  /** Emoji optionnel affiché avant le label */
  emoji?: string
}

export interface FilterChipsProps<T extends string> {
  /** Options disponibles */
  options: FilterOption<T>[]
  /** Valeur actuellement sélectionnée */
  value: T
  /** Callback de changement */
  onChange: (value: T) => void
  /** Label pour l'option "Tous" (valeur 'all') */
  allLabel?: string
  /** Classe CSS additionnelle */
  className?: string
  /** Variante de style */
  variant?: 'primary' | 'secondary'
}

/**
 * Composant de filtres en chips horizontal avec scroll
 */
function FilterChips<T extends string>({
  options,
  value,
  onChange,
  allLabel,
  className = '',
  variant = 'primary',
}: FilterChipsProps<T>) {
  const variantClass = variant === 'secondary' ? 'filter-chips--secondary' : ''

  return (
    <div className={`filter-chips ${variantClass} ${className}`}>
      {allLabel && (
        <button
          type="button"
          className={`filter-chips__chip ${value === ('all' as T) ? 'filter-chips__chip--active' : ''}`}
          onClick={() => onChange('all' as T)}
        >
          {allLabel}
        </button>
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`filter-chips__chip ${value === option.value ? 'filter-chips__chip--active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.emoji && <span className="filter-chips__emoji">{option.emoji}</span>}
          <span className="filter-chips__label">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export default FilterChips
