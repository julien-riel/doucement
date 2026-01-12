# /status — Afficher la progression du projet

Commande pour visualiser l'état d'avancement du projet en cours.

## Usage

- `/status` — Affiche la progression complète
- `/status phase-1` — Détails d'une phase spécifique
- `/status blocked` — Liste uniquement les tâches bloquées

$ARGUMENTS

## Affichage principal

```
┌─────────────────────────────────────────────────────┐
│ Projet: Mode Compteur                               │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  42%      │
│ 5/12 tâches complétées                              │
├─────────────────────────────────────────────────────┤
│ ✅ phase-types     (3/3)  → v1.9.0                  │
│ 🔄 phase-ui        (2/5)  en cours                  │
│ ⏳ phase-tests     (0/4)  en attente                │
├─────────────────────────────────────────────────────┤
│ Prochaine: ui.3 - Créer composant CounterButtons   │
│ Bloquées: 1 tâche (voir /status blocked)           │
└─────────────────────────────────────────────────────┘
```

## Workflow

### 1. Lire tasks.json

Charger le fichier `tasks.json` et extraire :
- Informations du projet
- Toutes les phases et leurs tâches
- Statistiques globales

### 2. Calculer la progression

```typescript
const progress = {
  total: stats.totalTasks,
  completed: stats.completed,
  inProgress: stats.inProgress,
  pending: stats.pending,
  blocked: stats.blocked,
  percentage: Math.round((stats.completed / stats.totalTasks) * 100)
}
```

### 3. Générer la barre de progression

```typescript
const barLength = 40
const filled = Math.round((percentage / 100) * barLength)
const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled)
```

### 4. Lister les phases

Pour chaque phase :
- Icône selon statut : ✅ (completed), 🔄 (in_progress), ⏳ (pending)
- Compteur de tâches (X/Y)
- Version de release si complétée

### 5. Identifier la prochaine tâche

Trouver la première tâche éligible :
- `status === 'pending'`
- Toutes les dépendances sont `completed`
- Trier par priorité

### 6. Compter les blocages

Lister les tâches avec `status === 'blocked'`

## Affichage détaillé d'une phase

Si `/status phase-1` :

```
┌─────────────────────────────────────────────────────┐
│ Phase: phase-ui - Interface utilisateur             │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20%       │
│ 1/5 tâches                                          │
├─────────────────────────────────────────────────────┤
│ ✅ ui.1  Créer composant CounterButtons     (high)  │
│ 🔄 ui.2  Intégrer dans HabitCard            (high)  │
│ ⏳ ui.3  Couleurs selon direction           (med)   │
│ ⏳ ui.4  Option dans CreateHabit            (high)  │
│ 🚫 ui.5  Option dans EditHabit              (med)   │
│          └─ Bloqué: dépend de ui.4                  │
├─────────────────────────────────────────────────────┤
│ Release prévue: minor (→ v1.10.0)                   │
└─────────────────────────────────────────────────────┘
```

## Affichage des tâches bloquées

Si `/status blocked` :

```
┌─────────────────────────────────────────────────────┐
│ Tâches bloquées: 2                                  │
├─────────────────────────────────────────────────────┤
│ 🚫 ui.5  Option dans EditHabit                      │
│    Raison: Dépend de ui.4 (pending)                 │
│    Action: Compléter ui.4 d'abord                   │
├─────────────────────────────────────────────────────┤
│ 🚫 test.2  Tests E2E compteur                       │
│    Raison: Erreur de validation après 3 tentatives  │
│    Action: Intervention manuelle requise            │
└─────────────────────────────────────────────────────┘
```

## Légende des icônes

| Icône | Statut | Description |
|-------|--------|-------------|
| ✅ | completed | Tâche terminée |
| 🔄 | in_progress | Tâche en cours |
| ⏳ | pending | Tâche en attente |
| 🚫 | blocked | Tâche bloquée |

## Couleurs des priorités

| Priorité | Affichage |
|----------|-----------|
| high | (high) en gras |
| medium | (med) normal |
| low | (low) grisé |

## Exemples

```bash
# Progression globale
/status

# Détails d'une phase
/status phase-ui

# Voir les blocages
/status blocked
```

## Notes

- Cette commande est en lecture seule
- Ne modifie jamais tasks.json
- Peut être appelée à tout moment pour vérifier l'état
