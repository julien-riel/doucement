# Analyse de Patterns

## Concept

L'analyse de patterns identifie automatiquement les tendances dans les données de l'utilisateur : meilleurs jours de la semaine, meilleures heures, périodes de forte/faible activité.

## Types d'analyses

### 1. Meilleurs jours de la semaine

Identifie les jours où l'utilisateur performe le mieux.

| Métrique | Description |
|----------|-------------|
| **Calcul** | Moyenne du taux de complétion par jour de semaine |
| **Seuil** | Minimum 2 semaines de données |
| **Affichage** | "Vos meilleurs jours : Mardi, Jeudi" |

### 2. Meilleures heures (si disponible)

Identifie les moments de la journée les plus productifs.

| Métrique | Description |
|----------|-------------|
| **Calcul** | Distribution des check-ins par tranche horaire |
| **Données** | Utilise `createdAt` des DailyEntry |
| **Affichage** | "Vous êtes plus actif·e le matin" |

### 3. Tendances de progression

Identifie les patterns de progression sur plusieurs semaines.

| Pattern | Description |
|---------|-------------|
| **Croissance stable** | Amélioration régulière semaine après semaine |
| **Plateau** | Stagnation depuis 2+ semaines |
| **Variabilité** | Alternance de bonnes et mauvaises semaines |

## Implémentation

### Service patternAnalysis.ts

```typescript
// src/utils/patternAnalysis.ts

interface PatternAnalysis {
  bestDays: DayOfWeek[];
  bestTimeOfDay?: TimeOfDay;
  trend: 'growing' | 'plateau' | 'variable' | 'insufficient_data';
  consistency: number; // 0-100%
}

function analyzePatterns(
  habit: Habit,
  entries: DailyEntry[],
  minWeeks: number = 2
): PatternAnalysis | null;
```

### Algorithme meilleurs jours

```typescript
function getBestDays(entries: DailyEntry[]): DayOfWeek[] {
  // 1. Grouper les entrées par jour de semaine
  const byDay = groupBy(entries, e => getDayOfWeek(e.date));

  // 2. Calculer le taux de complétion moyen par jour
  const avgByDay = Object.entries(byDay).map(([day, dayEntries]) => ({
    day,
    avg: mean(dayEntries.map(e => e.actualValue / e.targetDose))
  }));

  // 3. Retourner les jours au-dessus de la moyenne globale
  const globalAvg = mean(avgByDay.map(d => d.avg));
  return avgByDay
    .filter(d => d.avg > globalAvg)
    .sort((a, b) => b.avg - a.avg)
    .map(d => d.day);
}
```

### Détection de plateau

```typescript
function detectPlateau(
  entries: DailyEntry[],
  weeks: number = 2
): boolean {
  const recentWeeks = getLastNWeeks(entries, weeks);
  const progression = recentWeeks.map(week =>
    mean(week.map(e => e.actualValue))
  );

  // Plateau si variation < 5% entre les semaines
  const variation = standardDeviation(progression) / mean(progression);
  return variation < 0.05;
}
```

## Seuils minimum de données

| Analyse | Minimum requis |
|---------|---------------|
| Meilleurs jours | 14 jours d'entrées |
| Meilleures heures | 30 entrées avec timestamp |
| Tendance | 21 jours d'entrées |

Si les données sont insuffisantes, l'analyse n'est pas affichée.

## Affichage dans WeeklyReview

La revue hebdomadaire inclut une section "Vos patterns" si suffisamment de données :

```
📊 Vos patterns cette semaine

Vos meilleurs jours : Mardi, Jeudi
Tendance : Croissance stable (+12% sur 4 semaines)
Conseil : Profitez de vos mardis productifs !
```

## Ce qu'on n'implémente PAS

- Prédictions basées sur les patterns
- Notifications basées sur les patterns
- Comparaison avec d'autres utilisateurs

## Références

- Utilitaire : [src/utils/patternAnalysis.ts](../../src/utils/patternAnalysis.ts)
- Composant WeeklyReview : [src/components/habits/WeeklyReview.tsx](../../src/components/habits/WeeklyReview.tsx)
- PRD : [docs/prd.md §20.6](../prd.md)
