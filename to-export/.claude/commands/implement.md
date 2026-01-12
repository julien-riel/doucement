# /implement — Implémenter des tâches du projet

Commande autonome pour implémenter les tâches définies dans `tasks.json`.

## Usage

- `/implement` — Prochaine(s) tâche(s) éligibles par priorité
- `/implement 1.1 1.2` — Tâches spécifiques par ID
- `/implement phase phase-1` — Toutes les tâches pending de la phase

$ARGUMENTS

## Mode autonome (OBLIGATOIRE)

**Cette commande est exécutée sans supervision humaine.**

- **NE JAMAIS utiliser `AskUserQuestion`** — Prendre des décisions autonomes
- **NE JAMAIS demander de clarification** — Utiliser le contexte disponible
- **NE JAMAIS attendre de confirmation** — Exécuter directement
- En cas d'ambiguïté, choisir l'option la plus conservatrice/sûre
- En cas d'erreur de validation, tenter de corriger automatiquement (max 3 fois)
- Si une tâche est bloquée, la marquer `blocked` avec une raison et passer à la suivante

## Workflow

### 1. Chargement du contexte

Lire en parallèle :
- `tasks.json` — Liste des tâches et leur statut
- Les fichiers listés dans `files[]` de chaque tâche à implémenter
- `CLAUDE.md` si présent — Instructions du projet

### 2. Sélection des tâches

```typescript
// Logique de sélection
const eligibleTasks = tasks
  .filter(t => t.status === 'pending')
  .filter(t => t.dependsOn.every(depId =>
    getTask(depId).status === 'completed'
  ))
  .sort((a, b) => priorityScore(b) - priorityScore(a))
  .slice(0, estimateBatchSize()) // 1-3 selon complexité
```

**Scores de priorité :**
- `high` = 10
- `medium` = 5
- `low` = 1

**Une tâche est bloquée si :**
- Une dépendance a `status !== 'completed'`
- Marquer comme `blocked` avec raison

### 3. Implémentation par tâche

Pour chaque tâche sélectionnée :

1. **Marquer "in_progress"** dans tasks.json
2. **Lire les fichiers** listés dans `files[]`
3. **Implémenter** le changement demandé
4. **Écrire les tests** si listés dans `tests[]`
5. **Valider** :
   - `npm run format`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
6. **Si erreur** : tenter de corriger (max 3 fois)
7. **Marquer "completed"** avec `completedAt: "YYYY-MM-DD"`

### 4. Auto-correction des erreurs

Si une validation échoue :

```markdown
1. Capturer l'erreur exacte (stdout/stderr)
2. Analyser l'erreur pour identifier la cause
3. Appliquer la correction appropriée
4. Relancer la validation
5. Répéter jusqu'à 3 fois maximum
6. Si échec après 3 tentatives : marquer tâche "blocked"
```

### 5. Mise à jour de tasks.json

Après chaque tâche :

```json
{
  "id": "1.1",
  "status": "completed",
  "completedAt": "2026-01-11"
}
```

Recalculer les stats :
```json
{
  "stats": {
    "totalTasks": 10,
    "completed": 3,
    "inProgress": 0,
    "pending": 6,
    "blocked": 1
  }
}
```

### 6. Vérification des dépendances

Après complétion d'une tâche, vérifier si d'autres tâches sont maintenant éligibles :
- Si `dependsOn` contenait la tâche complétée
- Et toutes les autres dépendances sont complétées
- La tâche passe de "blocked" à "pending"

## Règles de code

### Qualité

- Suivre les conventions du projet existant
- Ajouter des commentaires si la logique est complexe
- Respecter le design system si UI

### Tests

- Écrire les tests listés dans `tests[]`
- Couvrir les cas nominaux et d'erreur
- S'assurer que tous les tests passent

### Sécurité

- Ne pas introduire de vulnérabilités (XSS, injection, etc.)
- Valider les entrées utilisateur
- Ne pas exposer de données sensibles

## Gestion des blocages

Si une tâche ne peut pas être complétée :

```json
{
  "id": "1.1",
  "status": "blocked",
  "blockedReason": "Raison claire et actionnable",
  "blockedAt": "2026-01-11"
}
```

Raisons valides de blocage :
- Dépendance externe non disponible
- Ambiguïté impossible à résoudre
- Conflit avec le code existant
- Erreur de validation persistante après 3 tentatives

## Exemples

```bash
# Implémenter les prochaines tâches éligibles
/implement

# Implémenter des tâches spécifiques
/implement 1.1 1.2 1.3

# Implémenter toute une phase
/implement phase phase-ui
```

## Affichage de fin

Après exécution, afficher :

```
## Résultat de l'implémentation

✅ Tâches complétées: 2
- 1.1 Créer le composant Button
- 1.2 Ajouter les styles CSS

⏳ Tâches restantes: 8
🚫 Tâches bloquées: 0

Prochaine tâche éligible: 1.3 - Intégrer dans l'app
```

## Notes

- Ne jamais modifier le code en dehors des fichiers listés
- Toujours mettre à jour tasks.json après chaque tâche
- Logger les actions importantes pour le debugging
