# Commande /implement — Exécution automatisée des tâches

Cette commande permet de réaliser automatiquement un ensemble de tâches du fichier `tasks.json` en utilisant des sous-agents pour optimiser la fenêtre de contexte.

## Paramètres

- `/implement` — Exécute les prochaines tâches de la phase en cours
- `/implement phase 2` — Exécute les tâches pending de la phase 2
- `/implement 2.1 2.2 2.3` — Exécute les tâches spécifiées
- `/implement --dry-run` — Affiche le plan d'exécution sans rien faire

$ARGUMENTS

---

## Workflow d'exécution

### Phase 0 : Estimation du contexte

Avant de commencer, estime le nombre de tâches qui peuvent rentrer dans la fenêtre de contexte :

1. **Tâches simples** (composants UI, fonctions utilitaires) : 3-5 tâches
2. **Tâches moyennes** (services, hooks, écrans) : 2-3 tâches
3. **Tâches complexes** (logique métier, intégrations) : 1-2 tâches

Si trop de tâches sont demandées, préviens l'utilisateur et propose un sous-ensemble.

---

### Phase 1 : Préparation de la documentation

**Objectif** : S'assurer que toute la documentation nécessaire est lue et résumée.

Lance un **sous-agent Explore** pour résumer la documentation pertinente :

```
Sous-agent: Explore (thorough)
Mission: Résumer la documentation du projet Doucement

Fichiers à analyser:
- docs/prd.md — Exigences produit
- docs/design/design-system-specification.md — Tokens CSS, composants
- docs/comm/banque-messages.md — Textes UX en français
- docs/plan-implementation.md — Détails techniques d'implémentation
- CLAUDE.md — Règles du projet

Retourne un résumé structuré de:
1. Stack technique (React, Vite, TypeScript)
2. Conventions de nommage et structure de fichiers
3. Design tokens à utiliser (couleurs, espacements, rayons)
4. Règles UX (pas de vocabulaire négatif, français inclusif)
5. Patterns de code attendus (hooks, services, composants)
```

Stocke ce résumé pour le transmettre aux sous-agents d'implémentation.

---

### Phase 2 : Lecture et sélection des tâches

1. Lis le fichier `tasks.json`
2. Identifie les tâches à traiter selon les arguments :
   - Sans argument : tâches `pending` de la première phase non complétée
   - Avec phase : tâches `pending` de cette phase
   - Avec IDs : tâches spécifiques demandées
