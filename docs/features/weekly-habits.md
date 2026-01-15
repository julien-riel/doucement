# Habitudes Hebdomadaires

## Concept

Certaines habitudes n'ont pas de sens au quotidien mais s'expriment mieux sur une semaine. Doucement supporte les habitudes hebdomadaires avec une logique de suivi adaptée.

## Différence avec les habitudes quotidiennes

| Aspect | Quotidienne | Hebdomadaire |
|--------|-------------|--------------|
| **Affichage** | "8 verres d'eau" | "3/5 cette semaine" |
| **Période** | 1 jour | 7 jours (lundi-dimanche) |
| **Progression** | Par jour | Par semaine |
| **Check-in** | Valeur du jour | Binaire (jour comptabilisé ou non) |

## Structure de données

### Champ `trackingFrequency`

```typescript
type TrackingFrequency = 'daily' | 'weekly';

interface Habit {
  trackingFrequency: TrackingFrequency; // 'daily' par défaut
}
```

### Mode d'agrégation hebdomadaire

```typescript
type WeeklyAggregationMode = 'count-days' | 'sum-units';

interface Habit {
  weeklyAggregationMode?: WeeklyAggregationMode; // Si weekly
}
```

## Modes d'agrégation

### 1. Count Days (`count-days`)

Compte le nombre de jours où l'habitude a été effectuée.

| Aspect | Description |
|--------|-------------|
| **Calcul** | Nombre de DailyEntry avec actualValue > 0 |
| **Affichage** | "3/5 jours cette semaine" |
| **Cas d'usage** | Fréquence sans quantité (sport 3x/semaine) |

### 2. Sum Units (`sum-units`)

Additionne les valeurs de tous les jours.

| Aspect | Description |
|--------|-------------|
| **Calcul** | Somme des actualValue de la semaine |
| **Affichage** | "5/7 verres cette semaine" |
| **Cas d'usage** | Quota hebdomadaire (max 7 cafés/semaine) |

## Calcul de la dose cible

Pour une habitude hebdomadaire progressive :

1. Calculer le nombre de semaines depuis `startDate`
2. Appliquer la progression selon `progressionConfig`
3. La dose cible est exprimée pour la semaine entière

```typescript
// Exemple : 5 séances/semaine avec +10%/mois
const weeklyTarget = calculateTargetDose(habit, currentWeekStart);
// weeklyTarget = 5 * (1 + 0.10)^(months)
```

## Exemples

### Exemple 1 : Sport 3x/semaine
- **trackingFrequency** : `weekly`
- **weeklyAggregationMode** : `count-days`
- **startValue** : 3
- **Affichage** : "2/3 séances cette semaine"

### Exemple 2 : Maximum 7 cafés/semaine
- **trackingFrequency** : `weekly`
- **weeklyAggregationMode** : `sum-units`
- **direction** : `decrease`
- **startValue** : 7
- **Affichage** : "4/7 cafés cette semaine"

### Exemple 3 : Couchers avant minuit
- **trackingFrequency** : `weekly`
- **weeklyAggregationMode** : `count-days`
- **startValue** : 5
- **Affichage** : "3/5 soirs cette semaine"

## Comportement UI

### Sur la page Today
- L'habitude hebdomadaire affiche le compteur de la semaine en cours
- Un indicateur montre les jours restants dans la semaine
- Le check-in du jour est toujours disponible

### Dans les statistiques
- Les graphiques utilisent des points hebdomadaires
- Le heatmap reste journalier mais colore selon la contribution

## Références

- Types : [src/types/index.ts](../../src/types/index.ts)
- Service progression : [src/services/progression.ts](../../src/services/progression.ts)
- PRD : [docs/prd.md §4.3](../prd.md)
