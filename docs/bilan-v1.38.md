# Bilan Doucement v1.38 — Mars 2026

> Audit pluridisciplinaire mené par 6 experts : architecte logiciel, product manager, UX designer, directeur de communication, ingénieur sécurité/QA, et architecte de tests.

---

## Vue d'ensemble

| Axe | Score | Verdict |
|-----|-------|---------|
| Qualité du code | **7.5/10** | Solide, dette technique ciblée |
| Fonctionnalités | **8.5/10** | Très complet, quelques écarts avec le PRD |
| Expérience utilisateur | **8.1/10** | Design system exemplaire, a11y à renforcer |
| Culture et ton | **7.8/10** | Philosophie unique, incohérences tu/vous |
| Tests | **6.5/10** | Bons services, composants sous-testés |
| Risques et sécurité | **7/10** | Un bug critique, plusieurs risques long terme |

**Score global estimé : 7.6/10** — Un projet de qualité remarquable pour un side project, avec une philosophie produit rare et cohérente, mais quelques failles structurelles à corriger.

---

## 1. Qualité du code

### Points forts

- **Structure claire** (8/10) : organisation par domaine (`components/`, `pages/`, `services/`, `hooks/`), barrel exports, lazy loading des routes
- **Typage TypeScript** solide : `types/index.ts` bien structuré avec `Omit`, `Partial`, types utilitaires, JSDoc
- **Services purs** : `progression.ts`, `statistics.ts`, `migration.ts` sans dépendance React — testables en isolation
- **Bundle splitting** intelligent dans `vite.config.ts` : `vendor-react`, `vendor-charts`, `vendor-export`, `vendor-i18n`

### Points faibles

| Problème | Fichier(s) | Sévérité |
|----------|-----------|----------|
| **`useAppData` = God Hook** (613 lignes) | `src/hooks/useAppData.ts` | Haute |
| **`daysBetween` implémenté 2 fois** (`Math.round` vs `Math.floor`) | `utils/date.ts` + `services/progression.ts` | Haute |
| **Doublon `exportImage`** | `services/imageExport.ts` + `services/exportImage.ts` | Moyenne |
| **`CreateHabit.tsx` monolithique** coexiste avec `CreateHabit/` refactorisé | `src/pages/` | Moyenne |
| **`Habit` = 25 champs dont 16 optionnels** — pas de type discriminant | `src/types/index.ts` | Moyenne |
| **`cumulativeOperations` sur `Habit`** semble un vestige non nettoyé | `src/types/index.ts` | Basse |
| **Chaînes hardcodées FR** dans `Statistics.tsx` (`PERIOD_LABELS`) | `src/pages/Statistics.tsx` | Basse |

### Métriques performance

- `getEntriesForDate` et `getEntriesForHabit` font un scan linéaire O(n) à chaque render — problématique à long terme (>10k entrées)
- `handleCheckIn` dans `Today.tsx` n'est pas memoïzé (contrairement aux autres handlers)
- Auto-save déclenche `JSON.stringify(data)` complet à chaque interaction

---

## 2. Fonctionnalités

### Tableau de conformité PRD

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Modes de tracking (6 modes) | Implémentée | Tous les 6 modes fonctionnels et bien connectés |
| Progression (increase/decrease/maintain) | Implémentée | Absolu et %, quotidien et hebdomadaire |
| Entry modes (replace/cumulative) | Implémentée | Avec undo sur cumulative |
| Habitudes hebdomadaires | Implémentée | count-days et sum-units |
| Onboarding | Implémentée | 3 slides + suggestions |
| Statistiques et graphiques | Implémentée | ProgressionChart, Heatmap, Comparison, Projection |
| Célébrations/milestones | Implémentée | Seuils 25/50/75/100%, confettis |
| Import/Export JSON | Implémentée | Export + import remplacer + fusionner (service) |
| Export PNG | Implémentée | 3 templates, Web Share API |
| Export PDF | Implémentée | jsPDF + html2canvas |
| PWA (offline, install, shortcuts) | Implémentée | Workbox, 2 shortcuts, guide iOS/Android |
| i18n (fr/en) | Implémentée | react-i18next |
| Gestion des absences | Implémentée | Seuils 2j (message) et 7j (recalibration) |
| Bilan hebdomadaire | Implémentée | Stats, calendrier, patterns, réflexion guidée |
| Archivage/restauration | Implémentée | Avec confirmation |
| Habit stacking | Implémentée | Ancrage, chaînes, groupage visuel |
| Déclaration d'identité | Implémentée | Wizard + affichage dans détail et revue |
| Implementation intentions | Implémentée | Quand/où/condition |
| Effet composé | Implémentée | "D'où je viens", comparaison Jour 1 → Aujourd'hui |
| Premier check-in (Day One) | Implémentée | StepFirstCheckIn dans wizard |
| Nouveau départ (restart) | Implémentée | RestartSection + RestartTimeline |
| Pauses planifiées | Implémentée | Dialog, badge "En pause", bouton "Reprendre" |
| Messages adaptatifs | Implémentée | Contexte : premier jour / retour / proche objectif |
| Quick Check-in | Implémentée | Mode simple uniquement (limitation connue) |
| Notifications locales | Implémentée | Matin, soir, revue hebdo |

