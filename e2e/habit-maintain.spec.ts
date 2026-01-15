import { test, expect } from './base-test';
import {
  createAppData,
  createMaintainHabit,
  createEmptyAppData,
  setupLocalStorage,
  gotoToday,
  resetCounters,
} from './fixtures';

/**
 * Tests E2E pour les habitudes de maintien (direction: maintain)
 * Ces habitudes n'ont pas de progression - la dose reste fixe.
 * Typiquement utilisées avec trackingMode: simple (binaire)
 */

// Données de test pour habitude maintain avec mode simple
const maintainSimpleData = createAppData({
  habits: [
    createMaintainHabit({
      id: 'habit-vitamins-maintain-simple',
      name: 'Prendre ses vitamines',
      emoji: '💊',
      description: 'Prendre ses vitamines chaque jour',
      startValue: 1,
      unit: 'prise',
      trackingMode: 'simple', // Mode binaire: fait/pas fait
    }),
  ],
  preferences: {
    lastWeeklyReviewDate: '2026-01-05',
  },
});

// Données de test pour habitude maintain avec mode detailed
const maintainDetailedData = createAppData({
  habits: [
    createMaintainHabit({
      id: 'habit-water-maintain-detailed',
      name: "Boire 8 verres d'eau",
      emoji: '💧',
      description: 'Maintenir 8 verres par jour',
      startValue: 8,
      unit: 'verres',
      trackingMode: 'detailed',
    }),
  ],
  preferences: {
    lastWeeklyReviewDate: '2026-01-05',
  },
});

test.describe('Habitude maintain - mode simple (binaire)', () => {
  test.beforeEach(async ({ page }) => {
    resetCounters();
    await setupLocalStorage(page, maintainSimpleData);
    await gotoToday(page, 'Prendre ses vitamines');
  });

  test('affiche l\'habitude maintain avec les boutons simples', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Prendre ses vitamines' })).toBeVisible();
    await expect(page.getByText('💊')).toBeVisible();

    // Vérifier les boutons de check-in pour mode simple (binaire)
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible();
    await expect(page.getByRole('button', { name: "Pas aujourd'hui" })).toBeVisible();

    // Pas de boutons quantitatifs pour le mode simple
    await expect(page.getByRole('button', { name: 'Un peu' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Fait !' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore +' })).not.toBeVisible();
  });

  test('check-in avec "Fait" marque l\'habitude comme complétée', async ({ page }) => {
    await page.getByRole('button', { name: 'Fait' }).click();

    // Vérifier que la carte passe en mode "complété"
    const habitCard = page.locator('.habit-card').first();
    await expect(habitCard).toHaveClass(/habit-card--completed|habit-card--exceeded/);
  });

  test('check-in avec "Pas aujourd\'hui" marque l\'habitude comme non faite', async ({ page }) => {
    await page.getByRole('button', { name: "Pas aujourd'hui" }).click();

    // Vérifier que la carte reste en mode "pending" ou "partial"
    const habitCard = page.locator('.habit-card').first();
    await expect(habitCard).toHaveClass(/habit-card--pending/);
  });

  test('la dose reste fixe (pas de progression)', async ({ page }) => {
    // Vérifier que la dose affichée est 1
    const doseValue = page.locator('.habit-card__dose-value').first();
    await expect(doseValue).toHaveText('1');
    await expect(page.getByText('prise')).toBeVisible();

    // Faire un check-in
    await page.getByRole('button', { name: 'Fait' }).click();

    // La dose devrait toujours être 1 (pas de progression pour maintain)
    await expect(doseValue).toHaveText('1');
  });
});

test.describe('Habitude maintain - mode detailed', () => {
  test.beforeEach(async ({ page }) => {
    resetCounters();
    await setupLocalStorage(page, maintainDetailedData);
    await gotoToday(page, "Boire 8 verres");
  });

  test('affiche l\'habitude maintain avec les boutons quantitatifs', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Boire 8 verres d'eau" })).toBeVisible();

    // Vérifier les boutons de check-in pour mode detailed
    // Pour maintain/increase, les labels sont: "Un peu" | "Fait !" | "Encore +"
    await expect(page.getByRole('button', { name: 'Un peu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fait !' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore +' })).toBeVisible();
  });

  test('la dose cible est fixe à 8 verres', async ({ page }) => {
    // Vérifier que la dose affichée est 8
    await expect(page.locator('.habit-card__dose-value').first()).toHaveText('8');
    // Vérifier que l'unité "verres" est affichée dans la zone de dose
    await expect(page.locator('.habit-card__dose-unit').first()).toHaveText('verres');
  });

  test('check-in avec "Fait !" enregistre la valeur exacte', async ({ page }) => {
    await page.getByRole('button', { name: 'Fait !' }).click();

    // Vérifier que la valeur est enregistrée (8/8)
    await expect(page.getByText('8 / 8')).toBeVisible();
  });
});

test.describe('Habitude maintain - création', () => {
  test.beforeEach(async ({ page }) => {
    resetCounters();
    await setupLocalStorage(page, createEmptyAppData());
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');
  });

  test('création d\'une habitude maintain complète', async ({ page }) => {
    // Créer une habitude personnalisée de type Maintenir
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Maintenir/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: "Nom de l'habitude" }).fill('Prendre mes vitamines');
    await page.getByRole('textbox', { name: 'Unité' }).fill('prise');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('1');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Passer les étapes optionnelles (intentions, identité)
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Vérifier l'aperçu - le nom de l'habitude et le type doivent être visibles
    await expect(page.getByRole('heading', { name: 'Prendre mes vitamines' })).toBeVisible();
    // Vérifier que c'est bien une habitude maintain (le mot "Maintenir" apparaît quelque part)
    await expect(page.locator('text=Maintenir')).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: "Créer l'habitude" }).click();

    // Étape first-checkin - on peut dire non pour commencer demain
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier que l'habitude est créée et visible sur la page d'accueil
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Prendre mes vitamines' })).toBeVisible();
  });

  test('habitude maintain n\'affiche pas d\'options de progression', async ({ page }) => {
    // Créer une habitude personnalisée de type Maintenir
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Maintenir/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails de base
    await page.getByRole('textbox', { name: "Nom de l'habitude" }).fill('Test maintain');
    await page.getByRole('textbox', { name: 'Unité' }).fill('test');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('5');

    // Vérifier qu'il n'y a pas d'options de progression
    // Pour maintain, les champs de progression ne devraient pas être affichés
    await expect(page.getByText('Progression')).not.toBeVisible();
    await expect(page.getByText('par semaine')).not.toBeVisible();
    await expect(page.getByText('par jour')).not.toBeVisible();
  });
});
