# PRD - Refactoring Architectural

## Objectif

Améliorer la maintenabilité et la robustesse du codebase en adressant les recommandations d'audit architectural identifiées :
1. Réduire la taille des fichiers volumineux (EditHabit.tsx)
2. Éliminer les anti-patterns React (état mutable module-level)
3. Améliorer la gestion d'erreurs (ErrorBoundary)
4. Documenter l'architecture 3-tier
5. Extraire la logique commune des formulaires dans un hook réutilisable

## Contexte

Suite à un audit architectural, plusieurs points d'amélioration ont été identifiés :

| Problème | Fichier | Impact |
|----------|---------|--------|
| Fichier trop volumineux (787 lignes) | `src/pages/EditHabit.tsx` | Maintenabilité |
| État mutable module-level | `src/hooks/useDebugMode.ts` | Bugs potentiels en Strict Mode |
| Erreurs silencieuses localStorage | `src/components/AppProvider.tsx` | Masque les corruptions de données |
| Architecture non documentée | `docs/ARCHITECTURE.md` | Onboarding difficile |
| Duplication logique formulaire | `EditHabit.tsx` vs `CreateHabit/` | DRY violation |

**Note importante** : `CreateHabit` est déjà bien refactoré avec un Context (`CreateHabitContext.tsx`) et des étapes modulaires (`steps/`). Le travail principal est sur `EditHabit.tsx`.

## Use Cases

### UC1 - Développeur modifie la logique de formulaire habitude
**Avant** : Doit modifier 2 endroits (CreateHabit et EditHabit) avec risque d'incohérence.
**Après** : Modifie le hook `useHabitForm` une seule fois.

### UC2 - Erreur de parsing localStorage
**Avant** : Erreur silencieusement ignorée, données potentiellement corrompues sans avertissement.
**Après** : Erreur loggée, état d'erreur accessible, utilisateur potentiellement notifié.

### UC3 - Nouveau développeur rejoint le projet
**Avant** : Doit lire le code pour comprendre l'architecture.
**Après** : Lit la section "Architecture 3-tier" dans ARCHITECTURE.md.

## Architecture technique

### Nouveau fichier : `src/hooks/useHabitForm.ts`

Hook partagé pour la gestion des formulaires d'habitude :

```typescript
interface UseHabitFormOptions {
  initialHabit?: Habit  // Pour l'édition
  onSubmit: (input: CreateHabitInput | UpdateHabitInput) => void
}

interface UseHabitFormReturn {
  // État du formulaire
  form: HabitFormState
  updateField: <K extends keyof HabitFormState>(key: K, value: HabitFormState[K]) => void
  resetForm: () => void

  // Validation
  isValid: boolean
  hasChanges: boolean  // Pour EditHabit uniquement
  errors: Record<string, string>

  // Soumission
  handleSubmit: () => void
  isSubmitting: boolean
}
```

### Refactoring `EditHabit.tsx`

Découper en :
- `src/pages/EditHabit/index.tsx` - Composant principal (~150 lignes)
- `src/pages/EditHabit/EditHabitContext.tsx` - Context similaire à CreateHabit
- `src/pages/EditHabit/sections/` - Sections du formulaire réutilisées

### Correction `useDebugMode.ts`

Remplacer :
```typescript
// AVANT (anti-pattern)
let tapCount = 0
let tapTimer: ReturnType<typeof setTimeout> | null = null
```

Par :
```typescript
// APRÈS (React-safe)
const tapCountRef = useRef(0)
const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

### Nouveau composant : `src/components/ErrorBoundary.tsx`

```typescript
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}
```

Capture les erreurs de rendu et les erreurs de parsing localStorage.

### Amélioration `AppProvider.tsx`

```typescript
// AVANT
catch {
  // Ignorer les erreurs de parsing
}

// APRÈS
catch (error) {
  console.error('[AppProvider] Failed to parse localStorage data:', error)
  // Optionnel: déclencher un état d'erreur ou une notification
}
```

## Structures de données

Aucune nouvelle structure de données. Réutilisation des types existants :
- `HabitFormState` (déjà défini dans `CreateHabit/types.ts`)
- `CreateHabitInput`, `UpdateHabitInput` (dans `src/types/index.ts`)

## Contraintes

- **Pas de régression fonctionnelle** : Les tests E2E existants doivent passer
- **Pas de changement d'UX** : L'interface utilisateur reste identique
- **Compatibilité Strict Mode** : Le code doit fonctionner avec React Strict Mode

## Critères de succès

1. **EditHabit.tsx** : Fichier principal < 200 lignes
2. **useDebugMode.ts** : Aucune variable module-level mutable
3. **AppProvider.tsx** : Erreurs de parsing loggées
4. **ARCHITECTURE.md** : Section "Gestion d'état 3-tier" ajoutée
5. **Tests** : Tous les tests existants passent (`npm test` + `npm run test:e2e`)
6. **TypeScript** : `npm run typecheck` passe sans erreur
7. **Hook useHabitForm** : Utilisé par EditHabit (CreateHabit optionnel pour cette phase)

## Hors périmètre

- Refactoring de `CreateHabit/` (déjà bien structuré)
- Modification de `useCelebrations.ts` (sera traité séparément)
- Ajout de tests supplémentaires (focus sur non-régression)
