# /implement — Implémenter des tâches du backlog

## Usage
- `/implement` — Prochaine(s) tâche(s) high priority
- `/implement 2.1 2.2` — Tâches spécifiques
- `/implement phase 2` — Toutes les pending de la phase 2

$ARGUMENTS

## Workflow

### 1. Chargement du contexte (UNE SEULE FOIS)

Charge en parallèle :
- `tasks.json` — Liste des tâches
- `docs/prd.md` — Vue produit (lecture partielle si > 10k tokens)
- `docs/design/design-system-specification.md` — Design tokens
- Structure du projet via `list_dir` récursif

**Pas de sous-agent.** Tout est fait directement.

### 2. Sélection intelligente

```typescript
// Logique simple
const tasks = filterTasks(arguments)
  .filter(t => t.status === 'pending')
  .sort((a, b) => priorityScore(a) - priorityScore(b))
  .slice(0, estimateBatchSize()) // 1-3 selon complexité
  ```
  