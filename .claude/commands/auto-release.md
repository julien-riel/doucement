# /auto-release — Release automatique sans interaction

Commande pour créer une release automatiquement quand une phase est complétée.

## Usage

- `/auto-release` — Détecte et release la dernière phase complétée
- `/auto-release phase-1` — Release pour une phase spécifique

$ARGUMENTS

## Mode autonome (OBLIGATOIRE)

**Cette commande est exécutée sans supervision humaine.**

- **NE JAMAIS utiliser `AskUserQuestion`**
- **NE JAMAIS demander de confirmation**
- Générer automatiquement le titre et les highlights
- Déterminer le type de version depuis `phase.releaseType`

## Workflow

### 1. Identifier la phase à releaser

Si aucun argument :
- Trouver la dernière phase avec `status === 'completed'`
- Qui n'a pas encore été releasée (pas dans `lastRelease` context)

Si argument fourni :
- Vérifier que la phase existe et est complétée
- Sinon, afficher un message d'erreur et arrêter

### 2. Lire la version actuelle

Lire `public/release-notes.json` :
```json
{
  "currentVersion": "1.9.0",
  "releases": [...]
}
```

### 3. Calculer la nouvelle version

Selon `phase.releaseType` :

```typescript
function bumpVersion(current: string, type: string): string {
  const [major, minor, patch] = current.split('.').map(Number)

  switch (type) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
    default: return `${major}.${minor}.${patch + 1}`
  }
}
```

### 4. Générer le titre

Format : `{phase.name}`

Exemples :
- "Interface utilisateur"
- "Tests et validation"
- "Corrections de bugs"

### 5. Générer les highlights

Pour chaque tâche complétée de la phase, créer un highlight :

```typescript
function generateHighlights(tasks: Task[]): Highlight[] {
  return tasks
    .filter(t => t.status === 'completed')
    .slice(0, 4) // Maximum 4 highlights
    .map(task => ({
      emoji: selectEmoji(task),
      text: task.name
    }))
}
```

**Sélection automatique des emojis :**

| Mot-clé dans la tâche | Emoji |
|-----------------------|-------|
| créer, ajouter, nouveau | sparkles |
| corriger, fix | tools |
| test | check |
| performance, optimiser | rocket |
| UI, design, style | paint |
| sécurité | lock |
| défaut | sparkles |

### 6. Mettre à jour release-notes.json

```json
{
  "currentVersion": "1.10.0",
  "releases": [
    {
      "version": "1.10.0",
      "date": "2026-01-11",
      "title": "Interface utilisateur",
      "highlights": [
        { "emoji": "sparkles", "text": "Créer composant CounterButtons" },
        { "emoji": "paint", "text": "Couleurs selon direction" },
        { "emoji": "sparkles", "text": "Option dans CreateHabit" }
      ]
    },
    // ... releases précédentes
  ]
}
```

### 7. Mettre à jour tasks.json

```json
{
  "lastRelease": "1.10.0",
  // ... reste du fichier
}
```

Marquer la phase comme releasée :
```json
{
  "id": "phase-ui",
  "status": "completed",
  "releasedAs": "1.10.0",
  "releasedAt": "2026-01-11"
}
```

### 8. Créer le commit

```bash
git add public/release-notes.json tasks.json
git commit -m "release: v1.10.0 - Interface utilisateur

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 9. Afficher le résumé

```
## Release créée

**Version:** 1.10.0
**Titre:** Interface utilisateur
**Type:** minor

**Highlights:**
- ✨ Créer composant CounterButtons
- 🎨 Couleurs selon direction
- ✨ Option dans CreateHabit

**Commit:** abc1234
```

## Règles importantes

1. **Ne jamais perdre de données** — Préserver toutes les releases existantes
2. **Ordre chronologique inversé** — Nouvelle release en premier dans le tableau
3. **Dates ISO** — Format YYYY-MM-DD uniquement
4. **Maximum 4 highlights** — Garder les notes concises
5. **Ton bienveillant** — Utiliser un vocabulaire positif

## Emojis disponibles

| Nom | Emoji | Usage |
|-----|-------|-------|
| sparkles | ✨ | Nouvelle fonctionnalité |
| rocket | 🚀 | Performance |
| tools | 🛠️ | Amélioration technique |
| paint | 🎨 | Design / UI |
| check | ✅ | Validation / Tests |
| lock | 🔒 | Sécurité |
| chart | 📊 | Statistiques |
| bell | 🔔 | Notifications |
| calendar | 📅 | Planning |
| target | 🎯 | Objectifs |
| zap | ⚡ | Rapide |
| bug | 🐛 | Correction |

## Exemples

```bash
# Release automatique de la dernière phase
/auto-release

# Release d'une phase spécifique
/auto-release phase-ui
```

## Gestion des erreurs

Si la phase n'est pas complète :
```
❌ La phase "phase-ui" n'est pas encore complétée (3/5 tâches).
Complète d'abord les tâches restantes avec /implement.
```

Si déjà releasée :
```
❌ La phase "phase-ui" a déjà été releasée en v1.10.0.
```

## Notes

- Cette commande est généralement appelée par `auto-implement.sh`
- Peut aussi être appelée manuellement après vérification
- Ne fait pas de `git push` (laissé au script ou à l'utilisateur)
