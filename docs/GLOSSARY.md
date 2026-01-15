# Glossaire Technique - Doucement

Ce document définit tous les termes techniques, types et concepts utilisés dans le projet Doucement.

---

## Concepts Fondamentaux

### Dose du jour

Le concept central de Doucement. L'utilisateur ne voit jamais d'objectif long terme intimidant, seulement la "dose" (quantité cible) pour aujourd'hui.

- Calculée automatiquement selon la progression configurée
- Affichée comme unique objectif visible
- Permet de rester concentré sur le présent

### Habitude progressive

Une habitude dont la dose cible évolue dans le temps.

- **Augmentation** : +X unités ou +X% par période
- **Diminution** : -X unités ou -X% par période
- **Maintien** : dose constante

### Effort partiel = Succès

Philosophie clé : 70% de complétion est toujours une victoire. Pas de notion d'échec.

---

## Types d'Habitudes

### HabitDirection

Direction de progression d'une habitude.

| Valeur | Description | Exemple |
|--------|-------------|---------|
| `increase` | Augmenter progressivement | Push-ups : 10 → 50 |
| `decrease` | Réduire progressivement | Cigarettes : 20 → 0 |
| `maintain` | Maintenir un niveau constant | Méditation : 10 min/jour |

### TrackingMode

Mode de suivi d'une habitude.

| Valeur | Description | Interface | Cas d'usage |
|--------|-------------|-----------|-------------|
| `simple` | Binaire (fait/pas fait) | Bouton unique | Prendre ses vitamines |
| `detailed` | Quantitatif avec saisie | Champ numérique | Verres d'eau |
| `counter` | Compteur incrémental | Boutons +/- | Cigarettes fumées |

### TrackingFrequency

Fréquence de suivi d'une habitude.

| Valeur | Description | Affichage |
|--------|-------------|-----------|
| `daily` | Suivi quotidien | "8 verres d'eau" |
| `weekly` | Suivi hebdomadaire | "3/5 cette semaine" |

### EntryMode

Mode de saisie des valeurs dans une journée.

| Valeur | Description | Exemple |
|--------|-------------|---------|
| `replace` | Chaque saisie remplace la précédente | Heures de sommeil : 7 → 7.5 |
| `cumulative` | Les saisies s'additionnent | Verres d'eau : 3 + 2 + 3 = 8 |

### WeeklyAggregation

Mode d'agrégation pour les habitudes hebdomadaires.

| Valeur | Description | Calcul |
|--------|-------------|--------|
| `count-days` | Compte les jours actifs | Nombre de jours avec actualValue > 0 |
| `sum-units` | Additionne les valeurs | Somme des actualValue de la semaine |

---

## Progression

### ProgressionConfig

Configuration de la progression d'une habitude.

```typescript
interface ProgressionConfig {
  mode: ProgressionMode;    // 'absolute' | 'percentage'
  value: number;            // Valeur de progression
  period: ProgressionPeriod; // 'daily' | 'weekly'
}
```

### ProgressionMode

| Valeur | Description | Exemple |
|--------|-------------|---------|
| `absolute` | Incrément fixe | +2 pompes par semaine |
| `percentage` | Pourcentage | +5% par semaine |

### ProgressionPeriod

| Valeur | Description |
|--------|-------------|
| `daily` | Progression appliquée chaque jour |
| `weekly` | Progression appliquée chaque semaine |

---

## Entrées et Statuts

### DailyEntry

Enregistrement d'une journée pour une habitude.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `habitId` | string | Référence à l'habitude |
| `date` | string | Date au format YYYY-MM-DD |
| `targetDose` | number | Dose cible calculée |
| `actualValue` | number | Valeur réellement accomplie |
| `note` | string? | Note optionnelle |
| `operations` | CounterOperation[]? | Historique pour mode counter |

### CompletionStatus

Statut de complétion d'une entrée.

| Valeur | Condition | Affichage |
|--------|-----------|-----------|
| `pending` | Pas encore d'entrée | Gris |
| `partial` | 0 < actualValue < targetDose | Jaune/Orange |
| `completed` | actualValue ≥ targetDose | Vert |
| `exceeded` | actualValue > targetDose × 1.2 | Vert avec badge |

---

## Fonctionnalités Avancées

### anchorHabitId

Référence à une habitude d'ancrage pour le **Habit Stacking** (chaînage d'habitudes).

