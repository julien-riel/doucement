# Matrice de Cohérence - Doucement

Ce document référence les types principaux, leur utilisation dans le code et leur documentation associée.

**Dernière mise à jour :** 2026-01-13

---

## Types Principaux

### 1. Habit (Interface)

| Aspect | Localisation | Statut |
|--------|-------------|--------|
| **Définition** | `src/types/index.ts:185-230` | ✓ |
| **Services** | `storage.ts`, `progression.ts`, `statistics.ts`, `migration.ts` | ✓ |
| **Composants** | `HabitCard`, `HabitDetail`, `CreateHabit`, `EditHabit`, `HabitList` | ✓ |
| **Documentation** | `docs/prd.md §4`, `docs/technical-reference.md` | ✓ |

**Champs clés :**
- `id`, `name`, `emoji`, `direction`, `startValue`, `unit`
- `progression` (ProgressionConfig | null)
- `trackingMode` ('simple' | 'detailed' | 'counter')
- `trackingFrequency` ('daily' | 'weekly')
- `timeOfDay` (TimeOfDay)
- `implementationIntention`, `anchorHabitId`, `plannedPause`
- `identityStatement`, `recalibrationHistory`

---

### 2. DailyEntry (Interface)

| Aspect | Localisation | Statut |
|--------|-------------|--------|
| **Définition** | `src/types/index.ts:244-263` | ✓ |
| **Services** | `storage.ts`, `progression.ts`, `statistics.ts` | ✓ |
| **Composants** | `CheckInButtons`, `HabitCard`, `HeatmapCalendar`, `ProgressionChart` | ✓ |
| **Documentation** | `docs/prd.md §6.2` | ✓ |

**Champs clés :**
- `id`, `habitId`, `date` (YYYY-MM-DD)
- `targetDose`, `actualValue`
- `note`, `operations` (CounterOperation[])
- `createdAt`, `updatedAt`

---

### 3. AppData (Interface)

| Aspect | Localisation | Statut |
|--------|-------------|--------|
| **Définition** | `src/types/index.ts:363-372` | ✓ |
| **Services** | `storage.ts` (loadData, saveData), `migration.ts` | ✓ |
| **Composants** | Via `useAppData` hook | ✓ |
| **Documentation** | `docs/prd.md §8.3` | ✓ |

**Champs clés :**
- `schemaVersion` (actuellement v10)
- `habits` (Habit[])
- `entries` (DailyEntry[])
- `preferences` (UserPreferences)

---

### 4. UserPreferences (Interface)

| Aspect | Localisation | Statut |
|--------|-------------|--------|
| **Définition** | `src/types/index.ts:336-353` | ✓ |
| **Services** | `storage.ts`, `notifications.ts` | ✓ |
| **Composants** | `Settings`, `NotificationSettings`, `DebugPanel` | ✓ |
| **Documentation** | `docs/prd.md §9` | ✓ |

**Champs clés :**
- `onboardingCompleted`, `lastWeeklyReviewDate`
- `notifications` (NotificationSettings)
- `weeklyReflections`, `theme`, `milestones`
- `debugMode`, `simulatedDate`

---

### 5. ProgressionConfig (Interface)

| Aspect | Localisation | Statut |
|--------|-------------|--------|
| **Définition** | `src/types/index.ts:70-77` | ✓ |
| **Services** | `progression.ts` (calculateTargetDose) | ✓ |
| **Composants** | `CreateHabit`, `EditHabit`, `HabitCard` | ✓ |
| **Documentation** | `docs/prd.md §8.5`, `docs/technical-reference.md` | ✓ |

**Champs clés :**
- `mode` ('absolute' | 'percentage')
- `value` (number)
- `period` ('daily' | 'weekly')

---

## Types Enum/Union

| Type | Définition | Valeurs | Utilisé dans |
|------|-----------|---------|--------------|
| `HabitDirection` | :55 | 'increase', 'decrease', 'maintain' | Habit, progression.ts |
| `TrackingMode` | :85 | 'simple', 'detailed', 'counter' | Habit, CheckInButtons |
| `TrackingFrequency` | :92 | 'daily', 'weekly' | Habit, progression.ts |
| `TimeOfDay` | :16 | 'morning', 'afternoon', 'evening', 'night' | Habit, Today.tsx |
| `CompletionStatus` | :239 | 'pending', 'partial', 'completed', 'exceeded' | DailyEntry, HabitCard |
| `ThemePreference` | :136 | 'light', 'dark', 'system' | UserPreferences, Settings |
| `EntryMode` | :99 | 'replace', 'cumulative' | Habit, useAppData |
| `WeeklyAggregation` | :128 | 'count-days', 'sum-units' | Habit, progression.ts |

---

## Types Statistiques (src/types/statistics.ts)

| Type | Description | Utilisé dans |
|------|-------------|--------------|
| `HabitStats` | Statistiques calculées d'une habitude | Statistics.tsx, HabitDetail |
| `HeatmapCell` | Cellule du calendrier heatmap | HeatmapCalendar |
| `Milestone` | Jalon de progression | CelebrationModal, useCelebrations |
| `ProjectionData` | Données de projection future | ProjectionSection |
| `ComparisonData` | Données de comparaison avant/après | ComparisonChart |

---

## Flux de Données Principaux

### Création d'Habitude
```
CreateHabit.tsx → useAppData.createHabit() → storage.saveData()
                                           ↓
                                     localStorage
```

### Check-in Quotidien
```
CheckInButtons.tsx → useAppData.addEntry() → storage.saveData()
                           ↓
                  progression.calculateTargetDose()
```

### Calcul de Progression
```
progression.ts:calculateTargetDose()
  ├─ Récupère Habit.startValue
  ├─ Calcule jours/semaines depuis création
  ├─ Applique ProgressionConfig (mode + value + period)
  └─ Applique règles d'arrondi (docs/rounding-rules.md)
```

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✓ | Cohérent et à jour |
| ⚠ | Attention requise |
| ✗ | Incohérence détectée |

---

## Instructions de Mise à Jour

Lors de modifications de types :

1. **Ajouter un champ** : Mettre à jour `CURRENT_SCHEMA_VERSION`, ajouter migration dans `migration.ts`
2. **Modifier un type** : Vérifier tous les usages listés dans cette matrice
3. **Documenter** : Mettre à jour cette matrice et les PRDs concernés

---

*Document généré lors de l'audit qualité du 2026-01-13*
