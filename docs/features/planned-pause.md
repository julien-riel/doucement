# Pauses Planifiées

## Concept

Les pauses planifiées permettent de suspendre temporairement une habitude sans la supprimer ni affecter les statistiques. C'est une approche bienveillante pour gérer les vacances, maladies, ou autres interruptions prévisibles.

## Différence avec l'archivage

| Aspect | Pause planifiée | Archivage |
|--------|-----------------|-----------|
| **Durée** | Temporaire (dates définies) | Permanent |
| **Visibilité** | Visible sur Today (grisée) | Cachée |
| **Statistiques** | Jours de pause exclus | Historique conservé |
| **Reprise** | Automatique à la fin | Manuelle (restaurer) |

## Structure de données

```typescript
interface PlannedPause {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  reason?: string;    // Optionnel : "Vacances", "Maladie", etc.
}

interface Habit {
  // ...autres champs
  plannedPause?: PlannedPause;
}
```

## Comportement pendant la pause

### Sur la page Today

- L'habitude apparaît grisée avec une icône de pause
- Affichage : "En pause jusqu'au [date]"
- Le check-in est désactivé
- Option de reprendre plus tôt si souhaité

### Calcul de progression

Les jours de pause sont exclus du calcul :

```typescript
function calculateTargetDose(habit: Habit, date: string): number {
  const effectiveDays = countDaysExcludingPause(
    habit.startDate,
    date,
    habit.plannedPause
  );
  // Calcul basé sur effectiveDays
}
```

### Statistiques

- Les jours de pause n'apparaissent pas comme "manqués"
- Le taux de complétion exclut les jours de pause
- Le heatmap affiche une couleur neutre pour les jours de pause

## Création d'une pause

### Via les paramètres de l'habitude

1. Aller dans le détail de l'habitude
2. Section "Pause planifiée"
3. Définir les dates de début et fin
4. Optionnellement ajouter une raison

### Validation

- La date de fin doit être après la date de début
- La pause ne peut pas être dans le passé (sauf si déjà commencée)
- Une seule pause active par habitude

## Fin de pause

### Reprise automatique

À la fin de la pause (endDate + 1) :
- L'habitude redevient active
- Le champ `plannedPause` est supprimé
- Un message de bienvenue peut s'afficher

### Reprise anticipée

L'utilisateur peut mettre fin à la pause avant la date prévue :
1. Cliquer sur "Reprendre maintenant"
2. Confirmation
3. L'habitude redevient active immédiatement

## Recalibration après pause

Après une longue pause (7+ jours), Doucement peut proposer une recalibration de la dose cible. Voir [Mode Rattrapage Intelligent](../prd.md).

## Exemples

### Exemple 1 : Vacances
- **Dates** : 15 au 30 juillet
- **Raison** : "Vacances en famille"
- **Comportement** : Habitude grisée pendant 16 jours

### Exemple 2 : Maladie
- **Dates** : 5 au 12 janvier
- **Raison** : "Grippe"
- **Reprise** : Proposition de recalibration si habitude progressive

## Références

- Types : [src/types/index.ts](../../src/types/index.ts)
- PRD : [docs/prd.md §20.3](../prd.md)
