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

| Phase | Description | Priorité |
|-------|-------------|----------|
| `phase-fix` | Corrections des habitudes suggérées | Haute |
| `phase-decrease` | Amélioration habitudes à réduire | Haute |
| `phase-cumulative` | Support saisie cumulative | Moyenne |
| `phase-tests-fixtures` | Fixtures de test | Haute |
| `phase-tests-e2e` | Tests E2E par type | Haute |
| `phase-tests-unit` | Tests unitaires | Moyenne |

### 6. Finalisation

Après chaque tâche :
1. Mettre à jour `habits-tasks.json` avec `completedAt`
2. Recalculer les stats
3. Afficher le résumé

## Exemples

```bash
# Corriger les habitudes suggérées
/implement-habits phase phase-fix

# Implémenter une tâche spécifique
/implement-habits dec.1

# Créer toutes les fixtures
/implement-habits phase phase-tests-fixtures
```

## Notes

- Référencer `docs/habit-types-analysis.md` pour les décisions
- Utiliser les messages de `src/constants/messages.ts`
- Respecter le design system pour l'UI
- Tester manuellement via le Debug Panel si nécessaire
