# PRD — Consolidation post-audit v1.38

## Objectif

Corriger les bugs critiques, renforcer la robustesse des données, améliorer la cohérence de marque et réduire la dette technique identifiés par l'audit pluridisciplinaire de mars 2026.

## Contexte

L'audit v1.38 (voir `docs/bilan-v1.38.md`) a évalué le projet sur 6 axes (code, fonctionnalités, UX, ton, tests, sécurité) avec un score global de 7.6/10. Les faiblesses sont concentrées et corrigeables. Ce PRD structure les 28 actions correctives en 4 phases.

## Principes directeurs

- **Données d'abord** : tout ce qui menace l'intégrité des données utilisateur est P0
- **Cohérence de marque** : les contradictions avec le PRD original (streaks, vocabulaire) sont des bugs produit
- **Pas de régression** : chaque phase passe les tests existants avant release
- **Progressif** : les phases sont indépendantes et releasables séparément

---

## Phase 1 — Corrections critiques

### 1.1 Intégrer les migrations dans `loadData()`

**Problème** : `storage.ts → loadData()` ne lance jamais `runMigrations`. Un utilisateur qui met à jour l'app garde ses données à l'ancienne version de schéma.

**Solution** : Appeler `runMigrations` dans `loadData()` quand `needsMigration(parsed)` est vrai, sauvegarder immédiatement les données migrées.

**Fichiers** : `src/services/storage.ts`, `src/services/storage.test.ts`

### 1.2 Corriger la clé localStorage dans AppProvider

**Problème** : `event.key === 'doucement-data'` (tiret) alors que la clé réelle est `'doucement_data'` (underscore). La synchro multi-onglets ne fonctionne pas.

**Solution** : Importer `STORAGE_KEY` depuis `storage.ts` et l'utiliser.

**Fichiers** : `src/components/AppProvider.tsx`

### 1.3 Corriger les tokens CSS `--success-*`

**Problème** : `var(--success-*)` utilisé dans les CSS timer/stopwatch/counter mais ce token n'existe pas dans `design-tokens.css`. Les états "cible atteinte" sont visuellement cassés.

**Solution** : Remplacer `var(--success-*)` par `var(--secondary-*)` dans les fichiers concernés.

**Fichiers** : `src/components/habits/TimerCheckIn.css`, `StopwatchCheckIn.css`, `CounterButtons.css`

### 1.4 Retirer la carte "Série/Streak" des statistiques

**Problème** : Le PRD §21 interdit explicitement les streaks visibles. La carte "Série" dans les statistiques affiche streak + record.

**Solution** : Retirer la StatCard "Série" de la page Statistics. Conserver le calcul dans `statistics.ts` (utilisé pour le debug) mais ne plus l'exposer dans l'UI.

**Fichiers** : `src/pages/Statistics.tsx`, `src/i18n/locales/fr.json`, `src/i18n/locales/en.json`

### 1.5 Harmoniser tu/vous dans les traductions FR

**Problème** : Le wizard de création vouvoie, les notifications aussi, alors que tout le reste tutoie.

**Solution** : Passer en "tu" partout dans `fr.json` (wizard steps, empty states, stats). Identifier et corriger chaque occurrence.

**Fichiers** : `src/i18n/locales/fr.json`

### 1.6 Passer les notifications dans le système i18n

**Problème** : `notifications.ts` a des messages codés en dur en français avec vouvoiement.

**Solution** : Utiliser les clés i18n existantes ou en créer de nouvelles. Nécessite d'accéder à `i18next` depuis le service (pas un hook React).

**Fichiers** : `src/services/notifications.ts`, `src/i18n/locales/fr.json`, `src/i18n/locales/en.json`

---

## Phase 2 — Robustesse

### 2.1 Protection `beforeunload` quand auto-save échoue

**Solution** : Ajouter un état `hasUnsavedChanges` dans `useAppData`. Quand `saveData` échoue, enregistrer un listener `beforeunload` pour prévenir l'utilisateur.

**Fichiers** : `src/hooks/useAppData.ts`

### 2.2 Limite de taille sur import de fichiers

**Solution** : Vérifier `file.size` avant parsing. Maximum 10 MB. Vérifier aussi `file.type`.

**Fichiers** : `src/services/importExport.ts`

### 2.3 Backup automatique avant import "remplacer"

