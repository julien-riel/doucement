# Plan d'implémentation — Doucement

Ce document décrit le plan d'implémentation de l'application Doucement, une application de suivi d'habitudes progressives.

**Stack technique :** React + Vite + TypeScript

---

## Phase 1 : Structure projet React + Vite

### 1.1 Initialisation du projet

```bash
npm create vite@latest . -- --template react-ts
```

### 1.2 Structure de dossiers

```
src/
├── components/           # Composants UI réutilisables
│   ├── ui/              # Boutons, cartes, inputs, etc.
│   ├── habits/          # Composants liés aux habitudes
│   └── layout/          # Header, navigation, containers
├── pages/               # Écrans de l'application
│   ├── Onboarding/
│   ├── Today/           # "Aujourd'hui" - écran principal
│   ├── HabitList/
│   ├── HabitDetail/
│   ├── CreateHabit/
│   ├── WeeklyReview/
│   └── Settings/
├── hooks/               # Custom hooks React
├── services/            # Logique métier (storage, calculs)
├── types/               # Types TypeScript
├── utils/               # Utilitaires (dates, formatage)
├── constants/           # Constantes (messages, config)
└── styles/              # Variables CSS, design tokens
```

### 1.3 Dépendances essentielles

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "vitest": "^2.x",
    "@testing-library/react": "^14.x"
  }
}
```

### 1.4 Design System CSS

Créer `src/styles/design-tokens.css` avec les variables du design system :

```css
:root {
  /* Couleurs primaires (Orange) */
  --primary-50: #FFF8F0;
  --primary-100: #FFECD9;
  --primary-200: #FFD4AD;
  --primary-300: #FFB870;
  --primary-400: #FF9A3D;
  --primary-500: #F27D16;
  --primary-600: #D86208;
  --primary-700: #B34A06;

  /* Couleurs secondaires (Vert) */
  --secondary-50: #F0FDF4;
  --secondary-100: #DCFCE7;
  --secondary-200: #BBF7D0;
  --secondary-300: #86EFAC;
  --secondary-400: #4ADE80;
  --secondary-500: #22C55E;
  --secondary-600: #16A34A;

  /* Neutres chauds */
  --neutral-0: #FFFFFF;
  --neutral-50: #FDFCFB;
  --neutral-100: #F7F5F3;
  --neutral-200: #EBE8E4;
  --neutral-300: #D6D1CA;
  --neutral-400: #A8A099;
  --neutral-500: #78716C;
  --neutral-600: #57534E;
  --neutral-700: #44403C;
  --neutral-800: #292524;
  --neutral-900: #1C1917;

  /* Attention douce */
  --warning: #FBBF24;

  /* Espacements */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;

  /* Rayons */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Ombres */
  --shadow-soft: 0 2px 8px rgba(28, 25, 23, 0.06);
  --shadow-medium: 0 4px 16px rgba(28, 25, 23, 0.08);
  --shadow-glow: 0 0 24px rgba(242, 125, 22, 0.15);

  /* Typographie */
  --font-heading: 'Fraunces', Georgia, serif;
  --font-body: 'Source Sans 3', system-ui, sans-serif;

  /* Animations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --easing-gentle: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 1.5 Livrables Phase 1

- [ ] Projet Vite initialisé avec TypeScript
- [ ] Structure de dossiers créée
- [ ] Design tokens CSS configurés
- [ ] Fonts Google (Fraunces, Source Sans 3) importées
- [ ] React Router configuré avec routes de base
- [ ] Composants UI de base (Button, Card, Input)
- [ ] Layout principal avec navigation bottom

---

## Phase 2 : Stockage local (localStorage)

### 2.1 Modèle de données

```typescript
// src/types/index.ts

/**
 * Version actuelle du schéma de données.
 * Incrémenter à chaque modification structurelle.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Types d'habitudes supportés
 */
export type HabitType = 'simple' | 'progressive';

/**
 * Direction de progression pour les habitudes progressives
 */
export type ProgressionDirection = 'increase' | 'decrease';

/**
 * Mode de calcul de progression
 */
export type ProgressionMode = 'absolute' | 'percentage';

/**
 * Périodicité de la progression
 */
export type ProgressionPeriod = 'daily' | 'weekly';

/**
 * Définition d'une habitude
 */
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  category?: string;
  type: HabitType;
  createdAt: string; // YYYY-MM-DD
  archivedAt?: string; // YYYY-MM-DD si archivée

  // Pour les habitudes progressives uniquement
  progression?: {
    direction: ProgressionDirection;
    mode: ProgressionMode;
    period: ProgressionPeriod;
    initialValue: number;
    targetValue?: number; // Objectif final (optionnel)
    changeValue: number; // +3 ou +5% selon le mode
    unit: string; // "répétitions", "minutes", "cigarettes"
  };
}

