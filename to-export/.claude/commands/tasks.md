# /tasks — Gestion des tâches du projet

Commande interactive pour définir, planifier et suivre les tâches d'un projet.

## Usage

- `/tasks` — Discussion libre pour définir un nouveau projet
- `/tasks "Ajouter un mode sombre"` — Démarrer avec une idée initiale
- `/tasks docs/prd-feature.md` — Lire un PRD existant et générer les tâches

$ARGUMENTS

## Mode interactif (OBLIGATOIRE)

**Cette commande est conçue pour interagir avec l'utilisateur.**

C'est le SEUL moment où l'interaction humaine est autorisée dans le workflow.
Utilise `AskUserQuestion` pour :
- Clarifier les besoins
- Proposer des choix d'implémentation
- Valider la compréhension

## Workflow

### 1. Écoute et compréhension

Si un argument est fourni :
- Si c'est un chemin de fichier (.md) : lire le PRD
- Si c'est une chaîne de texte : utiliser comme point de départ

Si aucun argument :
- Demander à l'utilisateur de décrire son projet/idée

### 2. Reformulation

Reformuler la demande de l'utilisateur pour confirmer la compréhension :

> "Si je comprends bien, tu veux [description reformulée].
> L'objectif est de [objectif principal].
> Est-ce correct ?"

### 3. Clarification

Poser des questions ciblées avec `AskUserQuestion` pour :
- Comprendre le périmètre exact
- Identifier les contraintes techniques
- Clarifier les priorités

Exemples de questions :
- "Quelles technologies veux-tu utiliser ?"
- "Y a-t-il des contraintes de temps ?"
- "Quel est le niveau de qualité attendu (MVP vs production) ?"

### 4. Proposer 2 améliorations

Suggérer 2 améliorations ou extensions de l'idée originale :

> "J'ai 2 suggestions pour améliorer ton idée :
>
> 1. **[Suggestion 1]** - [Description et bénéfices]
> 2. **[Suggestion 2]** - [Description et bénéfices]
>
> Veux-tu inclure l'une de ces suggestions ?"

Les suggestions doivent être :
- Réalistes et implémentables
- Complémentaires à l'idée de base
- Avec une valeur ajoutée claire

### 5. Planification

Créer un plan de réalisation avec :
- Phases distinctes (logiquement séparées)
- Tâches ordonnées par dépendances
- Estimation de complexité (simple/moyen/complexe)

### 6. Génération du tasks.json

Générer le fichier `tasks.json` avec :

```json
{
  "project": "Nom du projet",
  "description": "Description courte",
  "createdAt": "YYYY-MM-DD",
  "lastRelease": null,
  "phases": [
    {
      "id": "phase-id",
      "name": "Nom de la phase",
      "description": "Description",
      "status": "pending",
      "releaseType": "minor|patch|major",
      "tasks": [
        {
          "id": "1.1",
          "name": "Nom court",
          "description": "Description détaillée",
          "status": "pending",
          "priority": "high|medium|low",
          "dependsOn": ["id.dépendance"],
          "files": ["src/fichier.ts"],
          "tests": ["e2e/test.spec.ts"],
          "acceptance": ["Critère 1", "Critère 2"]
        }
      ]
    }
  ],
  "stats": {
    "totalTasks": N,
    "completed": 0,
    "inProgress": 0,
    "pending": N,
    "blocked": 0
  }
}
```

### 7. Affichage du résumé

Afficher un résumé clair du plan :

```
## Plan de réalisation

**Projet:** Nom du projet
**Phases:** 3 phases, 12 tâches

### Phase 1: Fondations (4 tâches) → release minor
- [ ] 1.1 Tâche A (high)
- [ ] 1.2 Tâche B (medium) ← dépend de 1.1
- [ ] 1.3 Tâche C (medium)
- [ ] 1.4 Tâche D (low)

### Phase 2: Interface (5 tâches) → release minor
...

### Phase 3: Tests (3 tâches) → release patch
...

**Prochaine étape:** Lancer `./scripts/auto-implement.sh` pour démarrer l'implémentation automatique.
```

## Règles de création des tâches

### Priorités

- `high` : Bloquant pour d'autres tâches ou critique
- `medium` : Important mais pas bloquant
- `low` : Nice-to-have ou polish

### Dépendances

- Identifier les tâches qui DOIVENT être faites avant
- Éviter les dépendances circulaires
- Minimiser les chaînes de dépendances longues

### Granularité

- Une tâche = 1 à 3 heures de travail max
- Si plus complexe, découper en sous-tâches
- Chaque tâche doit être testable/vérifiable

### releaseType par phase

- `major` : Changements incompatibles ou refonte majeure
- `minor` : Nouvelles fonctionnalités
- `patch` : Corrections et améliorations mineures

## Exemples

```bash
# Discussion libre
/tasks
> "Je veux ajouter un système de notifications push"

# Avec idée initiale
/tasks "Ajouter la possibilité d'exporter les données en CSV"

# Depuis un PRD
/tasks docs/prd-export-feature.md
```

## Notes

- Toujours sauvegarder tasks.json à la racine du projet
- Mettre à jour stats après création
- Proposer de lancer `/status` après génération