**Solution** : Avant `importDataReplace`, sauvegarder l'état actuel sous `doucement_data_backup_{timestamp}`. Proposer le téléchargement du backup dans l'UI.

**Fichiers** : `src/services/importExport.ts`, `src/pages/Settings/sections/DataSection.tsx`

### 2.4 Connecter RecalibrationPrompt dans Today

**Problème** : Le composant existe mais n'est jamais rendu. La recalibration après 7j d'absence est détectée mais jamais proposée.

**Solution** : Intégrer `RecalibrationPrompt` dans `Today.tsx` quand `needsRecalibration()` retourne vrai.

**Fichiers** : `src/pages/Today.tsx`

### 2.5 Configurer couverture Vitest avec seuils

**Solution** : Ajouter la configuration `coverage` dans `vitest.config.ts` avec des seuils (80% statements, 75% branches). Ajouter un script npm `test:coverage`.

**Fichiers** : `vitest.config.ts`, `package.json`

### 2.6 Tests unitaires pour `validation.ts`

**Problème** : Module critique (garde-fou des imports) sans aucun test direct.

**Solution** : Créer `src/services/validation.test.ts` couvrant `validateHabit`, `validateEntry`, `validateImportData` avec inputs valides et malformés.

**Fichiers** : `src/services/validation.test.ts`

---

## Phase 3 — Qualité et cohérence

### 3.1 Unifier `daysBetween`

Supprimer l'implémentation dans `progression.ts` et importer celle de `utils/date.ts` partout.

### 3.2 Supprimer le doublon `exportImage`

Garder `imageExport.ts` (le plus complet), supprimer `exportImage.ts`, mettre à jour les imports.

### 3.3 Résoudre coexistence `CreateHabit.tsx` / `CreateHabit/`

Vérifier lequel est actif via le routeur, supprimer l'obsolète.

### 3.4 Corriger accessibilité

- Dots d'onboarding : soit cliquables avec `tabIndex`, soit `aria-hidden`
- Touch target 44px sur bouton dismiss WelcomeBackMessage
- Touch target 44px sur bouton Settings (emoji ⚙️)
- Skip link dans MainLayout

### 3.5 Remplacer emoji fire par sparkles

Remplacer 🔥 par 🌟 ou ✨ dans les projections (section `almostThere`).

### 3.6 Reformuler messages problématiques

- Supprimer "Bien joué. Demain est un autre jour."
- Reformuler `habitNeglected.subtitle` sans connotation accusatrice

### 3.7 Tests unitaires `useCelebrations` et mutations `useAppData`

Créer des tests pour `addHabit`, `updateHabit`, `archiveHabit` dans `useAppData.test.ts`. Créer `useCelebrations.test.ts`.

### 3.8 Lint CSS des tokens (ajout audit)

Script qui vérifie que tous les `var(--*)` dans les CSS sont déclarés dans `design-tokens.css`. Intégrer au health-check.

---

## Phase 4 — Performance et évolution

### 4.1 Indexer les entrées par date

Construire un `Map<string, DailyEntry[]>` au chargement pour éviter les filtres O(n).

### 4.2 Migrer html2canvas vers html-to-image

Remplacer la dépendance abandonnée.

### 4.3 Exposer le mode "fusionner" dans l'UI d'import

Proposer "Remplacer" ou "Fusionner" dans DataSection.

### 4.4 Rendre la revue hebdomadaire visible dans la navigation

Badge ou 4ème item dans la bottom nav.

### 4.5 Type discriminant pour Habit

Remplacer les champs optionnels par un type union discriminé par `trackingMode`.

### 4.6 Stratégie de nettoyage des données anciennes

Nettoyage timer_states >7j, indicateur de taille dans settings.

### 4.7 Debounce sur auto-save

500ms de debounce pour éviter `JSON.stringify` à chaque interaction.

### 4.8 Suite de tests intégrité des données (ajout audit)

Tests dédiés : migration roundtrip v1→v11, import/export roundtrip, validation schéma, résistance aux données corrompues.

---

## Critères de succès

- Phase 1 : tous les tests passent, plus aucun bug critique, cohérence tu/vous vérifiée manuellement
- Phase 2 : couverture >80% sur services, import protégé, recalibration fonctionnelle
- Phase 3 : health-check passe, 0 token CSS non défini, accessibilité améliorée
- Phase 4 : performance mesurée avec 10k+ entrées, dépendances à jour