/**
 * Entrée quotidienne pour une habitude
 */
export interface DailyEntry {
  habitId: string;
  date: string; // YYYY-MM-DD
  targetDose: number; // Dose calculée pour ce jour
  actualDose: number; // Ce que l'utilisateur a fait
  completedAt?: string; // ISO timestamp
}

/**
 * Préférences utilisateur
 */
export interface UserPreferences {
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  reminderTime?: string; // HH:MM
  weekStartsOn: 0 | 1; // 0 = dimanche, 1 = lundi
}

/**
 * Structure complète des données stockées
 */
export interface AppData {
  schemaVersion: number;
  preferences: UserPreferences;
  habits: Habit[];
  entries: DailyEntry[];
  exportedAt?: string; // ISO timestamp (pour les exports)
}
```

### 2.2 Service de stockage

```typescript
// src/services/storage.ts

const STORAGE_KEY = 'doucement_data';

/**
 * Données par défaut pour une nouvelle installation
 */
const DEFAULT_DATA: AppData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  preferences: {
    onboardingCompleted: false,
    notificationsEnabled: false,
    weekStartsOn: 1, // Lundi par défaut (français)
  },
  habits: [],
  entries: [],
};

/**
 * Charge les données depuis localStorage
 */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_DATA };
    }
    const data = JSON.parse(raw) as AppData;
    return migrateIfNeeded(data);
  } catch (error) {
    console.error('Erreur lecture localStorage:', error);
    return { ...DEFAULT_DATA };
  }
}

/**
 * Sauvegarde les données dans localStorage
 */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur écriture localStorage:', error);
    // Gérer quota exceeded si nécessaire
  }
}

/**
 * Migre les données si version antérieure
 */
function migrateIfNeeded(data: AppData): AppData {
  if (data.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return data;
  }
  // Les migrations seront ajoutées ici
  return runMigrations(data);
}
```

### 2.3 Hook React pour accès aux données

```typescript
// src/hooks/useAppData.ts

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());

  // Sauvegarder automatiquement les changements
  useEffect(() => {
    saveData(data);
  }, [data]);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...prefs }
    }));
  };

  const addHabit = (habit: Habit) => {
    setData(prev => ({
      ...prev,
      habits: [...prev.habits, habit]
    }));
  };

  const addEntry = (entry: DailyEntry) => {
    setData(prev => ({
      ...prev,
      entries: [...prev.entries.filter(
        e => !(e.habitId === entry.habitId && e.date === entry.date)
      ), entry]
    }));
  };

  // ... autres méthodes

  return {
    data,
    updatePreferences,
    addHabit,
    addEntry,
    // ...
  };
}
```

### 2.4 Livrables Phase 2

- [ ] Types TypeScript complets (`src/types/index.ts`)
- [ ] Service storage avec load/save (`src/services/storage.ts`)
- [ ] Hook `useAppData` pour accès réactif aux données
- [ ] Tests unitaires pour le service storage
- [ ] Gestion des erreurs (quota localStorage, données corrompues)

---

## Phase 3 : Logique de calcul de progression

### 3.1 Calcul de la dose du jour

```typescript
// src/services/progression.ts

import { Habit, DailyEntry } from '../types';
import { differenceInDays, differenceInWeeks, parseISO, startOfDay } from 'date-fns';

