# PRD — Statistiques Avancées

## 1. Objectif

Ajouter un module de visualisation de la progression permettant aux utilisateurs de :
- Voir leur évolution dans le temps avec des graphiques interactifs
- Visualiser les **projections futures** basées sur leur rythme actuel vs leur cible
- Comparer plusieurs habitudes entre elles
- Célébrer leurs jalons (25%, 50%, 75%, 100% de la cible)
- Exporter leurs graphiques en image ou PDF

---

## 2. Contexte

L'app Doucement aide les utilisateurs à construire des habitudes progressives. Actuellement, ils peuvent :
- Voir leur "dose du jour"
- Faire un check-in quotidien
- Consulter une revue hebdomadaire

**Manque identifié** : Pas de vue long terme de la progression ni de motivation visuelle au-delà de la semaine en cours.

**Solution** : Page Statistiques dédiée avec graphiques, projections et célébrations.

---

## 3. Personas et use cases

### Persona : Marie, 34 ans
Marie suit 3 habitudes depuis 2 mois. Elle veut :
- Voir si elle progresse vraiment
- Savoir quand elle atteindra sa cible si elle continue ainsi
- Se sentir fière de son parcours

### Use cases

| ID | Use case | Priorité |
|----|----------|----------|
| UC1 | Voir l'évolution d'une habitude sur 1 mois | High |
| UC2 | Comparer 2+ habitudes sur la même période | Medium |
| UC3 | Voir la projection future vs ma cible | High |
| UC4 | Recevoir une célébration quand j'atteins 50% | High |
| UC5 | Exporter mon graphique en PNG | Medium |
| UC6 | Exporter un récapitulatif PDF | Low |

---

## 4. Architecture technique

### 4.1 Nouvelles dépendances

```json
{
  "recharts": "^2.x",
  "html2canvas": "^1.x",
  "jspdf": "^2.x"
}
```

### 4.2 Structure des fichiers

```
src/
├── types/
│   └── statistics.ts          # Types pour les stats
├── services/
│   ├── statistics.ts          # Calculs statistiques
│   ├── milestones.ts          # Détection jalons
│   ├── exportImage.ts         # Export PNG
│   └── exportPdf.ts           # Export PDF
├── components/
│   └── charts/
│       ├── ProgressionChart.tsx   # Courbe évolution + projection
│       ├── HeatmapCalendar.tsx    # Calendrier GitHub-style
│       ├── ComparisonChart.tsx    # Multi-séries
│       ├── StatCard.tsx           # KPI card
│       └── ProjectionSection.tsx  # Section projections
│   └── CelebrationModal.tsx       # Modal confetti
├── pages/
│   └── Statistics.tsx             # Page principale
└── hooks/
    └── useStatistics.ts           # Hook pour les calculs
```

### 4.3 Routing

Nouvelle route : `/statistics`

Ajout dans la navigation principale (icône graphique).

---

## 5. Structures de données

### 5.1 Types statistiques

```typescript
// src/types/statistics.ts

/**
 * Période d'affichage des statistiques
 */
export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

/**
 * Point de données pour un graphique
 */
export interface DataPoint {
  /** Date au format YYYY-MM-DD */
  date: string
  /** Valeur réalisée */
  value: number
  /** Dose cible ce jour-là */
  target: number
  /** Pourcentage de réalisation (0-100+) */
  percentage: number
}

/**
 * Données pour un graphique de progression
 */
export interface ChartData {
  habitId: string
  habitName: string
  habitEmoji: string
  unit: string
  dataPoints: DataPoint[]
  /** Valeur cible finale (targetValue de l'habitude) */
  finalTarget?: number
}

/**
 * Données de projection future
 */
export interface ProjectionData {
  habitId: string
  /** Valeur actuelle (dernière entrée) */
  currentValue: number
  /** Valeur cible finale */
  targetValue: number
  /** Pourcentage d'avancement vers la cible (0-100) */
  progressPercentage: number
  /** Taux de progression actuel par semaine */
  currentWeeklyRate: number
  /** Date estimée d'atteinte de la cible (YYYY-MM-DD) */
  estimatedCompletionDate: string | null
  /** Nombre de jours restants estimé */
  daysRemaining: number | null
  /** Projection dans 30 jours */
  projectionIn30Days: number
  /** Projection dans 90 jours */
  projectionIn90Days: number
}

/**
 * Statistiques agrégées pour une habitude
 */
export interface HabitStats {
  habitId: string
  /** Nombre total d'entrées */
  totalEntries: number
  /** Moyenne des pourcentages de réalisation */
  averageCompletion: number
  /** Meilleur jour (% le plus haut) */
  bestDay: { date: string; percentage: number } | null
  /** Série actuelle de jours consécutifs >= 70% */
  currentStreak: number
  /** Meilleure série historique */
  bestStreak: number
  /** Tendance sur les 7 derniers jours (-1 à 1) */
  weeklyTrend: number
}

/**
 * Jalon de progression
 */
export type MilestoneLevel = 25 | 50 | 75 | 100

export interface Milestone {
  habitId: string
  level: MilestoneLevel
  /** Date d'atteinte (YYYY-MM-DD) */
  reachedAt: string
  /** Déjà célébré ? */
  celebrated: boolean
}

/**
 * État des jalons pour toutes les habitudes
 * Stocké dans UserPreferences
 */
export interface MilestonesState {
  milestones: Milestone[]
}
```

