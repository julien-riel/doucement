# PRD - Améliorations UX et Habitudes Prioritaires

## Objectif

Améliorer l'expérience utilisateur de Doucement avec 15 fonctionnalités :
- Tri et regroupement logique des habitudes par moment de la journée
- Interface de création plus fluide (carrousel, scroll, emojis)
- Flexibilité accrue (changement de type, annulation des saisies cumulatives)
- Enrichissement du catalogue d'habitudes prioritaires avec sources scientifiques

## Contexte

L'application Doucement aide les utilisateurs à construire des habitudes progressivement. Les retours utilisateurs indiquent plusieurs points de friction :
- Les habitudes ne sont pas ordonnées logiquement sur la page "Aujourd'hui"
- La navigation dans le wizard de création peut être améliorée
- Le catalogue d'habitudes suggérées pourrait être enrichi
- Certaines fonctionnalités manquent de flexibilité (changer le type, annuler des saisies)

## Use Cases

### UC1 - Tri des habitudes par moment
**Acteur** : Utilisateur sur la page "Aujourd'hui"
**Scénario** : L'utilisateur voit ses habitudes regroupées par moment (Matin/Après-midi/Soir) avec "Se coucher à heure fixe" naturellement en fin de journée.

### UC2 - Carrousel d'habitudes suggérées
**Acteur** : Utilisateur créant une nouvelle habitude
**Scénario** : L'utilisateur fait défiler horizontalement les cartes d'habitudes suggérées, avec pagination par points.

### UC3 - Changement de type d'habitude
**Acteur** : Utilisateur modifiant une habitude existante
**Scénario** : L'utilisateur peut passer de "Augmenter" à "Maintenir" pour stabiliser une habitude qu'il a bien développée.

### UC4 - Annulation de saisies cumulatives
**Acteur** : Utilisateur ayant fait une erreur de saisie
**Scénario** : L'utilisateur peut annuler sa dernière saisie cumulative, comme c'est possible avec le mode compteur.

### UC5 - Découverte d'habitudes avec sources
**Acteur** : Utilisateur cherchant à comprendre le fondement scientifique
**Scénario** : L'utilisateur clique sur "En savoir plus" et voit les références scientifiques validant l'habitude.

## Architecture technique

### Nouveaux champs de données

```typescript
// Dans Habit
interface Habit {
  // ... champs existants
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'  // Nouveau champ
  cumulativeOperations?: CumulativeOperation[]  // Pour l'historique des saisies cumulatives
}

interface CumulativeOperation {
  id: string
  value: number
  timestamp: string
}

// Dans SuggestedHabit
interface SuggestedHabit {
  // ... champs existants
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  difficulty: 'easy' | 'moderate' | 'challenging'
  sources?: string[]  // URLs des sources scientifiques
}
```

### Fichiers impactés

**Types et constantes :**
- `src/types/index.ts` - Ajout de `TimeOfDay`, `CumulativeOperation`, `HabitDifficulty`
- `src/constants/suggestedHabits.ts` - Ajout des nouvelles habitudes et champs

**Composants :**
- `src/components/ui/HabitCarousel.tsx` - Nouveau composant carrousel
- `src/components/ui/EmojiPicker.tsx` - Ajout de suggestions contextuelles
- `src/components/ui/TimeOfDaySelector.tsx` - Nouveau sélecteur de moment
- `src/components/ui/SourcesModal.tsx` - Modal pour afficher les sources
- `src/components/SuggestedHabitCard.tsx` - Ajout badge difficulté et bouton sources

**Pages :**
- `src/pages/Today.tsx` - Regroupement par moment
- `src/pages/CreateHabit.tsx` - Carrousel, scroll auto, étape type modifiable
- `src/pages/HabitList.tsx` - Collapse archivées par défaut
- `src/pages/CheckIn.tsx` - Historique saisies cumulatives avec annulation

**Services :**
- `src/services/storage.ts` - Migration de schéma pour nouveaux champs

## Structures de données

### Nouvelles habitudes prioritaires

| ID | Nom | Direction | Unité | Mode tracking | Difficulté |
|----|-----|-----------|-------|---------------|------------|
| `hydration-water` | Boire plus d'eau | increase | verres | counter | easy |
| `substance-coffee` | Réduire le café | decrease | tasses | detailed | moderate |
| `finance-savings` | Économiser | increase | $/semaine | detailed (weekly) | moderate |
| `learning-language` | Apprendre une langue | increase | minutes | detailed | challenging |
| `hygiene-floss` | Soie dentaire | increase | fois/semaine | simple (weekly) | easy |
| `food-restaurant` | Moins au restaurant | decrease | repas/semaine | counter (weekly) | moderate |
| `food-mealprep` | Cuisiner à l'avance | increase | repas/semaine | counter (weekly) | moderate |
| `social-quality-time` | Temps de qualité | increase | minutes | detailed | easy |
| `productivity-deep-work` | Travail profond | increase | minutes | detailed | challenging |
| `gratitude-journal` | Journal de gratitude | increase | entrées | simple | easy |