/**
 * Calcule la dose cible pour une date donnée
 */
export function calculateTargetDose(
  habit: Habit,
  date: string // YYYY-MM-DD
): number {
  // Habitude simple = toujours 1
  if (habit.type === 'simple' || !habit.progression) {
    return 1;
  }

  const { progression } = habit;
  const createdDate = parseISO(habit.createdAt);
  const targetDate = parseISO(date);

  // Calculer le nombre de périodes écoulées
  let periodsElapsed: number;
  if (progression.period === 'daily') {
    periodsElapsed = differenceInDays(targetDate, createdDate);
  } else {
    periodsElapsed = differenceInWeeks(targetDate, createdDate);
  }

  // Ne pas calculer pour des dates avant la création
  if (periodsElapsed < 0) {
    return progression.initialValue;
  }

  let dose: number;

  if (progression.mode === 'absolute') {
    // Mode absolu : +/- X par période
    const change = progression.changeValue * periodsElapsed;
    dose = progression.direction === 'increase'
      ? progression.initialValue + change
      : progression.initialValue - change;
  } else {
    // Mode pourcentage : +/- X% par période (effet composé)
    const multiplier = progression.direction === 'increase'
      ? 1 + (progression.changeValue / 100)
      : 1 - (progression.changeValue / 100);
    dose = progression.initialValue * Math.pow(multiplier, periodsElapsed);
  }

  // Appliquer les règles d'arrondi
  dose = applyRounding(dose, progression.direction);

  // Respecter les limites
  dose = applyLimits(dose, habit);

  return dose;
}

/**
 * Règles d'arrondi selon le type d'habitude
 * - Augmentation : arrondi au plafond (on pousse vers le haut)
 * - Réduction : arrondi au plancher (on est généreux)
 */
function applyRounding(value: number, direction: ProgressionDirection): number {
  if (direction === 'increase') {
    return Math.ceil(value);
  }
  return Math.floor(value);
}

/**
 * Applique les limites min/max
 */
function applyLimits(dose: number, habit: Habit): number {
  const prog = habit.progression!;

  // Minimum = 1 pour les augmentations, 0 pour les réductions
  const min = prog.direction === 'increase' ? 1 : 0;
  dose = Math.max(dose, min);

  // Maximum = objectif final si défini
  if (prog.targetValue !== undefined) {
    if (prog.direction === 'increase') {
      dose = Math.min(dose, prog.targetValue);
    } else {
      dose = Math.max(dose, prog.targetValue);
    }
  }

  return dose;
}
```

### 3.2 Calcul du pourcentage de complétion

```typescript
/**
 * Calcule le pourcentage de complétion d'une entrée
 */
export function calculateCompletionPercentage(entry: DailyEntry): number {
  if (entry.targetDose === 0) return 100;
  return Math.round((entry.actualDose / entry.targetDose) * 100);
}

/**
 * Statut de complétion pour l'affichage
 */
export type CompletionStatus = 'pending' | 'partial' | 'completed' | 'exceeded';

export function getCompletionStatus(entry: DailyEntry): CompletionStatus {
  const percentage = calculateCompletionPercentage(entry);
  if (entry.actualDose === 0) return 'pending';
  if (percentage >= 100) return percentage > 100 ? 'exceeded' : 'completed';
  return 'partial';
}
```

### 3.3 Calcul des statistiques

```typescript
/**
 * Statistiques d'une habitude sur une période
 */
export interface HabitStats {
  totalDays: number;
  activeDays: number;
  completedDays: number;
  averageCompletion: number;
  currentValue: number; // Dose actuelle
  progressFromStart: number; // % de progression depuis le début
}

