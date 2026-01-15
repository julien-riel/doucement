# Système de Milestones (Célébrations)

## Concept

Le système de milestones célèbre les étapes clés de la progression sans créer de pression. Il renforce la motivation en rendant visible l'effet composé.

## Seuils de célébration

| Milestone | Signification | Message type |
|-----------|---------------|--------------|
| 25% | Quart du chemin | "Premier quart accompli !" |
| 50% | Mi-parcours | "À mi-chemin de votre objectif !" |
| 75% | Dernier virage | "Plus que quelques pas !" |
| 100% | Objectif atteint | "Objectif atteint !" |

## Calcul du pourcentage

Le pourcentage de progression est calculé par rapport à la `targetValue` si elle existe :

```typescript
const progressPercentage = ((currentValue - startValue) / (targetValue - startValue)) * 100;
```

Pour les habitudes en diminution (direction = 'decrease'), le calcul est inversé.

## Structure de données

### Préférences utilisateur

```typescript
interface UserPreferences {
  milestones: {
    celebratedMilestones: CelebratedMilestone[];
  };
}

interface CelebratedMilestone {
  habitId: string;
  milestone: 25 | 50 | 75 | 100;
  celebratedAt: string; // YYYY-MM-DD
}
```

## Algorithme de détection

```typescript
function detectNewMilestone(habit: Habit, currentValue: number): number | null {
  const progress = calculateProgressPercentage(habit, currentValue);
  const milestones = [25, 50, 75, 100];

  for (const milestone of milestones) {
    if (progress >= milestone && !alreadyCelebrated(habit.id, milestone)) {
      return milestone;
    }
  }

  return null;
}
```

### Règles de détection

1. Vérifie chaque milestone dans l'ordre croissant
2. Un milestone ne peut être célébré qu'une fois par habitude
3. La détection se fait au moment du check-in
4. Si plusieurs milestones sont franchis d'un coup, tous sont célébrés

## Comportement UI

### Modal de célébration

Quand un milestone est détecté :
1. Animation de confettis
2. Message personnalisé avec emoji de l'habitude
3. Affichage du chemin parcouru (startValue → currentValue)
4. Bouton de fermeture bienveillant

### Intégration WeeklyReview

La revue hebdomadaire récapitule les milestones atteints durant la semaine avec un rappel du chemin parcouru.

## Hook `useCelebrations`

```typescript
const { checkMilestone, celebratedMilestones } = useCelebrations();

// Après un check-in
const milestone = checkMilestone(habit, newValue);
if (milestone) {
  showCelebrationModal(milestone);
}
```

## Ce qu'on n'implémente PAS

- **Pas de badges permanents** : Les célébrations sont éphémères
- **Pas de notifications externes** : Célébration uniquement in-app
- **Pas de partage automatique** : L'utilisateur choisit s'il veut partager

## Références

- Hook : [src/hooks/useCelebrations.ts](../../src/hooks/useCelebrations.ts)
- Composant : [src/components/habits/CelebrationModal.tsx](../../src/components/habits/CelebrationModal.tsx)
- PRD : [docs/prd.md §16.3](../prd.md)