### Mapping emojis contextuels

```typescript
const CONTEXTUAL_EMOJIS: Record<HabitCategory, string[]> = {
  sleep: ['🌙', '😴', '🛏️', '💤', '🌛', '⭐'],
  movement: ['🏃', '💪', '🚶', '🏋️', '🚴', '🧗'],
  mindfulness: ['🧘', '🙏', '🌬️', '☮️', '🕯️', '🌸'],
  screen: ['📱', '📵', '🔇', '🖥️', '⏰', '🚫'],
  reading: ['📖', '📚', '📕', '🔖', '📝', '✏️'],
  substance: ['🚭', '☕', '🍷', '💊', '🚰', '🧃'],
  finance: ['💰', '💵', '🏦', '📊', '💳', '🎯'],
  hygiene: ['🦷', '🪥', '🧴', '🚿', '✨', '💎'],
  food: ['🍽️', '🥗', '🍳', '👨‍🍳', '🥡', '📦'],
  social: ['👥', '❤️', '🤝', '💬', '☎️', '🎉'],
  productivity: ['⏱️', '📋', '🎯', '💻', '🧠', '⚡'],
  gratitude: ['🙏', '📓', '✨', '💖', '🌟', '🌈'],
}
```

## Composants UI

### HabitCarousel
```tsx
interface HabitCarouselProps {
  habits: SuggestedHabit[]
  onSelect: (habit: SuggestedHabit) => void
  itemsPerView?: number  // 1 sur mobile, 2-3 sur desktop
}
```
- Défilement horizontal avec swipe/drag
- Points de pagination
- Navigation par flèches (desktop)
- Animation fluide

### TimeOfDaySelector
```tsx
interface TimeOfDaySelectorProps {
  value: TimeOfDay | undefined
  onChange: (value: TimeOfDay) => void
}
```
- 4 boutons : 🌅 Matin | ☀️ Après-midi | 🌙 Soir | 🌃 Nuit
- Style cohérent avec les autres sélecteurs (trackingMode, entryMode)

### SourcesModal
```tsx
interface SourcesModalProps {
  isOpen: boolean
  onClose: () => void
  habitName: string
  scienceHighlight: string
  sources: string[]
}
```
- Affiche le point scientifique clé
- Liste les URLs des sources avec icône externe
- Bouton fermer

## Contraintes design

- **Couleurs** : Orange #F27D16 (primary), Vert #22C55E (success), pas de rouge
- **Border radius** : 12px pour les cartes, 8px pour les boutons
- **Touch targets** : Minimum 44x44px
- **Transitions** : 200ms ease-out pour les animations
- **Labels moments** :
  - morning: "🌅 Matin"
  - afternoon: "☀️ Après-midi"
  - evening: "🌙 Soir"
  - night: "🌃 Nuit"
- **Labels difficulté** :
  - easy: "Facile à démarrer"
  - moderate: "Demande de la constance"
  - challenging: "Effort initial"

## Critères de succès

1. **Tri logique** : Les habitudes sont visuellement regroupées par moment sur "Aujourd'hui"
2. **Carrousel** : Les habitudes suggérées défilent horizontalement avec fluidité
3. **Changement type** : L'utilisateur peut modifier le type d'une habitude existante
4. **Archivées collapsées** : La section archivées est fermée par défaut
5. **Nom visible** : Le nom de l'habitude est affiché aux étapes 3-4
6. **Scroll auto** : La page remonte en haut à chaque étape
7. **Emojis suggérés** : Des emojis pertinents sont proposés selon la catégorie
8. **Transition 30j retirée** : Plus de suggestion de passage en mode détaillé
9. **Emoji picker mobile** : L'affichage est correct sur mobile sans resize
10. **Annulation cumul** : Les saisies cumulatives peuvent être annulées
11. **Nouvelles habitudes** : 10+ nouvelles habitudes prioritaires disponibles
12. **Configuration intelligente** : Chaque habitude a des modes par défaut logiques
13. **Sources visibles** : Lien "En savoir plus" vers les sources scientifiques
14. **Sections moments** : Regroupement visuel par moment de la journée
15. **Badge difficulté** : Indicateur de difficulté sur les cartes suggérées