### Écarts critiques avec le PRD

| Écart | Sévérité | Détail |
|-------|----------|--------|
| **Streak visible dans les statistiques** | **Critique** | La carte "Série" affiche streak + record. Le PRD §21 interdit explicitement les streaks visibles. |
| **RecalibrationPrompt non connecté** | Haute | Le composant existe et fonctionne, mais n'est jamais rendu dans les pages (Today, HabitDetail). La recalibration après 7j d'absence est détectée mais jamais proposée. |
| **Mode fusionner non exposé dans l'UI** | Moyenne | `importDataMerge` est implémenté dans le service mais l'UI ne propose que "remplacer". |
| **App Badge PWA non implémenté** | Basse | PRD §19 mentionne `navigator.setAppBadge()`, aucune trace dans le code. |

---

## 3. Expérience utilisateur

### Design System (9/10)

Le design system est le point le plus fort du projet :
- Tokens CSS complets et cohérents avec la spec (`design-tokens.css`)
- Dark mode avec palette recalculée (pas une simple inversion)
- `prefers-reduced-motion` respecté systématiquement
- Composant `Button` avec 44px min touch target

**Bug critique** : `var(--success-*)` utilisé dans `TimerCheckIn.css`, `StopwatchCheckIn.css`, `CounterButtons.css` — ce token n'existe pas dans `design-tokens.css`. Les états "cible atteinte" sont visuellement cassés sur les modes timer/stopwatch/counter.

### Micro-interactions (8.5/10)

- `CelebrationModal` : animation bounce, confettis 50 particules, emoji animé, barre de progression avec glow
- `WelcomeBackMessage` : animation wave sur l'emoji — geste humain sur interface numérique
- Cartes d'habitude : `fadeInUp` progressif, états visuels codés couleur

**Manque** : pas de pulse visuel quand le chrono tourne (stopwatch/timer), pas de transition entre les étapes du wizard de création.

### Accessibilité (7/10)

| Bien | À corriger |
|------|-----------|
| Focus `:focus-visible` avec outline orange | Dots d'onboarding : `role="tab"` mais non cliquables |
| `prefers-reduced-motion` partout | Bouton dismiss `WelcomeBackMessage` : 28x28px (min: 44px) |
| `role="progressbar"` sur DailyHeader | Bouton Settings (emoji ⚙️) : zone de touche non garantie |
| `CelebrationModal` : dialog, focus trap, Escape | Pas de skip link pour navigation clavier |
| `SliderCheckIn` : ARIA complet | `EmptyState` vouvoie ("Créez") alors que tout tutoie |

### Architecture d'information (7.5/10)

- Navigation à 3 onglets : minimaliste et anti-anxiogène
- Quick check-in sans nav : excellent pour shortcut PWA
- **La revue hebdomadaire est invisible** dans la navigation principale
- Pas de breadcrumb ni bouton retour explicite sur les pages secondaires

---

## 4. Culture et ton

### L'identité "Doucement" (8.5/10)

Le nom est une réussite stratégique. La philosophie se manifeste dans l'architecture technique (pas de backend = pas de surveillance) et dans chaque message. Points de différenciation uniques :

- **Anti-gamification assumée** — aucun concurrent ne le revendique aussi clairement
- **"Dose du jour"** — concept sémantique original qui désacralise l'objectif
- **Effort partiel = succès** — encodé dans le code, pas juste dans le marketing
- **Recalibration bienveillante** — "On recalibre ensemble ?" au lieu de "18 jours sans activité"

### Banque de messages (7.5/10)

**Réussites** :
- Messages de check-in partiel : *"Pas 100%, mais tu n'as pas abandonné."*
- Messages decrease à zéro : *"Tu n'as pas cédé."*, *"Victoire totale."*
- Messages de retour : *"Content·e de te revoir."*, *"Te revoilà. Pas de pression."*

**Problèmes** :
- *"Bien joué. Demain est un autre jour."* — connotation de report, comme si aujourd'hui n'avait pas compté
- `habitNeglected.subtitle` : *"Tu n'as pas enregistré cette habitude hier."* — culpabilisation passive

### Incohérences critiques