3. Filtre par priorité (`high` d'abord, puis `medium`, puis `low`)
4. Limite au nombre estimé en Phase 0

**Affiche le plan d'exécution :**

```
## Plan d'exécution

Phase : [Nom de la phase]
Tâches sélectionnées : X

1. [ID] [Nom] — [Description courte]
2. [ID] [Nom] — [Description courte]
...

Estimation : [simple/moyen/complexe]
```

Si `--dry-run`, s'arrête ici.

---

### Phase 3 : Exécution des tâches

Pour chaque tâche, utilise des **sous-agents spécialisés** :

#### 3.1 Sous-agent d'implémentation (Task → general-purpose)

```
Sous-agent: general-purpose
Mission: Implémenter la tâche [ID] - [Nom]

Contexte projet (résumé Phase 1):
[Insérer le résumé de documentation]

Tâche à réaliser:
- ID: [id]
- Nom: [name]
- Description: [description]

Fichiers à créer/modifier selon la structure:
src/
├── components/  — Composants React
├── pages/       — Écrans de l'application
├── hooks/       — Custom hooks
├── services/    — Logique métier
├── types/       — Types TypeScript
├── utils/       — Utilitaires
├── styles/      — CSS

Règles importantes:
1. TypeScript strict, pas de `any`
2. Nommage en anglais, commentaires en français si nécessaire
3. Exporter depuis index.ts (barrel exports)
4. Tests dans __tests__/ avec .test.ts(x)
5. CSS : utiliser les design tokens (--primary-500, --spacing-4, etc.)

Retourne:
- Liste des fichiers créés/modifiés
- Résumé des changements
- Points d'attention éventuels
```

#### 3.2 Vérification visuelle avec Playwright MCP

Après chaque tâche UI, lance une vérification :

```
Utilise le serveur MCP Playwright pour:

1. Démarrer le serveur de dev si nécessaire:
   npm run dev

2. Naviguer vers la page concernée:
   - Composants UI → http://localhost:5173/ (page de test si disponible)
   - Écrans → http://localhost:5173/[route]

3. Prendre une capture d'écran:
   playwright screenshot --full-page

4. Vérifier visuellement:
   - Le composant/écran s'affiche correctement
   - Les styles correspondent au design system
   - Pas d'erreurs console

5. Si erreur, retourne le problème pour correction
```

---

### Phase 4 : Validation globale

Une fois toutes les tâches terminées, exécute la validation :

```bash
# 1. Formatage
npm run format 2>/dev/null || npx prettier --write "src/**/*.{ts,tsx,css}"

# 2. Lint
npm run lint 2>/dev/null || npx eslint src --fix

# 3. Type check
npm run typecheck 2>/dev/null || npx tsc --noEmit

# 4. Tests
npm run test 2>/dev/null || npx vitest run
```

**Gestion des erreurs :**

- **Erreur de formatage** : Corrige automatiquement, continue
- **Erreur de lint** : Tente de corriger avec `--fix`, sinon signale
- **Erreur de type** : Retourne au sous-agent pour correction
- **Erreur de test** : Retourne au sous-agent pour correction

Si une erreur persiste après 2 tentatives de correction, marque la tâche comme bloquée et passe à la suivante.

---

### Phase 5 : Mise à jour de tasks.json

Si la validation passe :

1. Pour chaque tâche réussie, mets à jour :
   ```json
   {
     "status": "completed",
     "completedAt": "YYYY-MM-DD"
   }
   ```

2. Recalcule les stats :
   ```json
   {
     "totalTasks": 60,
     "completed": X,
     "inProgress": Y,
     "pending": Z
   }
   ```

3. Si toutes les tâches d'une phase sont complétées :
   ```json
   {
     "status": "completed"
   }
   ```

4. Met à jour `updatedAt` à la date du jour

---

### Phase 6 : Rapport final

Affiche un rapport structuré :

```
## Rapport d'exécution

### Tâches complétées ✓
- [ID] [Nom]
- [ID] [Nom]

### Tâches échouées ✗ (si applicable)
- [ID] [Nom] — Raison: [erreur]

### Fichiers modifiés
- src/components/ui/Button.tsx (créé)
- src/services/storage.ts (modifié)
...

### Validation
- Format: ✓
- Lint: ✓
- Types: ✓
- Tests: ✓ (X passed)

### Progression
Phase [N]: X/Y tâches (Z%)
Global: A/B tâches (C%)

### Prochaine action suggérée
/implement [prochaines tâches]
```

---

## Configuration requise

### Serveur MCP Playwright

Assure-toi que le serveur MCP Playwright est configuré dans `.claude/settings.json` :

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-playwright"]
    }
  }
}
```

### Scripts npm recommandés

Dans `package.json` :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "lint": "eslint src --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

---

## Exemples d'utilisation

```bash
# Exécuter les prochaines tâches high priority
/implement

# Exécuter toute la phase 1
/implement phase 1

# Exécuter des tâches spécifiques
/implement 1.1 1.2 1.3

# Voir le plan sans exécuter
/implement phase 2 --dry-run
```

---

## Optimisation du contexte

Cette commande utilise des sous-agents pour :

1. **Résumé de documentation** — Un agent Explore résume la doc, évitant de charger tous les fichiers
2. **Implémentation isolée** — Chaque tâche est implémentée par un agent dédié avec contexte minimal
3. **Validation externe** — Playwright MCP valide visuellement sans consommer de tokens
4. **Rapport concis** — Seuls les résultats pertinents sont rapportés

Cela permet de traiter 3-5 tâches par session tout en gardant une fenêtre de contexte gérable.
