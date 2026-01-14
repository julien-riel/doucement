# Tests E2E Skippés

Ce document liste les tests E2E actuellement skippés et les raisons pour lesquelles ils le sont.
Pour réactiver ces tests, les fonctionnalités correspondantes doivent être implémentées.

## Résumé

| Fichier | Tests skippés | Raison | Priorité |
|---------|---------------|--------|----------|
| `habit-stacking.spec.ts` | Tout le fichier (11 tests) | Classes CSS non appliquées dans Today.tsx | Moyenne |
| `habits-display.spec.ts` | 2 describe blocks | Regroupement par moment non implémenté | Basse |
| `habit-modification.spec.ts` | 1 describe block | Saisies cumulatives non implémentées | Moyenne |

---

## Détail des tests skippés

### 1. habit-stacking.spec.ts

**Statut**: `test.describe.skip` (tout le fichier)

**Raison**:
Les classes CSS `.today__habit-chain--connected` et `.today__habit-wrapper--chained` existent
dans les fichiers CSS mais ne sont pas appliquées dans `Today.tsx`. Le composant ne groupe pas
visuellement les habitudes chaînées.

**Ce qui fonctionne**:
- Les données `anchorHabitId` sont correctement stockées
- L'édition d'habitude permet de définir l'habitude d'ancrage

**Ce qui manque pour réactiver**:
1. Modifier `Today.tsx` pour grouper visuellement les habitudes avec `anchorHabitId`
2. Appliquer les classes CSS de chaînage
3. Afficher une indication de l'habitude précédente dans la chaîne

**Fichier de données de test**: `public/test-data/habit-stacking.json`

---

### 2. habits-display.spec.ts - Regroupement par moment

**Statut**: `test.describe.skip` (2 blocs)

**Tests concernés**:
- "Regroupement par moment de la journée"
- "Sections vides masquées"

**Raison**:
Le composant `Today` n'affiche pas les habitudes groupées par moment de la journée
(matin/après-midi/soir/nuit). Les habitudes sont affichées dans une liste plate.

**Ce qui fonctionne**:
- Le champ `timeOfDay` est stocké sur les habitudes
- Le composant `TimeOfDaySection` existe

**Ce qui manque pour réactiver**:
1. Utiliser `groupHabitsByTimeOfDay()` dans `Today.tsx`
2. Rendre chaque groupe avec `TimeOfDaySection`
3. Masquer les sections sans habitudes

---

### 3. habit-modification.spec.ts - Saisies cumulatives

**Statut**: `test.describe.skip`

**Tests concernés**:
- "Annulation des saisies cumulatives"

**Raison**:
Les saisies cumulatives ne sont pas implémentées comme prévu. Le mode `entryMode: 'cumulative'`
existe mais l'interface d'annulation des opérations individuelles n'est pas fonctionnelle.

**Ce qui fonctionne**:
- Le mode cumulative peut être sélectionné en édition
- Les valeurs s'additionnent

**Ce qui manque pour réactiver**:
1. Interface pour voir l'historique des saisies cumulatives
2. Bouton d'annulation par opération (undo granulaire)
3. Affichage du détail des opérations sur la carte d'habitude

---

## Comment réactiver un test

1. Implémenter la fonctionnalité manquante
2. Supprimer `.skip` du `test.describe`
3. Exécuter le test: `npm run test:e2e -- --grep "Nom du test"`
4. Ajuster les assertions si nécessaire
5. Retirer l'entrée de ce fichier

## Notes

- Les tests utilisent les données de `public/test-data/` quand possible
- Les nouvelles fixtures dans `e2e/fixtures/` peuvent être utilisées pour simplifier les tests
- Pour un test flaky, ajouter `.retry(2)` plutôt que `.skip`