export function calculateHabitStats(
  habit: Habit,
  entries: DailyEntry[],
  period: { start: string; end: string }
): HabitStats {
  const habitEntries = entries.filter(
    e => e.habitId === habit.id &&
         e.date >= period.start &&
         e.date <= period.end
  );

  const totalDays = differenceInDays(
    parseISO(period.end),
    parseISO(period.start)
  ) + 1;

  const activeDays = habitEntries.filter(e => e.actualDose > 0).length;
  const completedDays = habitEntries.filter(
    e => calculateCompletionPercentage(e) >= 100
  ).length;

  const averageCompletion = habitEntries.length > 0
    ? habitEntries.reduce(
        (sum, e) => sum + calculateCompletionPercentage(e), 0
      ) / habitEntries.length
    : 0;

  const currentValue = calculateTargetDose(habit, period.end);
  const progressFromStart = habit.progression
    ? ((currentValue - habit.progression.initialValue) /
       habit.progression.initialValue) * 100
    : 0;

  return {
    totalDays,
    activeDays,
    completedDays,
    averageCompletion: Math.round(averageCompletion),
    currentValue,
    progressFromStart: Math.round(progressFromStart),
  };
}
```

### 3.4 Tests de la logique de progression

```typescript
// src/services/__tests__/progression.test.ts