- L'habitude ancre sert de déclencheur
- Crée un lien visuel entre habitudes
- Voir [habit-stacking.md](features/habit-stacking.md)

### ImplementationIntention

Plan "si-alors" basé sur la recherche de Gollwitzer (1999).

```typescript
interface ImplementationIntention {
  trigger?: string;   // "Après mon café du matin"
  location?: string;  // "Dans le salon"
  time?: string;      // "08:00"
}
```

### PlannedPause

Pause planifiée pour une habitude.

```typescript
interface PlannedPause {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  reason?: string;    // "Vacances"
}
```

- Les jours de pause sont exclus des statistiques
- Différent de l'archivage (temporaire vs permanent)
- Voir [planned-pause.md](features/planned-pause.md)

### identityStatement

Déclaration d'identité optionnelle.

> "Je deviens quelqu'un qui prend soin de son corps"

Basé sur le concept d'*Atomic Habits* : le changement d'identité est plus puissant que le changement de comportement.

### RecalibrationRecord

Historique d'une recalibration après absence prolongée.

```typescript
interface RecalibrationRecord {
  date: string;              // Date de recalibration
  previousStartValue: number; // Ancienne valeur de départ
  newStartValue: number;      // Nouvelle valeur de départ
  previousStartDate: string;  // Ancienne date de début
  level: number;             // 0.5, 0.75 ou 1
}
```

---

## Temps et Affichage

### TimeOfDay

Moment de la journée pour une habitude.

| Valeur | Période | Ordre d'affichage |
|--------|---------|-------------------|
| `morning` | Matin (6h-12h) | 1 |
| `afternoon` | Après-midi (12h-18h) | 2 |
| `evening` | Soir (18h-22h) | 3 |
| `night` | Nuit (22h-6h) | 4 |

Utilisé pour regrouper et trier les habitudes sur la page Aujourd'hui.

### ThemePreference

Préférence de thème visuel.

| Valeur | Description |
|--------|-------------|
| `light` | Thème clair forcé |
| `dark` | Thème sombre forcé |
| `system` | Suit les préférences du système |

---

## Notifications

### ReminderType

Types de rappels disponibles.

| Valeur | Description | Défaut |
|--------|-------------|--------|
| `morning` | Rappel matinal | 08:00 |
| `evening` | Rappel du soir (si journée non enregistrée) | 20:00 |
| `weeklyReview` | Rappel revue hebdomadaire (dimanche) | 10:00 |

### NotificationSettings

Configuration globale des notifications.

- `enabled` : Permission accordée (opt-in)
- Chaque rappel a son propre `enabled` et `time`
- 100% local, aucun serveur push

---

## Données Applicatives

### AppData

Structure racine stockée dans localStorage.

```typescript
interface AppData {
  schemaVersion: number;      // Actuellement 10
  habits: Habit[];            // Liste des habitudes
  entries: DailyEntry[];      // Entrées quotidiennes
  preferences: UserPreferences; // Préférences utilisateur
}
```

### schemaVersion

Version du schéma de données pour les migrations.

- Incrémentée à chaque modification de structure
- Permet les migrations automatiques à l'import
- Version actuelle : **10**

### UserPreferences

Préférences utilisateur globales.

| Champ | Description |
|-------|-------------|
| `onboardingCompleted` | Onboarding terminé |
| `lastWeeklyReviewDate` | Dernière revue hebdomadaire |
| `notifications` | Configuration notifications |
| `weeklyReflections` | Réflexions sauvegardées |
| `debugMode` | Mode debug activé |
| `simulatedDate` | Date simulée (debug) |
| `theme` | Préférence de thème |
| `milestones` | Jalons célébrés |

---

## Opérations

### CounterOperation

Opération sur un compteur (mode `counter`).

```typescript
interface CounterOperation {
  id: string;
  type: CounterOperationType; // 'add' | 'subtract'
  value: number;
  timestamp: string;
  note?: string;
}
```

### CumulativeOperation

Opération cumulative (mode `cumulative`).

```typescript
interface CumulativeOperation {
  id: string;
  value: number;      // Positif ou négatif
  timestamp: string;
}
```

---

## Références

- Types complets : [src/types/index.ts](../src/types/index.ts)
- Types statistiques : [src/types/statistics.ts](../src/types/statistics.ts)
- Matrice de cohérence : [coherence-matrix.md](coherence-matrix.md)
- Guides fonctionnalités : [features/](features/)
