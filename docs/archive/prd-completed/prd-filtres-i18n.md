# PRD: Filtres de suggestions et Internationalisation

## Objectif

Améliorer l'expérience de création d'habitudes avec des filtres intelligents et préparer l'application pour un public international.

## Contexte

L'écran "Habitudes à fort impact" affiche actuellement un carrousel de suggestions avec des filtres par catégorie (icônes seules). Les utilisateurs ont besoin de :
1. Filtrer par difficulté et moment de la journée
2. Voir le nom des catégories (pas seulement l'icône)
3. Que le carrousel revienne au début lors d'un changement de filtre

De plus, l'application est 100% en français. Pour toucher un public plus large, nous devons supporter plusieurs langues.

## Use cases

### UC1: Filtrer les habitudes suggérées
En tant qu'utilisateur, je veux filtrer les habitudes par :
- **Catégorie** : Sommeil, Mouvement, Méditation, etc.
- **Difficulté** : Facile, Modéré, Difficile
- **Moment** : Matin, Après-midi, Soir, Nuit

### UC2: Navigation fluide du carrousel
En tant qu'utilisateur, quand je change de filtre, le carrousel doit :
- Revenir au premier élément
- Afficher le nombre de résultats ("6 habitudes")

### UC3: Voir le nom des catégories
En tant qu'utilisateur, je veux voir "Sommeil" et non juste l'icône "😴" pour mieux comprendre les catégories.

### UC4: Utiliser l'app dans ma langue
En tant qu'utilisateur anglophone/hispanophone, je veux :
- Que l'interface soit dans ma langue
- Que les messages d'encouragement soient traduits
- Que les suggestions d'habitudes soient adaptées

## Architecture technique

### Structure des fichiers (Filtres)

```
src/
├── pages/
│   └── CreateHabit.tsx          # Modifier pour ajouter les filtres
│   └── CreateHabit.css          # Styles des filtres
├── components/ui/
│   └── HabitCarousel.tsx        # Ajouter méthode resetToFirst()
│   └── FilterChips.tsx          # NOUVEAU: Composant de filtres réutilisable
```

### Structure des fichiers (i18n)

```
src/
├── i18n/
│   ├── index.ts                 # Configuration i18next
│   ├── locales/
│   │   ├── fr.json              # Traductions françaises (source)
│   │   ├── en.json              # Traductions anglaises
│   │   └── es.json              # (Optionnel futur)
├── hooks/
│   └── useLanguage.ts           # NOUVEAU: Hook pour la langue
├── components/
│   └── LanguageSelector.tsx     # NOUVEAU: Sélecteur de langue
```

## Structures de données

### Filtres
```typescript
interface SuggestionFilters {
  category: HabitCategory | 'all'
  difficulty: HabitDifficulty | 'all'
  timeOfDay: TimeOfDay | 'all'
}

// Déjà existants dans types.ts
type HabitDifficulty = 'easy' | 'moderate' | 'challenging'
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
```

### i18n
```typescript
// Structure d'une locale
interface LocaleMessages {
  common: { ... }
  habits: { ... }
  messages: { ... }
  suggestions: { ... }
}

// Langues supportées
type SupportedLocale = 'fr' | 'en'
```

## Composants UI

### FilterChips
Props:
- `filters`: SuggestionFilters
- `onChange`: (filters: SuggestionFilters) => void
- `resultCount`: number

Comportement:
- Chips horizontaux scrollables
- Multi-sélection possible (catégorie + difficulté + moment)
- Affiche le compteur de résultats

### LanguageSelector
Props:
- `value`: SupportedLocale
- `onChange`: (locale: SupportedLocale) => void

Comportement:
- Dropdown avec drapeaux/codes
- Sauvegarde dans localStorage
- Détecte la langue du navigateur au premier lancement

## Contraintes design

### Filtres
- Utiliser des chips conformes au design system (radius-full, spacing-2)
- Couleur active: primary-500 (#F27D16)
- Couleur inactive: neutral-100 avec texte neutral-600
- Minimum 44px de hauteur (touch target)
- Scroll horizontal si trop de chips

### Labels de difficulté (en français)
- `easy` → "Facile"
- `moderate` → "Modéré"
- `challenging` → "Exigeant" (pas "Difficile" - vocabulaire positif)

### Labels de moment
- `morning` → "🌅 Matin"
- `afternoon` → "☀️ Après-midi"
- `evening` → "🌙 Soir"
- `night` → "🌃 Nuit"

## Critères de succès

### Phase 1: Bug fix carrousel
- [ ] Le carrousel revient au premier élément quand on change de catégorie
- [ ] Pas de flash ou de saut visible

### Phase 2: Amélioration filtres catégorie
- [ ] Les noms de catégories sont visibles (pas seulement les icônes)
- [ ] Le compteur de résultats s'affiche ("6 habitudes")

### Phase 3: Filtres avancés
- [ ] Filtre par difficulté fonctionnel
- [ ] Filtre par moment de la journée fonctionnel
- [ ] Les filtres sont combinables

### Phase 4: Internationalisation
- [ ] Architecture i18n en place (i18next)
- [ ] Tous les textes français extraits dans fr.json
- [ ] Traduction anglaise complète (en.json)
- [ ] Sélecteur de langue dans les paramètres
- [ ] Détection automatique de la langue du navigateur

## Notes d'implémentation

### Réinitialisation du carrousel
Le composant `HabitCarousel` utilise probablement un état interne pour l'index courant. Options:
1. Exposer une ref avec `resetToFirst()` via `useImperativeHandle`
2. Utiliser une `key` prop qui change avec les filtres pour forcer le remount
3. Passer `currentIndex` et `onIndexChange` en props (controlled mode)

L'option 2 (key prop) est la plus simple et suffisante pour ce cas.

### Extraction i18n
Utiliser `react-i18next` avec:
- `useTranslation()` hook dans les composants
- Namespace par domaine (common, habits, messages)
- Interpolation pour les valeurs dynamiques: `t('habits.dose', { value: 10, unit: 'minutes' })`
