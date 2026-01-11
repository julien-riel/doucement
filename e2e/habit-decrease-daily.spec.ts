import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les habitudes decrease daily
 * Vérifie que <= cible = succès (moins = mieux)
 *
 * Boutons pour decrease: "Un peu +" | "Pile poil" | "Moins"
 */

// Données de test pour habitude decrease
const decreaseDailyData = {
  schemaVersion: 7,
  habits: [
    {
      id: 'habit-cigarettes-decrease-daily',
      name: 'Réduire les cigarettes',
      emoji: '🚭',
      description: 'Réduction progressive du tabac',
      direction: 'decrease',
      startValue: 15,
      unit: 'cigarettes',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
      targetValue: 0,
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

test.describe('Habitude decrease daily', () => {
  test.beforeEach(async ({ page }) => {
    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, decreaseDailyData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Réduire les cigarettes")');
  });

  test('affiche l\'habitude decrease avec les boutons adaptés', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Réduire les cigarettes' })).toBeVisible();
    await expect(page.getByText('🚭')).toBeVisible();

    // Vérifier les boutons de check-in pour mode detailed (direction: decrease)
    // Labels: "Un peu +" | "Pile poil" | "Moins"
    await expect(page.getByRole('button', { name: 'Un peu +' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pile poil' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Moins' })).toBeVisible();
  });

  test('check-in avec "Pile poil" = valeur exacte de la cible', async ({ page }) => {
    await page.getByRole('button', { name: 'Pile poil' }).click();

    // Le pourcentage devrait être à 100%
    await expect(page.getByRole('status', { name: /complété/ })).toContainText('100%');
  });

  test('check-in avec "Moins" = mieux que prévu (moins = succès)', async ({ page }) => {
    await page.getByRole('button', { name: 'Moins' }).click();

    // Saisir une valeur inférieure à la cible (moins = mieux pour decrease)
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await expect(input).toBeVisible();
    await input.fill('5');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Devrait afficher la valeur saisie
    await expect(page.getByText('5 /')).toBeVisible();
  });

  test('check-in avec "Un peu +" = plus que la cible', async ({ page }) => {
    await page.getByRole('button', { name: 'Un peu +' }).click();

    // Saisir une valeur supérieure à la cible
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await expect(input).toBeVisible();
    await input.fill('15');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Devrait afficher la valeur saisie
    await expect(page.getByText('15 /')).toBeVisible();
  });

  test('saisir une valeur très basse pour decrease = victoire', async ({ page }) => {
    await page.getByRole('button', { name: 'Moins' }).click();

    // Attendre que le champ de saisie apparaisse
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await expect(input).toBeVisible();

    // Saisir 1 (presque victoire totale pour une habitude de réduction)
    await input.fill('1');

    // Attendre que le bouton Valider soit actif
    const validateButton = page.getByRole('button', { name: 'Valider' });
    await expect(validateButton).toBeEnabled();
    await validateButton.click();

    // Attendre que la valeur soit affichée (format: "1 / X cigarettes")
    await expect(page.getByText('1 /')).toBeVisible();
  });

  test('création d\'une habitude decrease daily complète', async ({ page }) => {
    // Aller à la page de création
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Créer une habitude personnalisée de type Réduire
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Réduire/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails (emoji par défaut pour decrease est 🚭)
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Cafés');
    await page.getByRole('textbox', { name: 'Unité' }).fill('cafés');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('5');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Passer les étapes optionnelles - pour decrease, pas de habit stacking
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Vérifier l'aperçu
    await expect(page.getByRole('heading', { name: 'Cafés' })).toBeVisible();
    await expect(page.getByText('Réduire')).toBeVisible();
    await expect(page.getByText('5 cafés')).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Étape first-checkin
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier que l'habitude est créée
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Cafés' })).toBeVisible();
  });
});