describe('calculateTargetDose', () => {
  it('augmente de 3% par semaine correctement', () => {
    const habit: Habit = {
      id: '1',
      name: 'Push-ups',
      emoji: '💪',
      type: 'progressive',
      createdAt: '2025-01-01',
      progression: {
        direction: 'increase',
        mode: 'percentage',
        period: 'weekly',
        initialValue: 10,
        changeValue: 3,
        unit: 'répétitions',
      },
    };

    // Semaine 0 : 10
    expect(calculateTargetDose(habit, '2025-01-01')).toBe(10);
    // Semaine 1 : 10 * 1.03 = 10.3 → 11 (arrondi plafond)
    expect(calculateTargetDose(habit, '2025-01-08')).toBe(11);
    // Semaine 4 : 10 * 1.03^4 = 11.26 → 12
    expect(calculateTargetDose(habit, '2025-01-29')).toBe(12);
  });

  it('réduit de 5% par semaine correctement', () => {
    const habit: Habit = {
      id: '2',
      name: 'Cigarettes',
      emoji: '🚬',
      type: 'progressive',
      createdAt: '2025-01-01',
      progression: {
        direction: 'decrease',
        mode: 'percentage',
        period: 'weekly',
        initialValue: 20,
        changeValue: 5,
        targetValue: 0,
        unit: 'cigarettes',
      },
    };

    // Semaine 0 : 20
    expect(calculateTargetDose(habit, '2025-01-01')).toBe(20);
    // Semaine 1 : 20 * 0.95 = 19 (arrondi plancher)
    expect(calculateTargetDose(habit, '2025-01-08')).toBe(19);
    // Semaine 4 : 20 * 0.95^4 = 16.29 → 16
    expect(calculateTargetDose(habit, '2025-01-29')).toBe(16);
  });

  it('respecte la valeur cible maximum', () => {
    const habit: Habit = {
      id: '3',
      name: 'Push-ups',
      emoji: '💪',
      type: 'progressive',
      createdAt: '2025-01-01',
      progression: {
        direction: 'increase',
        mode: 'absolute',
        period: 'daily',
        initialValue: 10,
        targetValue: 15,
        changeValue: 1,
        unit: 'répétitions',
      },
    };

    // Jour 10 : plafonné à 15
    expect(calculateTargetDose(habit, '2025-01-11')).toBe(15);
  });
});
```

### 3.5 Livrables Phase 3

- [ ] Service `progression.ts` avec tous les calculs
- [ ] Fonction `calculateTargetDose` (absolu et pourcentage)
- [ ] Fonction `calculateCompletionPercentage`
- [ ] Fonction `calculateHabitStats`
- [ ] Tests unitaires couvrant tous les cas de figure
- [ ] Documentation des règles d'arrondi

---

## Phase 4 : Import/Export avec validation et migration

### 4.1 Validation du schéma

```typescript
// src/services/validation.ts

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide la structure d'un fichier importé
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Format de fichier invalide'], warnings };
  }

  const obj = data as Record<string, unknown>;

  // Vérifier schemaVersion
  if (typeof obj.schemaVersion !== 'number') {
    errors.push('Version du schéma manquante');
  } else if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    errors.push(
      `Version du fichier (${obj.schemaVersion}) plus récente que l'application (${CURRENT_SCHEMA_VERSION})`
    );
  } else if (obj.schemaVersion < CURRENT_SCHEMA_VERSION) {
    warnings.push(
      `Le fichier sera migré de la version ${obj.schemaVersion} vers ${CURRENT_SCHEMA_VERSION}`
    );
  }

  // Vérifier habits
  if (!Array.isArray(obj.habits)) {
    errors.push('Liste des habitudes invalide');
  } else {
    obj.habits.forEach((habit, i) => {
      const habitErrors = validateHabit(habit, i);
      errors.push(...habitErrors);
    });
  }

  // Vérifier entries
  if (!Array.isArray(obj.entries)) {
    errors.push('Liste des entrées invalide');
  } else {
    obj.entries.forEach((entry, i) => {
      const entryErrors = validateEntry(entry, i);
      errors.push(...entryErrors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateHabit(habit: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Habitude #${index + 1}`;

  if (!habit || typeof habit !== 'object') {
    return [`${prefix}: format invalide`];
  }

  const h = habit as Record<string, unknown>;

  if (typeof h.id !== 'string' || !h.id) {
    errors.push(`${prefix}: id manquant`);
  }
  if (typeof h.name !== 'string' || !h.name) {
    errors.push(`${prefix}: nom manquant`);
  }
  if (!['simple', 'progressive'].includes(h.type as string)) {
    errors.push(`${prefix}: type invalide`);
  }

  return errors;
}

function validateEntry(entry: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Entrée #${index + 1}`;

  if (!entry || typeof entry !== 'object') {
    return [`${prefix}: format invalide`];
  }

  const e = entry as Record<string, unknown>;

  if (typeof e.habitId !== 'string') {
    errors.push(`${prefix}: habitId manquant`);
  }
  if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date as string)) {
    errors.push(`${prefix}: date invalide (format attendu: YYYY-MM-DD)`);
  }

  return errors;
}
```

### 4.2 Système de migrations

```typescript
// src/services/migrations.ts

type Migration = (data: AppData) => AppData;

/**
 * Registry des migrations par version
 * Clé = version source, valeur = fonction de migration vers version+1
 */
const MIGRATIONS: Record<number, Migration> = {
  // Exemple : migration de v1 vers v2
  // 1: (data) => {
  //   return {
  //     ...data,
  //     schemaVersion: 2,
  //     habits: data.habits.map(h => ({
  //       ...h,
  //       newField: 'defaultValue',
  //     })),
  //   };
  // },
};

/**
 * Applique toutes les migrations nécessaires
 */
export function runMigrations(data: AppData): AppData {
  let current = { ...data };

  while (current.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migration = MIGRATIONS[current.schemaVersion];
    if (!migration) {
      console.warn(
        `Pas de migration pour v${current.schemaVersion}, saut vers v${CURRENT_SCHEMA_VERSION}`
      );
      current.schemaVersion = CURRENT_SCHEMA_VERSION;
      break;
    }

    console.log(`Migration v${current.schemaVersion} → v${current.schemaVersion + 1}`);
    current = migration(current);
  }

  return current;
}
```

### 4.3 Export des données

```typescript
// src/services/export.ts

/**
 * Exporte les données en fichier JSON téléchargeable
 */
export function exportData(data: AppData): void {
  const exportData: AppData = {
    ...data,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob(
    [JSON.stringify(exportData, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const filename = `doucement-export-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
```

### 4.4 Import des données

```typescript
// src/services/import.ts

export type ImportMode = 'replace' | 'merge';

export interface ImportOptions {
  mode: ImportMode;
  onConflict?: 'keep-existing' | 'keep-imported';
}

/**
 * Importe des données depuis un fichier JSON
 */
export async function importData(
  file: File,
  options: ImportOptions
): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const importedData = JSON.parse(text);

    // Valider
    const validation = validateImportData(importedData);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join('. '),
      };
    }

    // Migrer si nécessaire
    const migratedData = runMigrations(importedData as AppData);

    // Appliquer selon le mode
    if (options.mode === 'replace') {
      saveData(migratedData);
      return {
        success: true,
        message: 'Import réussi. Vos données sont restaurées.',
      };
    }

    // Mode fusion
    const currentData = loadData();
    const mergedData = mergeData(currentData, migratedData, options.onConflict);
    saveData(mergedData);

    return {
      success: true,
      message: 'Import réussi. Les données ont été fusionnées.',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Ce fichier ne semble pas compatible. Vérifiez qu\'il s\'agit d\'un export Doucement.',
    };
  }
}

/**
 * Fusionne deux jeux de données
 */
function mergeData(
  current: AppData,
  imported: AppData,
  onConflict: 'keep-existing' | 'keep-imported' = 'keep-existing'
): AppData {
  // Fusionner les habitudes (par id)
  const habitMap = new Map(current.habits.map(h => [h.id, h]));
  for (const habit of imported.habits) {
    if (!habitMap.has(habit.id) || onConflict === 'keep-imported') {
      habitMap.set(habit.id, habit);
    }
  }

  // Fusionner les entrées (par habitId + date)
  const entryMap = new Map(
    current.entries.map(e => [`${e.habitId}-${e.date}`, e])
  );
  for (const entry of imported.entries) {
    const key = `${entry.habitId}-${entry.date}`;
    if (!entryMap.has(key) || onConflict === 'keep-imported') {
      entryMap.set(key, entry);
    }
  }

  return {
    ...current,
    habits: Array.from(habitMap.values()),
    entries: Array.from(entryMap.values()),
  };
}
```

### 4.5 Livrables Phase 4

- [ ] Service `validation.ts` avec validation complète du schéma
- [ ] Service `migrations.ts` avec système de migrations versionné
- [ ] Service `export.ts` pour téléchargement JSON
- [ ] Service `import.ts` avec modes remplacer/fusionner
- [ ] Composant UI pour import/export dans Settings
- [ ] Tests d'intégration pour import/export
- [ ] Tests de migration (round-trip)

---

## Phase 5 : Écrans principaux

### 5.1 Onboarding (4 écrans)

**Fichiers :**
- `src/pages/Onboarding/index.tsx`
- `src/pages/Onboarding/OnboardingStep.tsx`
- `src/pages/Onboarding/steps.ts` (contenu des écrans)

**Comportement :**
1. Afficher si `preferences.onboardingCompleted === false`
2. Navigation par swipe ou boutons
3. Skip discret en haut à droite
4. À la fin : `preferences.onboardingCompleted = true`
5. Redirection vers création première habitude

**Contenu :** Voir `docs/comm/textes-onboarding.md`

### 5.2 Aujourd'hui (écran principal)

**Fichiers :**
- `src/pages/Today/index.tsx`
- `src/pages/Today/DailyHeader.tsx`
- `src/pages/Today/EncouragingMessage.tsx`
- `src/components/habits/HabitCard.tsx`
- `src/components/habits/CheckInButtons.tsx`

**Structure :**
```
┌─────────────────────────────────────┐
│ [Date]                    [% jour]  │
│ Message encourageant du moment      │
│                                     │
│ TES DOSES DU JOUR                   │
│                                     │
│ ┌─ HabitCard ─────────────────────┐ │
│ │ 💪 Push-ups          [15 reps]  │ │
│ │ "Tu en étais à 12..."           │ │
│ │ [Un peu] [  Fait  ] [Extra]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─ HabitCard ─────────────────────┐ │
│ │ 🧘 Méditation         [5 min]   │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│  [Aujourd'hui]  [+]  [Progrès]      │
└─────────────────────────────────────┘
```

**Logique :**
- Charger habitudes non archivées
- Pour chaque habitude, calculer `targetDose` du jour
- Afficher entrée existante si déjà faite
- Messages selon moment de la journée (matin/après-midi/soir)

### 5.3 Check-in

**Composant :** `src/components/habits/CheckInButtons.tsx`

**Options :**
1. **Un peu** : Ouvre un input pour saisir valeur partielle
2. **Fait** : Enregistre `actualDose = targetDose`
3. **Extra** : Ouvre un input pour saisir valeur supérieure

**Animation de célébration :** Sur complétion 100%+

### 5.4 Liste des habitudes

**Fichiers :**
- `src/pages/HabitList/index.tsx`
- `src/pages/HabitList/HabitListItem.tsx`

**Affichage :**
- Habitudes actives avec statistiques rapides
- Section habitudes archivées (collapsed)
- Bouton "Créer une habitude"

### 5.5 Création d'habitude

**Fichiers :**
- `src/pages/CreateHabit/index.tsx`
- `src/pages/CreateHabit/StepType.tsx`
- `src/pages/CreateHabit/StepDetails.tsx`
- `src/pages/CreateHabit/StepConfirm.tsx`

**Flux en 3 étapes :**

```
Étape 1: Type              Étape 2: Détails          Étape 3: Confirmation
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ ○ Augmenter  │          │ Nom: [____]  │          │ Résumé :     │
│   (ex: sport)│   ───▶   │ Emoji: [🏃]  │   ───▶   │              │
│ ○ Réduire    │          │ Départ: [10] │          │ Push-ups     │
│   (ex: sucre)│          │ Rythme: [+3%]│          │ 10 → 15/sem  │
│ ○ Maintenir  │          │ Par: [sem]   │          │ +3% / semaine│
│   (oui/non)  │          │ Unité: [___] │          │              │
└──────────────┘          └──────────────┘          │ [Créer]      │
                                                    └──────────────┘
```

### 5.6 Détail d'une habitude

**Fichiers :**
- `src/pages/HabitDetail/index.tsx`
- `src/pages/HabitDetail/ProgressChart.tsx`
- `src/pages/HabitDetail/WeeklyCalendar.tsx`
- `src/pages/HabitDetail/StatsCards.tsx`

**Contenu :**
- Graphique de progression (dose cible vs réalisé)
- Calendrier semaine avec états (fait/partiel/vide)
- Statistiques : jours actifs, % moyen, progression
- Boutons : Modifier / Archiver

### 5.7 Livrables Phase 5

- [ ] Onboarding complet (4 écrans + skip + flag localStorage)
- [ ] Écran Aujourd'hui avec HabitCards dynamiques
- [ ] Check-in fonctionnel (partiel/fait/extra)
- [ ] Animations de célébration
- [ ] Liste des habitudes (actives + archivées)
- [ ] Création d'habitude (wizard 3 étapes)
- [ ] Détail habitude avec stats et graphiques
- [ ] Navigation bottom fonctionnelle
- [ ] Messages selon `docs/comm/banque-messages.md`

---

## Résumé des livrables par phase

| Phase | Durée estimée | Livrables clés |
|-------|---------------|----------------|
| 1 | - | Structure Vite, design system, composants de base |
| 2 | - | Types, localStorage, hook useAppData |
| 3 | - | Calculs progression, arrondis, statistiques |
| 4 | - | Import/export, validation, migrations |
| 5 | - | 5 écrans fonctionnels, navigation complète |

---

## Critères de qualité

### Tests
- [ ] Couverture > 80% pour services (logique métier)
- [ ] Tests E2E pour flux critiques (création habitude, check-in)

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Pas de re-renders inutiles (React.memo où approprié)

### Accessibilité
- [ ] WCAG AA pour tous les contrastes
- [ ] Zones de toucher 44x44px minimum
- [ ] Support `prefers-reduced-motion`
- [ ] Labels ARIA sur éléments interactifs

### UX
- [ ] Check-in < 30 secondes, 2 taps max
- [ ] Aucun mot interdit (échec, raté, manqué...)
- [ ] Messages en français avec écriture inclusive

---

*Document créé le 9 janvier 2026*
*Version 1.0*
