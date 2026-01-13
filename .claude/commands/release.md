# /release — Créer une nouvelle version

Crée une nouvelle release avec mise à jour du fichier `public/release-notes.json`.

## Usage

- `/release` — Crée une version patch (ex: 1.0.0 → 1.0.1)
- `/release minor` — Crée une version minor (ex: 1.0.0 → 1.1.0)
- `/release major` — Crée une version major (ex: 1.0.0 → 2.0.0)
- `/release 1.2.3` — Crée une version spécifique

$ARGUMENTS

## Workflow

### 1. Lecture du fichier actuel

Lis le fichier `public/release-notes.json` pour obtenir la version actuelle.

### 2. Calcul de la nouvelle version

Selon les arguments :
- Si aucun argument ou `patch` : incrémente le dernier chiffre (1.0.0 → 1.0.1)
- Si `minor` : incrémente le deuxième chiffre, reset le troisième (1.0.1 → 1.1.0)
- Si `major` : incrémente le premier chiffre, reset les autres (1.2.3 → 2.0.0)
- Si une version spécifique (ex: `2.0.0`) : utilise cette version

### 3. Collecte des informations

Utilise `AskUserQuestion` pour demander :

1. **Titre de la release** (ex: "Améliorations de performance", "Nouvelle fonctionnalité")
2. **Highlights** - Demande jusqu'à 4 points forts :
   - Pour chaque highlight, demande l'emoji (parmi: sparkles, bell, rocket, star, gift, heart, check, zap, paint, bug, tools, chart, lock, sun, moon, calendar, target, muscle, leaf, fire)
   - Et le texte descriptif

### 4. Mise à jour du fichier

Met à jour `public/release-notes.json` :
- Change `currentVersion` avec la nouvelle version
- Ajoute la nouvelle release EN PREMIER dans le tableau `releases`
- Date = date du jour au format YYYY-MM-DD

### 5. Publication

Affiche un résumé de la release créée et crée un commit avec le message :
```
release: v{version} - {titre}
```

Ensuite pousse sur main


## Structure du fichier release-notes.json

```json
{
  "currentVersion": "1.1.0",
  "releases": [
    {
      "version": "1.1.0",
      "date": "2026-01-15",
      "title": "Titre de la release",
      "highlights": [
        { "emoji": "sparkles", "text": "Description du changement" },
        { "emoji": "bug", "text": "Correction d'un bug" }
      ],
      "details": "Description optionnelle plus longue"
    },
    {
      "version": "1.0.0",
      "date": "2026-01-10",
      "title": "Lancement de Doucement",
      "highlights": [...]
    }
  ]
}
```

## Emojis disponibles

| Nom | Emoji | Usage recommandé |
|-----|-------|------------------|
| sparkles | ✨ | Nouvelle fonctionnalité |
| rocket | 🚀 | Performance |
| bug | 🐛 | Correction de bug |
| paint | 🎨 | Design / UI |
| tools | 🛠️ | Amélioration technique |
| bell | 🔔 | Notifications |
| chart | 📊 | Statistiques / Graphiques |
| lock | 🔒 | Sécurité / Confidentialité |
| calendar | 📅 | Planning / Dates |
| target | 🎯 | Objectifs |
| muscle | 💪 | Motivation |
| leaf | 🌿 | Bien-être |
| fire | 🔥 | Important |
| star | ⭐ | Mise en avant |
| gift | 🎁 | Bonus |
| heart | ❤️ | Favoris |
| check | ✅ | Validation |
| zap | ⚡ | Rapide |
| sun | ☀️ | Mode clair |
| moon | 🌙 | Mode sombre |

## Règles importantes

1. **Ne jamais perdre de données** — Toujours préserver les releases existantes
2. **Ordre chronologique inversé** — La release la plus récente en premier
3. **Dates ISO** — Format YYYY-MM-DD uniquement
4. **Maximum 4 highlights** — Garder les release notes concises
5. **Ton bienveillant** — Utiliser le vocabulaire Doucement (pas de "fix", "bug", utiliser "amélioration", "correction")
