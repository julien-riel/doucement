# /implement-habits — Implémenter des tâches d'amélioration des habitudes

## Usage
- `/implement-habits` — Prochaine(s) tâche(s) high priority de habits-tasks.json
- `/implement-habits fix.1 fix.2` — Tâches spécifiques par ID
- `/implement-habits phase phase-fix` — Toutes les pending de la phase spécifiée

$ARGUMENTS

## Workflow

### 1. Chargement du contexte (UNE SEULE FOIS)

Charge en parallèle :
- `habits-tasks.json` — Liste des tâches d'amélioration des habitudes
- `docs/habit-types-analysis.md` — Analyse des types d'habitudes
- `src/constants/suggestedHabits.ts` — Habitudes suggérées
- `src/types/index.ts` — Types TypeScript

**Pas de sous-agent.** Tout est fait directement.

### 2. Sélection intelligente

```typescript
// Logique simple
const tasks = filterTasks(arguments)
  .filter(t => t.status === 'pending')
  .sort((a, b) => priorityScore(a) - priorityScore(b))
  .slice(0, estimateBatchSize()) // 1-3 selon complexité
```

Priorités :
- `high` = 10
- `medium` = 5
- `low` = 1

### 3. Implémentation par tâche

Pour chaque tâche :

1. **Marquer "in_progress"** dans habits-tasks.json
2. **Lire les fichiers** listés dans `files[]`
3. **Implémenter** le changement demandé
4. **Écrire les tests** si nécessaire
5. **Valider** avec format, lint, typecheck, test, test:e2e
6. **Marquer "completed"** avec `completedAt`

### 4. Règles de code

#### Pour les habitudes suggérées
- Suivre le format existant dans `suggestedHabits.ts`
- Toujours utiliser les types définis dans `src/types/index.ts`
- Valeurs par défaut cohérentes avec l'analyse

#### Pour les tests E2E
- Utiliser la structure des tests existants dans `e2e/`
- Charger les fixtures via le Debug Panel
- Vérifier les interactions utilisateur complètes

#### Pour les fixtures
- Format JSON cohérent avec `AppData`
- Dates relatives à aujourd'hui
- Scénarios réalistes et testables

### 5. Phases disponibles

| Phase | Description | Priorité | Statut |
|-------|-------------|----------|--------|
| `phase-fix` | Corrections des habitudes suggérées | Haute | ✅ Complète |
| `phase-decrease` | Amélioration habitudes à réduire | Haute | ✅ Complète |
| `phase-cumulative` | Support saisie cumulative | Moyenne | ✅ Complète |
| `phase-tests-fixtures` | Fixtures de test | Haute | ✅ Complète |
| `phase-tests-e2e` | Tests E2E par type | Haute | ✅ Complète |
| `phase-tests-unit` | Tests unitaires | Moyenne | ✅ Complète |
| `phase-edit-habits` | Amélioration édition des habitudes | Haute | 🔄 En cours |

### 6. Instructions pour phase-edit-habits

Cette phase vise à rendre l'écran d'édition (`EditHabit.tsx`) aussi complet que l'écran de création (`CreateHabit.tsx`).

#### Propriétés à rendre éditables

| Propriété | Type | Priorité | Notes |
|-----------|------|----------|-------|
| `trackingFrequency` | `'daily' \| 'weekly'` | high | Fréquence quotidienne ou hebdomadaire |
| `entryMode` | `'replace' \| 'cumulative'` | high | Mode de saisie des valeurs |
| `identityStatement` | `string` | medium | Déclaration "Je deviens quelqu'un qui..." |
| `trackingMode` | `'simple' \| 'detailed'` | medium | Binaire vs numérique |
| `description` | `string` | low | Description optionnelle |

#### Règles d'implémentation

1. **Cohérence avec CreateHabit**
   - Réutiliser les mêmes composants quand possible (ex: `IdentityPrompt`)
   - Utiliser les mêmes classes CSS (préfixe `step-details__` ou créer équivalent `edit-habit__`)
   - Utiliser les messages de `src/constants/messages.ts` (ex: `ENTRY_MODE`)

2. **Habit Stacking et decrease**
   - Ne PAS afficher le sélecteur d'ancrage pour les habitudes `direction === 'decrease'`
   - Les habitudes à réduire ne doivent pas être chaînées

3. **Gestion du changement**
   - Inclure chaque nouvelle propriété dans `hasChanges` pour activer le bouton "Enregistrer"
   - Initialiser les valeurs depuis `habit` dans `useEffect`

4. **Ordre des sections dans EditHabit**
   ```
   1. Emoji (existant)
   2. Nom (existant)
   3. Unité (existant)
   4. Description (nouveau - optionnel)
   5. Card info readonly (existant)
   6. Fréquence de suivi (nouveau - trackingFrequency)
   7. Mode de suivi (nouveau - trackingMode)
   8. Mode de saisie (nouveau - entryMode)
   9. Progression (existant - sauf maintain)
   10. Objectif final (existant - sauf maintain)
   11. Intention de mise en œuvre (existant)
   12. Enchaînement d'habitudes (existant - sauf decrease)
   13. Déclaration d'identité (nouveau - identityStatement)
   ```

5. **Tests**
   - Créer `e2e/habit-edit.spec.ts` pour tester les modifications
   - Vérifier que les changements sont persistés après sauvegarde

### 7. Finalisation

Après chaque tâche :
1. Mettre à jour `habits-tasks.json` avec `completedAt`
2. Recalculer les stats
3. Afficher le résumé

## Exemples

```bash
# Améliorer l'édition des habitudes (phase active)
/implement-habits phase phase-edit-habits

# Implémenter une tâche spécifique d'édition
/implement-habits edit.1

# Implémenter les tâches high priority d'édition
/implement-habits edit.1 edit.2 edit.6

# Anciennes phases (complétées)
/implement-habits phase phase-fix
/implement-habits phase phase-tests-fixtures
```

## Notes

- Référencer `docs/habit-types-analysis.md` pour les décisions
- Utiliser les messages de `src/constants/messages.ts`
- Respecter le design system pour l'UI
- Tester manuellement via le Debug Panel si nécessaire
