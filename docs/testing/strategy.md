# Stratégie de Tests

Ce document consolide la stratégie de tests du projet Doucement.

## Vue d'ensemble

Doucement utilise une approche de tests à deux niveaux :
1. **Tests unitaires** (Vitest) - Logique métier et hooks
2. **Tests E2E** (Playwright) - Parcours utilisateur complets

## Tests unitaires (Vitest)

### Configuration

- Framework : Vitest (compatible Jest API)
- Couverture : Objectif 80%+
- Emplacement : `*.test.ts` ou `*.test.tsx` à côté du fichier source

### Commandes

```bash
npm run test           # Exécution unique
npm run test:watch     # Mode watch (développement)
npm run test -- --coverage  # Avec rapport de couverture
```

### Ce qu'on teste

| Catégorie | Exemples | Priorité |
|-----------|----------|----------|
| Services | `progression.ts`, `statistics.ts`, `storage.ts` | Haute |
| Hooks | `useAppData`, `useCelebrations` | Haute |
| Utils | `dateUtils`, `patternAnalysis` | Moyenne |
| Composants | Composants avec logique complexe | Moyenne |

### Bonnes pratiques

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('calculateTargetDose', () => {
  it('should increase dose by percentage per week', () => {
    // Arrange
    const habit = createTestHabit({ /* ... */ })

    // Act
    const result = calculateTargetDose(habit, '2026-01-14')

    // Assert
    expect(result).toBe(expectedValue)
  })
})
```

- Nommer les tests de façon descriptive
- Utiliser `describe` pour grouper les tests liés
- Mocker les dépendances externes avec `vi.mock()`
- Tester les cas limites et d'erreur

### Fixtures de test

Des fixtures centralisées sont disponibles dans `src/test/fixtures/` :

```typescript
import { createTestHabit, createTestEntry } from '@/test/fixtures'

const habit = createTestHabit({
  direction: 'increase',
  startValue: 10
})
```

## Tests E2E (Playwright)

### Configuration

- Framework : Playwright
- Navigateurs : Chromium (par défaut)
- Base URL : `http://localhost:4173` (preview)

### Pré-requis

Les tests E2E nécessitent un build de production :

```bash
# Build + preview (terminal 1)
npm run build && npm run preview

# Tests (terminal 2)
npx playwright test
```

### Fichiers de test de données

Des scénarios prédéfinis sont disponibles dans `public/test-data/` :

| Fichier | Scénario |
|---------|----------|
| `goal-reached.json` | Habitude proche de targetValue |
| `growth-plateau.json` | Habitude stagnante |
| `absence-detected.json` | Absence de 2-3 jours |
| `weekly-review-due.json` | Revue hebdomadaire disponible |
| `habit-stacking.json` | Habitudes chaînées |
| `planned-pause.json` | Pause planifiée active |
| `full-scenario.json` | Scénario complet |

Voir [test-data.md](test-data.md) pour les détails.

### Chargement des données de test

Via le panneau debug :
1. Activer le mode debug (7 taps sur la version)
2. Aller dans Paramètres > Panneau Debug
3. Sélectionner "Charger fichier de test"

Voir [debug-mode.md](debug-mode.md) pour plus de détails.

### Exemples de tests E2E

```typescript
import { test, expect } from '@playwright/test'

test('user can create a new habit', async ({ page }) => {
  await page.goto('/')

  // Navigate to create habit
  await page.click('[data-testid="add-habit-button"]')

  // Fill form
  await page.fill('[data-testid="habit-name-input"]', 'Méditation')

  // Submit
  await page.click('[data-testid="create-habit-submit"]')

  // Verify
  await expect(page.locator('text=Méditation')).toBeVisible()
})
```

### Bonnes pratiques E2E

- Utiliser des `data-testid` pour les sélecteurs
- Éviter les sélecteurs CSS fragiles
- Tester les parcours utilisateur complets
- Réinitialiser l'état entre les tests

## Processus de validation

Avant chaque commit/PR, vérifier :

```bash
npm run lint         # Code style
npm run typecheck    # Types TypeScript
npm run test         # Tests unitaires
npm run build        # Build de production
```

### Critères de validation

- [ ] Tous les tests passent
- [ ] Pas d'erreurs TypeScript
- [ ] Linting OK
- [ ] Build réussit
- [ ] Couverture maintenue (pas de régression)

## Ressources

- [test-data.md](test-data.md) - Fichiers de données de test
- [debug-mode.md](debug-mode.md) - Mode debug pour les tests
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