| Problème | Impact | Localisation |
|----------|--------|-------------|
| **Tu/vous mélangés** | L'utilisateur passe du tu au vous dans le wizard de création | `fr.json` lignes 110-122, 832, 931 |
| **Notifications hors i18n** | Vouvoiement codé en dur, non traduisible | `src/services/notifications.ts` lignes 57-70 |
| **Emoji 🔥** dans les projections | Symbole de streak/performance, contraire à l'esthétique organique | `fr.json` section `projections.almostThere` |
| **"Streak"/"Série"** affiché | Contradiction directe avec PRD §21 | `Statistics.tsx`, `statistics.ts` |
| **"Objectif"** utilisé massivement | La banque de messages classe "objectif" comme mot à éviter | `fr.json` multiples occurrences |

### Écriture inclusive (7/10)

Le point médian est utilisé correctement (*fier·e*, *Content·e*, *revenu·e*, *Stressé·e*) mais pas systématiquement sur tous les adjectifs/participes passés adressés à l'utilisateur.

---

## 5. Tests

### Couverture

- **23 fichiers de tests unitaires** (Vitest)
- **31 fichiers de tests E2E** (Playwright)
- **Aucun seuil de couverture configuré** — l'objectif 80% du CLAUDE.md n'est pas vérifiable

### Points forts

- `progression.test.ts` (1191 lignes) — exemplaire, tous les cas métier
- `CheckInButtons.test.tsx` — teste les contraintes produit (mots interdits encodés comme assertions)
- Fixtures E2E complètes avec factories pour tous les types d'habitudes
- Page Objects bien structurés

### Zones critiques non testées

| Module | Criticité | Tests |
|--------|-----------|-------|
| `validation.ts` (garde-fou des imports) | **Critique** | Aucun test unitaire direct |
| `useCelebrations` (orchestration milestones) | **Haute** | Aucun test |
| `ErrorBoundary.tsx` | **Haute** | Aucun test |
| `useAppData` mutations (`addHabit`, `updateHabit`) | **Haute** | Non couvertes |
| Migrations v9→v10→v11 | **Haute** | Non vérifiées dans `migration.test.ts` |
| `versioning.ts` | Moyenne | Aucun test |
| `exportPdf.ts` | Moyenne | Aucun test |

### Problèmes de qualité

- Assertions E2E trop vagues : `expect(completion).toBeGreaterThanOrEqual(0)` — toujours vrai
- `createEntriesForDays` utilise `Math.random()` — flakiness potentielle
- Tests E2E de weekly-review avec dates hardcodées (janvier 2026)

---

## 6. Risques et sécurité

### Risques classés par priorité

#### P0 — Critique (corriger immédiatement)

| Risque | Description |
|--------|-------------|
| **Migrations non appliquées au chargement** | `storage.ts → loadData()` ne lance jamais `runMigrations`. Un utilisateur qui met à jour l'app garde ses données à l'ancienne version de schéma indéfiniment. Seul l'import de fichier déclenche les migrations. |

#### P1 — Majeur (corriger prochain sprint)

| Risque | Description |
|--------|-------------|
| **Bug clé localStorage dans AppProvider** | `event.key === 'doucement-data'` (tiret) alors que la clé réelle est `'doucement_data'` (underscore). La synchro multi-onglets ne fonctionne pas. |
| **Auto-save sans protection** | Si `saveData` échoue et l'utilisateur ferme l'onglet, les données de la session sont perdues. Pas de `beforeunload`. |
| **Pas de backup avant import/migration** | L'import "remplacer" écrase atomiquement sans possibilité de retour. |
| **Pas de limite de taille sur import** | Un fichier de 1 Go peut freeze/crash l'onglet. |
| **Couverture de tests non configurée** | Impossible de vérifier l'objectif 80%. |

#### P2 — Important (backlog priorisé)

