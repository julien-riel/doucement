# Bilan Stratégique — Doucement v1.41.0
**Mars 2026**

> Audit réalisé par un panel de 5 experts : Lead Developer, Product Manager, UX Designer, Brand Strategist, Security Engineer.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Qualité du code](#2-qualité-du-code)
3. [Fonctionnalités & Produit](#3-fonctionnalités--produit)
4. [Expérience utilisateur](#4-expérience-utilisateur)
5. [Culture, ton & image de marque](#5-culture-ton--image-de-marque)
6. [Sécurité & risques](#6-sécurité--risques)
7. [Faiblesses transversales](#7-faiblesses-transversales)
8. [Améliorations prioritaires](#8-améliorations-prioritaires)
9. [Plan proposé](#9-plan-proposé)

---

## 1. Vue d'ensemble

| Axe | Note | Verdict |
|-----|------|---------|
| Architecture & Code | **7.8/10** | Solide, quelques God Objects à refactorer |
| Fonctionnalités | **8/10** | PRD bien couvert, quelques gaps i18n critiques |
| UX/UI & Design System | **7.5/10** | Cohérent avec la spec, lacunes d'accessibilité localisées |
| Marque & Communication | **8.5/10** | Identité forte et unique, failles terminologiques |
| Sécurité | **7/10** | Aucun risque critique, mais CSP absente et données volatiles |
| **Global** | **7.8/10** | **Projet mature, prêt pour une phase de consolidation** |

**Verdict général** : Doucement est un projet remarquablement cohérent pour une SPA solo. La philosophie "sans culpabilité" irrigue le code, le design et la communication avec une rare sincérité. Les faiblesses sont concentrées sur l'internationalisation incomplète, la gestion d'état React et la résilience des données.

---

## 2. Qualité du code

### Points forts

- **Architecture exemplaire** : séparation services/hooks/composants/types stricte. Les services (`progression.ts`, `statistics.ts`, `migration.ts`) sont des fonctions pures sans dépendance React — testables et réutilisables.
- **TypeScript de haut niveau** : union discriminée sur `trackingMode`, `strict: true`, zéro `any` dans le code applicatif, types utilitaires bien utilisés (`Omit<>`, `Partial<>`).
- **Migration de schéma mature** : 12 versions gérées en chaîne avec registre déclaratif. Architecture inspirée des migrations de base de données.
- **Tests E2E solides** : 40+ specs Playwright avec Page Objects, factories centralisées, tests mobile (Pixel 5) et desktop.

### Points faibles

| Problème | Sévérité | Fichier(s) |
|----------|----------|------------|
| `useAppData` est un God Hook (663 lignes, CRUD + persistance + erreurs) | Haute | `src/hooks/useAppData.ts` |
| Double source de vérité `AppProvider` / `useAppData` (polling 30s + debounce 500ms non coordonnés) | Haute | `src/components/AppProvider.tsx`, `src/hooks/useAppData.ts` |
| `useStopwatch` et `useTimer` sont des doublons à ~80% | Moyenne | `src/hooks/useStopwatch.ts`, `src/hooks/useTimer.ts` |
| Aucun `React.memo` sur aucun composant (re-renders inutiles sur listes) | Moyenne | Tous les composants |
| `addDays` dupliqué dans `utils/date.ts` et `services/statistics.ts` | Faible | 2 fichiers |
| Pas de path aliases TypeScript (`../../components/ui/...`) | Faible | Config Vite/TS |
| ESLint sans `react-hooks/exhaustive-deps` (bugs de hooks non détectés) | Moyenne | `eslint.config.js` |
| Tests manquants pour `migration.ts` (composant critique) | Moyenne | — |
| Pas de pipeline CI (`.github/workflows/`) | Faible | — |

---

## 3. Fonctionnalités & Produit

### Couverture PRD : ~90%

La majorité des features du PRD sont implémentées avec rigueur : dose du jour, progression composée, 6 modes de tracking, revue hebdomadaire, recalibration, pause planifiée, milestones, habit stacking, implementation intentions, export PNG, PWA.

### Différenciateurs uniques

1. **Progression composée automatique** (+3%/semaine avec arrondi bienveillant) — aucun concurrent ne l'implémente
2. **Recalibration après absence** — reprise à 50/75/100% sans jugement, unique dans l'espace
3. **6 modes de tracking contextuels** — slider pour l'humeur, stopwatch pour la méditation, counter pour les cigarettes
4. **Absence totale de streaks visibles** — décision produit anti-conventionnelle et cohérente
5. **Zéro cloud, zéro compte** — privacy radicale

### Gaps critiques identifiés

| Feature manquante | Impact | Effort estimé |
|-------------------|--------|---------------|
| **i18n absent sur Statistics.tsx** — page entière en français hardcodé | Bloquant pour l'anglais | Moyen |
| **i18n absent sur WeeklyReview.tsx** — idem | Bloquant pour l'anglais | Moyen |
| **i18n absent sur QuickCheckIn.tsx** | Bloquant pour l'anglais | Faible |
| **QuickCheckIn ignore le trackingMode** — n'affiche que SimpleCheckIn | Bug fonctionnel | Moyen |
| **SliderCheckIn : état non synchronisé** — `useState(initialValue)` ne suit pas `currentValue` | Bug fonctionnel | Faible |
| **patternAnalysis.ts : jours hardcodés en français** (`'dimanche'`, `'lundi'`...) | Bug i18n | Faible |
| **App Badge** (`navigator.setAppBadge()`) — prévu au PRD §19 | Feature manquante | Faible |
| **Pas de `updatedAt` sur Habit** — merge intelligent impossible | Limite technique | Moyen |
| **Streaks calculés mais non affichés** — risque d'exposition accidentelle (anti-PRD §21) | Risque philosophique | Faible |

### Opportunités produit

- **Suggestions d'ajustement dans la WeeklyReview** : si l'utilisateur est à 120%+ depuis 3 semaines, proposer d'augmenter le taux de progression
- **Résumé annuel exportable** : capitaliser sur l'infrastructure d'export PNG existante
- **Aide contextuelle in-app** : le guide utilisateur est excellent mais inaccessible depuis l'app

---

## 4. Expérience utilisateur

### Conformité Design System : ~85%

Le design system "Soft Organic" est bien implémenté. Les tokens CSS sont fidèles à la spec (orange #F27D16, vert #22C55E, neutres chauds, jamais de gris pur). **Aucun rouge n'est utilisé dans toute l'app** — le principe "no red" est parfaitement respecté.

### Points forts UX

- **Dark mode complet** : tokens inversés intelligemment, couleurs primaires ajustées pour le contraste
- **Touch targets** : `--touch-target-min: 44px` systématiquement appliqué
- **Safe area** : `env(safe-area-inset-bottom)` pour les iPhones avec notch
- **Micro-interactions** : célébrations en confetti CSS pur, pulse sur le chrono, bounce sur les emojis
- **Accessibilité de base** : skip link, ARIA labels sur progressbar/slider/radiogroup, `focus-visible` global

### Lacunes UX

| Problème | Priorité | Fichier(s) |
|----------|----------|------------|
| **HeatmapCalendar : cellules 14x14px** — inutilisables au doigt | Haute | `HeatmapCalendar.css` |
| **CounterPulse animation jamais déclenchée** — feedback visuel absent sur +1/-1 | Haute | `CounterButtons.tsx/css` |
| **EmojiPicker en dark mode** — fond blanc hardcodé (#ffffff) | Haute | `EmojiPicker.css` |
| **Stagger animation manquante** — toutes les cartes apparaissent simultanément (spec : décalage 80-100ms) | Moyenne | `HabitCard.css` |
| **Card padding 16px au lieu de 20px** (spec) | Faible | `Card.css` |
| **Focus trap incomplet** dans CelebrationModal | Moyenne | `CelebrationModal.tsx` |
| **WelcomeBackMessage : rgba(0,0,0)** non adapté au dark mode | Faible | `WelcomeBackMessage.css` |
| **SliderCheckIn : animation emojiPop** ne se déclenche pas dynamiquement | Faible | `SliderCheckIn.css` |
| Settings accessible uniquement depuis Today (pas depuis Statistics/Habits) | Faible | Navigation |

---

## 5. Culture, ton & image de marque

### Identité : forte et authentique

Le nom "Doucement" est un choix remarquable — un adverbe français non traduisible qui encode directement la philosophie du produit. Le positionnement "Atomic Habits sans culpabilité" est clair et différenciant. Aucun concurrent ne traite le sujet avec cette profondeur philosophique.

La phrase la plus forte de l'app : *"La vie a pris le dessus. Ce n'est pas un problème."* — elle résume à elle seule l'identité de la marque.

### Vocabulaire : 95% cohérent

Le vocabulaire interdit (échec, raté, manqué) est quasi-absent. Les alternatives sont bien choisies : "archiver" au lieu de "supprimer", "dose du jour" au lieu de "objectif", les messages d'absence sont bienveillants.

### Tensions identifiées

| Tension | Occurrences | Recommandation |
|---------|-------------|----------------|
| **"objectif" utilisé 14 fois** alors que la charte dit "dose du jour" | fr.json : lignes 893, 1032, 794, 965... | Remplacer par "cible" ou "destination" |
| **"Valider" au lieu de "Enregistrer"** | fr.json : common.validate | Remplacer |
| **"Import échoué"** — seule occurrence du mot "échoué" | fr.json : ligne 505 | "Import non abouti" |
| **"Zone sensible"** — ton alarmiste brusque | fr.json : ligne 475 | Reformuler sans "irréversible" |

### Traduction anglaise : littérale, non adaptée

La version anglaise est une traduction mot-à-mot, pas une adaptation culturelle. Exemples problématiques :
- "Nickel. À demain." → "Nice. See you tomorrow." — "Nice" est vide/condescendant en anglais → "Done. See you tomorrow."
- "Et alors ? On continue." → "So what? Let's keep going." — agressif en anglais → "That's okay. Let's keep going."
- "dose" a une connotation pharmaceutique plus forte en anglais qu'en français

### WhatsNew : rupture de contrat émotionnel

Les release notes affichées aux utilisateurs contiennent du jargon technique ("Debounce sur auto-save", "Index des entrées par date"). Après 5 écrans de bienveillance, cette modale brise l'expérience de confiance. De plus, elle n'est pas internationalisée ("Quoi de neuf ?" et "C'est parti !" en dur en français).

### Signature de marque manquante

Il manque une phrase-slogan mémorable. Candidates : *"La constance, pas la perfection"* (déjà dans les messages) ou *"Le chemin, pas la destination"*.

---

## 6. Sécurité & risques

### Aucun risque critique identifié

L'architecture 100% front-end élimine les risques serveur (SQL injection, SSRF, auth). Aucune vulnérabilité XSS détectée (zéro injection HTML non sécurisée, zéro `eval`, React échappe automatiquement). La promesse "zéro tracking" est vérifiée (seuls appels externes : Google Fonts).

### Risques élevés

| Risque | Impact | Mitigation actuelle |
|--------|--------|---------------------|
| **Absence de CSP** (Content Security Policy) | Si une XSS future était introduite, impact maximal | Aucune |
| **Perte de données irréversible** (vidage cache, navigation privée, import échoué) | Perte totale possible | Export manuel + avertissement UI |

### Risques moyens

| Risque | Impact | Fichier |
|--------|--------|---------|
| **Mode debug activable par URL** (`?debug=true`) expose toutes les données via `window.__DOUCEMENT_DEBUG__` | Accès données par extensions/scripts | `useDebugMode.ts` |
| **Import 10 MB** peut geler le thread UI | Freeze de l'app | `importExport.ts` |
| **Backup avant import** : résultat ignoré, peut échouer silencieusement | Perte de données | `importExport.ts` |
| **Google Fonts** : IP transmise à Google à la première visite | Contradiction privacy-first | `index.html` |
| **Headers HTTP manquants** : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | — | Config hébergement |

### Posture recommandée

Pour une SPA sans données sensibles, la posture de sécurité est **acceptable**. Les priorités sont : ajouter une CSP minimale, désactiver le mode debug par URL en production, réduire la limite d'import à 1-2 MB, et self-hoster les polices.

---

## 7. Faiblesses transversales

Ces problèmes traversent plusieurs axes de l'audit :

### 1. Internationalisation incomplète (impacte Produit + UX + Marque)

**4 pages/composants entiers** ne sont pas internationalisés : Statistics, WeeklyReview, QuickCheckIn, patternAnalysis. Un utilisateur anglophone voit un mélange français/anglais. C'est le problème transversal le plus urgent.

### 2. Gestion d'état fragmentée (impacte Code + Performances + Risques)

`AppProvider` et `useAppData` sont deux systèmes indépendants qui lisent/écrivent dans le même localStorage avec des mécanismes différents (polling 30s vs debounce 500ms vs StorageEvent). Risque de race conditions et de re-renders inutiles.

### 3. Résilience des données insuffisante (impacte Sécurité + Produit + UX)

localStorage est volatile. Le backup avant import peut échouer silencieusement. Le debounce peut perdre 500ms de données sur iOS. Pas de backup automatique, pas d'export périodique suggéré.

### 4. Release notes techniques exposées aux utilisateurs (impacte Marque + UX)

Le canal "Quoi de neuf ?" mélange notes développeur et notes utilisateur, avec des strings non internationalisées.

---

## 8. Améliorations prioritaires

### Priorité 1 — Bugs et incohérences (Sprint immédiat)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1.1 | Internationaliser Statistics.tsx | 1j | Critique — page cassée en EN |
| 1.2 | Internationaliser WeeklyReview.tsx | 1j | Critique — page cassée en EN |
| 1.3 | Internationaliser QuickCheckIn.tsx + patternAnalysis.ts | 0.5j | Cassé en EN |
| 1.4 | Corriger QuickCheckIn : respecter le trackingMode | 0.5j | Bug fonctionnel |
| 1.5 | Corriger SliderCheckIn : synchroniser l'état | 0.5j | Bug fonctionnel |
| 1.6 | Remplacer les 14 occurrences de "objectif" par "dose"/"cible" | 0.5j | Cohérence marque |

### Priorité 2 — Consolidation technique (2-3 semaines)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 2.1 | Unifier la gestion d'état (Context React global, supprimer le polling 30s) | 3j | Architecture |
| 2.2 | Ajouter `eslint-plugin-react-hooks` | 0.5j | Qualité |
| 2.3 | Extraire `useChronometer` de useStopwatch/useTimer | 1j | Maintenabilité |
| 2.4 | Ajouter CSP minimale dans index.html | 0.5j | Sécurité |
| 2.5 | Désactiver le mode debug par URL en production | 0.5j | Sécurité |
| 2.6 | Réduire la limite d'import à 2 MB + vérifier le retour du backup | 0.5j | Sécurité |
| 2.7 | Écrire les tests de migration.ts | 1j | Fiabilité |
| 2.8 | Self-hoster les polices (Fraunces + Source Sans 3) | 0.5j | Privacy |

### Priorité 3 — Expérience & Marque (4-6 semaines)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 3.1 | Réécrire les release notes en langage utilisateur | 1j | Image de marque |
| 3.2 | Internationaliser WhatsNewModal.tsx | 0.5j | Cohérence |
| 3.3 | Adapter culturellement la traduction anglaise (15-20 messages clés) | 1j | Qualité perçue |
| 3.4 | Corriger le dark mode de l'EmojiPicker | 0.5j | UX |
| 3.5 | Activer l'animation counterPulse dans CounterButtons | 0.5j | Feedback tactile |
| 3.6 | Ajouter le stagger animation sur les HabitCards | 0.5j | Polish |
| 3.7 | Rendre le guide utilisateur accessible depuis les Settings | 1j | Onboarding |
| 3.8 | Ajouter React.memo sur HabitCard et composants de liste | 0.5j | Performance |

### Priorité 4 — Évolutions futures

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 4.1 | Ajouter App Badge (`navigator.setAppBadge()`) | 0.5j | Engagement |
| 4.2 | Suggestions d'ajustement de progression dans WeeklyReview | 2j | Différenciation |
| 4.3 | Résumé annuel exportable | 2j | Rétention |
| 4.4 | Prévisualisation avant import (aperçu des données) | 1j | Confiance |
| 4.5 | Rappel d'export périodique (mensuel) | 1j | Résilience données |
| 4.6 | Path aliases TypeScript (`@/components`, `@/services`) | 0.5j | DX |
| 4.7 | Pipeline CI (GitHub Actions) | 1j | Qualité |

---

## 9. Plan proposé

### Phase 1 — "Cohérence" (Semaine 1-2)

> Objectif : Toutes les pages fonctionnent correctement en anglais. Les bugs connus sont corrigés.

- [ ] i18n de Statistics.tsx, WeeklyReview.tsx, QuickCheckIn.tsx, patternAnalysis.ts
- [ ] Correction QuickCheckIn (trackingMode)
- [ ] Correction SliderCheckIn (état synchronisé)
- [ ] Remplacement "objectif" → "dose"/"cible" dans fr.json
- [ ] Internationalisation WhatsNewModal.tsx
- [ ] Release notes réécrites en langage utilisateur

**Critère de succès** : un utilisateur anglophone peut utiliser 100% de l'app sans voir un mot de français.

### Phase 2 — "Solidité" (Semaine 3-5)

> Objectif : L'architecture technique est consolidée. La sécurité est renforcée.

- [ ] Unification gestion d'état (Context React global)
- [ ] ESLint react-hooks + correction des dépendances de hooks
- [ ] Extraction `useChronometer`
- [ ] CSP minimale + headers de sécurité
- [ ] Désactivation debug par URL en production
- [ ] Tests de migration.ts
- [ ] Self-hosting des polices
- [ ] React.memo sur les composants de liste

**Critère de succès** : `npm run lint` + `npm test` + health check passent sans warning.

### Phase 3 — "Polish" (Semaine 6-8)

> Objectif : L'expérience est raffinée. La marque est renforcée.

- [ ] Adaptation culturelle de la traduction anglaise
- [ ] Dark mode EmojiPicker
- [ ] Animation counterPulse activée
- [ ] Stagger animation HabitCards
- [ ] Guide utilisateur accessible in-app
- [ ] Définition d'une phrase-signature de marque

**Critère de succès** : la spec design system est respectée à 95%+.

### Phase 4 — "Évolution" (Semaine 9+)

> Objectif : Nouvelles features à forte valeur ajoutée.

- [ ] App Badge
- [ ] Suggestions d'ajustement dans WeeklyReview
- [ ] Rappel d'export mensuel
- [ ] Pipeline CI
- [ ] Prévisualisation avant import

**Critère de succès** : score NPS hypothétique en hausse, rétention à 30 jours améliorée.

---

## Annexe — Métriques clés du projet

| Métrique | Valeur |
|----------|--------|
| Fichiers source (src/) | ~120 |
| Lignes TypeScript/TSX | ~15 000 |
| Fichiers CSS | ~50 |
| Tests unitaires (Vitest) | ~15 fichiers |
| Tests E2E (Playwright) | ~40 specs |
| Dépendances production | 10 |
| Dépendances développement | 18 |
| Schéma version | v12 (11 migrations) |
| Versions release | v1.41.0 |
| Langues supportées | 2 (FR, EN) |
| Modes de tracking | 6 |

---

*Bilan réalisé le 1er mars 2026 par :*
- *Lead Developer / Software Architect — Audit qualité code*
- *Product Manager — Audit fonctionnalités*
- *UX/UI Designer Senior — Audit expérience utilisateur*
- *Brand Strategist — Audit culture et ton*
- *Security Engineer — Audit sécurité et risques*
