# PRD : Refactorisation complète des tests E2E

## Objectif

Finaliser la refactorisation des tests E2E de Doucement pour :
1. Migrer tous les specs vers les nouvelles fixtures centralisées
2. Implémenter les fonctionnalités manquantes pour réactiver les tests skippés
3. Réduire la duplication de code de 30-40%
4. Améliorer la maintenabilité et la lisibilité des tests

## Contexte

### Situation actuelle

- **25 fichiers de tests E2E** (~5800 lignes)
- **Fixtures créées** : `e2e/fixtures/` avec test-data.ts, setup.ts, Page Objects
- **Specs déjà migrés** : `daily-checkin.spec.ts`, `habit-edit.spec.ts`
- **Tests ajoutés** : `import-export.spec.ts`
- **Tests skippés** : 3 blocs (habit-stacking, regroupement moment, saisies cumulatives)

### Problèmes identifiés

1. **Duplication massive** : ~16 instances de données inline, ~62 instances de setup localStorage
2. **Pas de Page Objects** : Sélecteurs répétés partout
3. **Tests skippés** : Fonctionnalités UI non implémentées
4. **SchemaVersion incohérent** : Versions 3, 7, 8, 9 mélangées (devrait être 10)

## Use Cases

### UC1 : Migration d'un spec existant
1. Identifier les données de test inline
2. Remplacer par les factories `createAppData()`, `createHabit()`, etc.
3. Utiliser `setupLocalStorage()` au lieu de `page.addInitScript()`
4. Utiliser les Page Objects quand pertinent
5. Vérifier que les tests passent

### UC2 : Réactivation d'un test skippé
1. Identifier la fonctionnalité manquante
2. Implémenter la fonctionnalité dans le code source
3. Supprimer `.skip` du test
4. Ajuster les assertions si nécessaire
5. Vérifier que les tests passent

## Architecture technique

### Structure des fixtures (existante)

```
e2e/
├── fixtures/
│   ├── index.ts           # Exports centralisés
│   ├── test-data.ts       # Factories de données
│   ├── setup.ts           # Helpers de setup
│   └── pages/
│       ├── index.ts
│       ├── TodayPage.ts
│       ├── SettingsPage.ts
│       ├── EditHabitPage.ts
│       ├── CreateHabitPage.ts
│       ├── StatisticsPage.ts
│       └── WeeklyReviewPage.ts
├── base-test.ts           # Fixture de base
└── *.spec.ts              # Tests E2E
```

### Page Objects à ajouter

- `CreateHabitPage.ts` - Pour les tests de création d'habitude
- `StatisticsPage.ts` - Pour les tests de statistiques
- `WeeklyReviewPage.ts` - Pour les tests de revue hebdomadaire

### Composants à modifier pour tests skippés

1. **Today.tsx** - Ajouter le regroupement visuel des habitudes stackées
2. **Today.tsx** - Ajouter le regroupement par moment de la journée
3. **HabitCard.tsx** - Ajouter l'historique des saisies cumulatives avec undo

## Fonctionnalités à implémenter

### 1. Habit Stacking visuel (Today.tsx)

**Objectif** : Grouper visuellement les habitudes chaînées

**Modifications** :
- Utiliser `groupHabitsByAnchor()` pour regrouper les habitudes
- Appliquer les classes CSS existantes :
  - `.today__habit-chain--connected` pour le conteneur
  - `.today__habit-wrapper--chained` pour les habitudes enfants
- Afficher une indication de l'habitude précédente

**Critères** :
- Les habitudes avec `anchorHabitId` sont visuellement reliées
- L'habitude "ancre" apparaît en premier
- Une indication visuelle montre la chaîne

### 2. Regroupement par moment (Today.tsx)

**Objectif** : Afficher les habitudes groupées par timeOfDay

**Modifications** :
- Utiliser `groupHabitsByTimeOfDay()` (déjà importé)
- Rendre les sections avec `TimeOfDaySection` (existe)
- Masquer les sections vides

**Critères** :
- Sections : Matin, Après-midi, Soir, Nuit
- Habitudes sans timeOfDay dans "Tout moment"
- Sections sans habitudes masquées

### 3. Historique saisies cumulatives

**Objectif** : Permettre l'annulation granulaire des saisies cumulatives

**Modifications** :
- Ajouter un composant `CumulativeHistory` dans HabitCard
- Afficher la liste des opérations avec boutons d'annulation
- Connecter au hook existant `undoLastOperation`

**Critères** :
- Voir l'historique des saisies du jour
- Annuler une saisie individuelle
- Mise à jour immédiate de l'affichage

## Specs à migrer (par priorité)

### Haute priorité (forte duplication)
1. `habit-modification.spec.ts` (492 lignes)
2. `habit-increase-weekly.spec.ts` (278 lignes)
3. `habit-counter.spec.ts` (288 lignes)
4. `celebrations.spec.ts` (531 lignes)
5. `statistics.spec.ts` (359 lignes)

### Moyenne priorité
6. `habit-maintain.spec.ts` (244 lignes)
7. `habit-decrease-zero.spec.ts` (166 lignes)
8. `habit-decrease-daily.spec.ts` (155 lignes)
9. `habit-increase-daily.spec.ts` (135 lignes)
10. `onboarding.spec.ts` (184 lignes)

### Basse priorité (déjà propres ou petits)
11. `create-habit.spec.ts` (269 lignes)
12. `weekly-review.spec.ts` (156 lignes)
13. `planned-pause.spec.ts` (148 lignes)
14. `i18n.spec.ts` (268 lignes)
15. `suggestion-filters.spec.ts` (293 lignes)
16. `habits-display.spec.ts` (317 lignes)
17. `habit-weekly-aggregation.spec.ts` (258 lignes)
18. `goal-reached.spec.ts` (129 lignes)
19. `growth-plateau.spec.ts` (130 lignes)
20. `absence-detection.spec.ts` (91 lignes)
21. `habit-decrease-no-stacking.spec.ts` (111 lignes)

## Critères de succès

1. **Tous les specs migrés** : Utilisation des fixtures centralisées ✅
2. **Tests skippés réactivés** : 0 `test.describe.skip` restant ✅
3. **Réduction de code** : -30% minimum sur les fichiers migrés ✅
4. **Tests passent** : `npm run test:e2e` sans échec ✅
5. **SchemaVersion unifié** : Tous les tests utilisent version 10 ✅
6. **Documentation** : SKIPPED_TESTS.md supprimé (plus de tests skippés) ✅

## Hors périmètre

- Tests de performance
- Tests de résilience/erreur
- Nouveaux tests fonctionnels (sauf import/export déjà fait)
- Refactoring du code applicatif (sauf pour réactiver tests skippés)