### 5.2 Modification de AppData

Ajouter dans `UserPreferences` :

```typescript
export interface UserPreferences {
  // ... existant ...

  /** État des jalons célébrés */
  milestones?: MilestonesState
}
```

**Note** : Incrémentation du `CURRENT_SCHEMA_VERSION` requise.

---

## 6. Logique de calcul

### 6.1 Service statistics.ts

```typescript
/**
 * Calcule les données pour un graphique de progression
 */
function getChartData(
  habit: Habit,
  entries: DailyEntry[],
  period: StatsPeriod
): ChartData

/**
 * Calcule les projections futures
 */
function getProjection(
  habit: Habit,
  entries: DailyEntry[]
): ProjectionData

/**
 * Calcule les statistiques agrégées
 */
function getHabitStats(
  habit: Habit,
  entries: DailyEntry[],
  period: StatsPeriod
): HabitStats

/**
 * Calcule la tendance (pente de régression linéaire normalisée)
 * Retourne une valeur entre -1 (déclin) et +1 (progression)
 */
function calculateTrend(dataPoints: DataPoint[]): number
```

### 6.2 Calcul de la projection

```typescript
function getProjection(habit: Habit, entries: DailyEntry[]): ProjectionData {
  // 1. Calculer le taux de progression réel sur les 4 dernières semaines
  const last28DaysEntries = filterLast28Days(entries)

  // 2. Régression linéaire pour obtenir la pente
  const slope = linearRegression(last28DaysEntries)
  const weeklyRate = slope * 7

  // 3. Calculer quand on atteint targetValue
  if (habit.targetValue && weeklyRate !== 0) {
    const currentValue = last28DaysEntries[last28DaysEntries.length - 1].actualValue
    const remaining = habit.targetValue - currentValue
    const weeksRemaining = remaining / weeklyRate
    const daysRemaining = Math.ceil(weeksRemaining * 7)
    // ...
  }
}
```

### 6.3 Service milestones.ts

```typescript
/**
 * Détecte les nouveaux jalons atteints
 */
function detectNewMilestones(
  habit: Habit,
  currentValue: number,
  existingMilestones: Milestone[]
): Milestone[]

/**
 * Calcule le pourcentage d'avancement vers la cible
 */
function calculateProgressPercentage(
  habit: Habit,
  currentValue: number
): number
```

**Logique de détection** :
- Comparer `currentValue` à `targetValue`
- Si `currentValue >= targetValue * 0.25` → jalon 25%
- Etc. pour 50%, 75%, 100%
- Vérifier si le jalon n'est pas déjà dans `existingMilestones`

---

## 7. Composants UI

### 7.1 ProgressionChart

**Props** :
```typescript
interface ProgressionChartProps {
  data: ChartData
  showProjection?: boolean
  period: StatsPeriod
}
```

**Affichage** :
- Courbe principale : valeurs réalisées (couleur orange `#F27D16`)
- Ligne horizontale : cible finale (couleur verte `#22C55E`)
- Zone pointillée : projection future (orange clair, opacité 50%)
- Axe X : dates
- Axe Y : valeurs dans l'unité de l'habitude

**Design** :
- Border radius 16px sur le conteneur
- Pas de rouge pour les valeurs basses → utiliser des gris doux
- Tooltip au survol avec détails du jour

### 7.2 HeatmapCalendar

**Props** :
```typescript
interface HeatmapCalendarProps {
  habitId: string
  entries: DailyEntry[]
  monthsToShow?: number // défaut: 3
}
```

**Affichage** :
- Cases colorées style GitHub contributions
- Dégradé : gris clair (0%) → orange clair → orange → vert (100%+)
- Navigation entre les mois
- Tooltip avec date et valeur

