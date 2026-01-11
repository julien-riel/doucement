import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les habitudes increase daily
 * Vérifie que >= cible = succès avec feedback positif
 *
 * Boutons pour increase: "Un peu" | "Fait !" | "Encore +"
 */

// Données de test pour habitude increase
const increaseDailyData = {
  schemaVersion: 7,
  habits: [
    {
      id: 'habit-pushups-increase-daily',
      name: 'Push-ups',
      emoji: '💪',
      description: 'Renforcement musculaire quotidien',
      direction: 'increase',
      startValue: 10,
      unit: 'répétitions',
      progression: { mode: 'absolute', value: 2, period: 'weekly' },
      targetValue: 50,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily'
    }
  ],
  entries: [],
  preferences: {
    onboardingCompleted: true,
    lastWeeklyReviewDate: '2026-01-05',
    notifications: {
      enabled: false,
      morningReminder: { enabled: true, time: '08:00' },
      eveningReminder: { enabled: false, time: '20:00' },
      weeklyReviewReminder: { enabled: false, time: '10:00' }
    },
    theme: 'system'
  }
};

test.describe('Habitude increase daily', () => {
  test.beforeEach(async ({ page }) => {
    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseDailyData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Push-ups")');
  });

  test('affiche l\'habitude increase avec les boutons de check-in', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();

    // Vérifier les boutons de check-in pour mode detailed
    await expect(page.getByRole('button', { name: 'Un peu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fait !' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore +' })).toBeVisible();
  });

  test('check-in "Fait !" atteint exactement la cible = succès', async ({ page }) => {
    await page.getByRole('button', { name: 'Fait !' }).click();

    // Le pourcentage devrait être à 100%
    await expect(page.getByRole('status', { name: /complété/ })).toContainText('100%');
  });

  test('check-in avec valeur > cible = dépassement (exceeded)', async ({ page }) => {
    await page.getByRole('button', { name: 'Encore +' }).click();

    // Saisir une valeur supérieure à la cible
    const input = page.getByRole('spinbutton', { name: /répétitions/i });
    await expect(input).toBeVisible();
    await input.fill('25');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Devrait afficher la valeur saisie
    await expect(page.getByText('25 /')).toBeVisible();
  });

  test('check-in avec valeur partielle', async ({ page }) => {
    await page.getByRole('button', { name: 'Un peu' }).click();

    // Saisir une valeur inférieure à la cible
    const input = page.getByRole('spinbutton', { name: /répétitions/i });
    await expect(input).toBeVisible();
    await input.fill('5');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Devrait afficher la valeur saisie
    await expect(page.getByText('5 /')).toBeVisible();
  });

  test('création d\'une habitude increase daily complète', async ({ page }) => {
    // Aller à la page de création
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Créer une habitude personnalisée
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Squats');
    await page.getByRole('textbox', { name: 'Unité' }).fill('répétitions');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('15');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Passer les étapes optionnelles
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Vérifier l'aperçu
    await expect(page.getByRole('heading', { name: 'Squats' })).toBeVisible();
    await expect(page.getByText('Augmenter')).toBeVisible();
    await expect(page.getByText('15 répétitions')).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Étape first-checkin
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier que l'habitude est créée
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Squats' })).toBeVisible();
  });
});