| Risque | Description |
|--------|-------------|
| **Performance O(n) sur les entrées** | `getEntriesForDate/ForHabit` = scan linéaire. Problématique >10k entrées (~1 an d'usage intensif). |
| **html2canvas abandonné** | Dernière release 2022, vulnérabilités non corrigées, milliers d'issues ouvertes. |
| **Notifications SW en mémoire volatile** | `scheduledNotifications = new Map()` perdu quand le Service Worker s'arrête. |
| **`restartHabit` double sauvegarde** | `saveData()` manuel + auto-save `useEffect` = race condition potentielle. |
| **Path de migration incomplet non détecté** | Si une migration manque dans la chaîne, le code s'arrête silencieusement et retourne "succès". |

#### P3 — Mineur

- `timerStorage` avale les erreurs silencieusement
- `lint --fix` par défaut dans `package.json`
- Pas de CI/CD visible
- Pas de polyfill ni message d'erreur pour navigateurs non supportés

---

## 7. Forces distinctives

Ce qui rend Doucement unique et devrait être préservé/renforcé :

1. **Philosophie produit rare et cohérente** — l'anti-gamification n'est pas un gadget marketing mais une conviction architecturale (pas de backend = pas de surveillance, 70% = victoire, pas de vocabulaire d'échec)

2. **"Dose du jour" comme concept central** — trouvaille sémantique qui désacralise l'objectif. Aucun concurrent n'utilise ce cadrage.

3. **6 modes de tracking** — couverture remarquable des cas d'usage (simple, detailed, counter, stopwatch, timer, slider) tout en restant cohérent visuellement

4. **Design system "Soft Organic"** — chaleureux, pas de rouge, tokens complets, dark mode soigné

5. **Banque de messages** — le `_daysSinceLastActivity` intentionnellement non affiché dans `WelcomeBackMessage` est un pattern architectural élégant

6. **Privacy by architecture** — pas juste une promesse, c'est structurel (100% localStorage, zéro analytics)

---

## 8. Plan d'action proposé

### Phase 1 — Corrections critiques (1-2 semaines)

**Objectif** : corriger les bugs et contradictions qui menacent l'intégrité des données et la cohérence de la marque.

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Intégrer `runMigrations` dans `storage.ts → loadData()` | S | Critique — données utilisateur |
| 2 | Corriger la clé localStorage dans `AppProvider.tsx` (`'doucement-data'` → `STORAGE_KEY`) | XS | Bug multi-onglets |
| 3 | Remplacer `var(--success-*)` par `var(--secondary-*)` dans les CSS timer/stopwatch/counter | XS | Visuel cassé |
| 4 | Retirer ou masquer la carte "Série/Streak" des statistiques | S | Violation PRD §21 |
| 5 | Harmoniser tu/vous dans `fr.json` (wizard + empty states + stats) | S | Cohérence de marque |
| 6 | Passer les notifications dans le système i18n | M | Traductibilité |

### Phase 2 — Robustesse (2-3 semaines)

**Objectif** : renforcer la fiabilité et la confiance des données.

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 7 | Ajouter `beforeunload` quand auto-save échoue | S | Protection perte de données |
| 8 | Limite de taille sur import de fichiers (10 MB max) | XS | Sécurité |
| 9 | Backup automatique avant import "remplacer" | S | Réversibilité |
| 10 | Connecter `RecalibrationPrompt` dans `Today.tsx` | M | Fonctionnalité dormante |
| 11 | Configurer couverture Vitest avec seuils | S | Qualité tests |
| 12 | Tests unitaires pour `validation.ts` | M | Module critique sans tests |

### Phase 3 — Qualité et cohérence (3-4 semaines)

**Objectif** : polir l'expérience et réduire la dette technique.

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 13 | Unifier `daysBetween` (supprimer le doublon) | XS | Bug DST potentiel |
| 14 | Supprimer le doublon `exportImage` | S | Dette technique |
| 15 | Résoudre coexistence `CreateHabit.tsx` / `CreateHabit/` | M | Confusion codebase |
| 16 | Corriger accessibilité : dots onboarding, touch targets, skip link | M | a11y |
| 17 | Remplacer emoji 🔥 par 🌟/✨ dans projections | XS | Cohérence de marque |
| 18 | Reformuler messages problématiques ("Demain est un autre jour", `habitNeglected`) | S | Bienveillance |
| 19 | Tests unitaires `useCelebrations` et mutations `useAppData` | M | Couverture |

### Phase 4 — Performance et évolution (backlog)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 20 | Indexer les entrées par date (`Map<string, DailyEntry[]>`) | M | Performance long terme |
| 21 | Migrer `html2canvas` vers `html-to-image` | M | Dépendance abandonnée |
| 22 | Exposer le mode "fusionner" dans l'UI d'import | M | Fonctionnalité cachée |
| 23 | Rendre la revue hebdomadaire visible dans la navigation | S | Découvrabilité |
| 24 | Type discriminant pour `Habit` (union par `trackingMode`) | L | Sécurité du typage |
| 25 | Stratégie de nettoyage des données anciennes | M | Scalabilité localStorage |
| 26 | Débounce sur auto-save (500ms) | S | Performance |

---

## Conclusion

Doucement est un projet d'une qualité remarquable. Sa philosophie produit — bienveillance sans compromis, privacy by design, anti-gamification — est rare et sincèrement implémentée dans le code. Le design system est solide, les fonctionnalités couvrent un spectre large, et la banque de messages est une pièce maîtresse.

Les faiblesses sont concentrées et corrigeables : un bug critique de migration, quelques incohérences de ton, des zones de tests à renforcer, et une dette technique ciblée. Rien qui ne remette en cause les fondations.

La priorité absolue est la **Phase 1** : corriger ce qui peut casser les données utilisateur et ce qui contredit la promesse de marque. Le reste peut être traité progressivement — *doucement*.