**Couleurs** :
```typescript
const heatmapColors = {
  0: '#F5F5F5',     // Pas de données / 0%
  25: '#FEECD0',    // 1-25%
  50: '#FDD9A0',    // 26-50%
  75: '#F8B84E',    // 51-75%
  100: '#22C55E',   // 76-100%
  exceeded: '#16A34A' // > 100%
}
```

### 7.3 ComparisonChart

**Props** :
```typescript
interface ComparisonChartProps {
  habits: Habit[]
  entries: DailyEntry[]
  period: StatsPeriod
  normalized?: boolean // % de la cible au lieu des valeurs brutes
}
```

**Affichage** :
- Multi-séries avec légende
- Palette de couleurs distinctes par habitude
- Option toggle pour normalisation

### 7.4 StatCard

**Props** :
```typescript
interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}
```

**Affichage** :
- Carte avec fond légèrement teinté
- Valeur principale en grand
- Indicateur de tendance (flèche + couleur)

### 7.5 CelebrationModal

**Props** :
```typescript
interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  milestone: Milestone
  habitName: string
  habitEmoji: string
}
```

**Affichage** :
- Animation confetti au centre
- Message de félicitation personnalisé
- Bouton "Continuer"

**Messages** (depuis banque-messages.md) :
- 25% : "Beau départ ! Tu as parcouru un quart du chemin."
- 50% : "Mi-parcours atteint ! Tu es sur la bonne voie."
- 75% : "Trois quarts ! L'arrivée est en vue."
- 100% : "Objectif atteint ! Tu peux être fier·e de toi."

---

## 8. Page Statistics

### 8.1 Structure

```
┌─────────────────────────────────────┐
│  📊 Mes statistiques                │
│  [Semaine ▼] [Mois] [Année] [Tout]  │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 87% │ │ 12j │ │ +5% │ │ 3/4 │   │
│  │Moy. │ │Série│ │Tend.│ │Habit│   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────────────┤
│  [Sélectionner une habitude ▼]      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   📈 Courbe progression     │   │
│  │   avec projection future    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   📅 Calendrier heatmap     │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  🎯 Projections                     │
│  "Au rythme actuel, tu atteindras   │
│   ta cible dans environ 45 jours"   │
├─────────────────────────────────────┤
│  [📤 Exporter]                      │
└─────────────────────────────────────┘
```

### 8.2 États

- **État vide** : Moins de 7 jours de données
  - Message : "Continue encore quelques jours pour voir tes statistiques"
- **État normal** : Affichage complet
- **État chargement** : Skeleton loaders

---

## 9. Export

### 9.1 Export PNG

Utiliser `html2canvas` pour capturer le graphique.

```typescript
async function exportToPng(
  elementRef: HTMLElement,
  filename: string
): Promise<void>
```

### 9.2 Export PDF

Utiliser `jspdf` + `html2canvas`.

Structure du PDF :
1. En-tête avec nom de l'habitude et période
2. Graphique de progression
3. Tableau récapitulatif des stats
4. Date de génération

---

## 10. Accessibilité

- Labels ARIA sur tous les graphiques
- Descriptions textuelles alternatives
- Navigation clavier dans les sélecteurs
- Contraste suffisant (WCAG AA)
- Pas de dépendance unique à la couleur

---

## 11. Contraintes design

Respecter le design system existant :
- Couleur primaire : Orange `#F27D16`
- Couleur succès : Vert `#22C55E`
- **Jamais de rouge** (associé à l'échec)
- Border radius : 8-24px
- Font headings : Fraunces
- Font body : Source Sans 3
- Touch targets : min 44x44px

---

## 12. Critères de succès

| Critère | Mesure |
|---------|--------|
| Performance | Graphiques < 500ms à rendre |
| Accessibilité | Score Lighthouse >= 90 |
| Couverture tests | >= 80% sur services |
| Mobile | Graphiques lisibles sur 375px |

---

## 13. Hors scope (v1)

- Comparaison avec d'autres utilisateurs
- Objectifs personnalisés par période
- Notifications de jalons push
- Intégration calendrier externe
- Widgets home screen

---

## 14. Questions ouvertes

1. ~~Bibliothèque de graphiques~~ → **Recharts** choisi
2. ~~Stockage des jalons~~ → Dans `UserPreferences.milestones`
3. Animation confetti → Utiliser `canvas-confetti` ou CSS pur ?

---

## 15. Références

- `docs/prd.md` — PRD principal de l'app
- `docs/design/design-system-specification.md` — Design system
- `docs/comm/banque-messages.md` — Messages et ton
- `src/types/index.ts` — Types existants
