# PRD — Consolidation v3 : Bilan Mars 2026

## Objectif

Consolider Doucement sur tous les axes identifiés par l'audit pluridisciplinaire de mars 2026 : qualité du code, internationalisation, UX, sécurité, marque et résilience des données. Préparer le terrain pour les évolutions futures.

## Contexte

Le bilan `docs/bilan-mars-2026.md` (note globale 7.8/10) a identifié :
- **i18n cassé** sur 4 pages/composants (Statistics, WeeklyReview, QuickCheckIn, patternAnalysis)
- **Architecture fragile** : double source de vérité `AppProvider`/`useAppData`
- **Sécurité minimale** : pas de CSP, mode debug exposé par URL
- **Marque incohérente** : "objectif" utilisé 14 fois (charte dit "dose"), release notes techniques, traduction EN littérale
- **UX incomplete** : animations manquantes, dark mode EmojiPicker cassé, HeatmapCalendar non tactile

## Use cases prioritaires

### UC1 — Utilisateur anglophone
Un utilisateur configure l'app en anglais. Il doit pouvoir naviguer sur **toutes** les pages sans voir un mot de français. Actuellement, Statistics, WeeklyReview et QuickCheckIn sont en français hardcodé.

### UC2 — Utilisateur de longue date
Un utilisateur avec 6+ mois de données doit pouvoir :
- Recevoir un rappel mensuel d'export (protection contre la perte de données localStorage)
- Importer/exporter sans risque de perte silencieuse
- Voir des release notes compréhensibles (pas du jargon technique)

### UC3 — Contributeur
Un développeur qui ajoute une feature doit être alerté automatiquement si des clés i18n manquent entre FR et EN, via un script CI.

### UC4 — Modes de tracking cohérents
QuickCheckIn doit respecter le `trackingMode` de chaque habitude (actuellement tout est `SimpleCheckIn`). Le SliderCheckIn doit synchroniser son état avec `currentValue`.

## Architecture technique

### Gestion d'état — Refonte
- Créer un `AppDataContext` React global qui centralise le chargement, la persistance et les mutations
- Supprimer le polling 30s dans `AppProvider` (les `StorageEvent` suffisent pour la synchro cross-tab)
- Exposer un unique hook `useAppData()` qui consomme le Context
- Le debounce auto-save reste à 500ms

### Sécurité
- Ajouter une meta CSP dans `index.html`
- Désactiver `?debug=true` en production (`import.meta.env.PROD`)
- Vérifier le retour de `createBackupBeforeImport()` avant de continuer l'import
- Réduire `MAX_IMPORT_FILE_SIZE` de 10 MB à 2 MB

### i18n
- Migrer toutes les chaînes hardcodées vers `t()` avec les clés correspondantes
- Ajouter les clés manquantes dans `en.json`
- Créer un script `scripts/check-i18n.sh` qui compare les clés FR/EN

### Polices
- Installer `@fontsource/fraunces` et `@fontsource-variable/source-sans-3`
- Supprimer les `<link>` Google Fonts de `index.html`
- Importer les polices dans `src/styles/index.css`

## Structures de données

### Modification : Habit
```typescript
// Aucune modification de type nécessaire pour cette consolidation
// Le champ updatedAt est identifié comme souhaitable mais reporté (breaking change schéma v13)
```

### Nouveau : Préférences export
```typescript
interface UserPreferences {
  // ... existant ...
  lastExportReminder?: string | null  // Date ISO du dernier rappel
}
```

## Contraintes design

- Respecter le design system `docs/design/design-system-specification.md`
- Jamais de rouge, jamais de vocabulaire d'échec
- Touch targets minimum 44x44px
- Dark mode : toutes les valeurs doivent passer par les tokens CSS

## Critères de succès

1. `npm run typecheck` passe sans erreur
2. `npm run lint` passe sans warning
3. `npm test` — tous les tests unitaires passent
4. `npm run test:e2e` — tous les tests E2E passent
5. Un utilisateur EN peut naviguer sur 100% des pages sans français
6. Le script `check-i18n.sh` ne détecte aucune clé manquante
7. Le health check passe au vert
