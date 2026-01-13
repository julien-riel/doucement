import { test, expect } from './base-test';

/**
 * Tests E2E pour vérifier que le habit stacking n'est pas proposé
 * pour les habitudes de type decrease
 */

test.describe('Habitude decrease - pas de habit stacking', () => {
  test.beforeEach(async ({ page }) => {
    // Créer des données avec une habitude existante pour pouvoir tester le stacking
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 7,
        habits: [
          {
            id: 'existing-habit',
            name: 'Push-ups',
            emoji: '💪',
            description: 'Habitude existante pour test',
            direction: 'increase',
            startValue: 10,
            unit: 'répétitions',
            progression: { mode: 'absolute', value: 2, period: 'weekly' },
            createdAt: '2025-12-01',
            archivedAt: null,
            trackingMode: 'detailed',
            trackingFrequency: 'daily'
          }
        ],
        entries: [],
        preferences: {
          onboardingCompleted: true,
          lastWeeklyReviewDate: null,
          notifications: {
            enabled: false,
            morningReminder: { enabled: true, time: '08:00' },
            eveningReminder: { enabled: false, time: '20:00' },
            weeklyReviewReminder: { enabled: false, time: '10:00' }
          },
          theme: 'system'
        }
      }));
    });
  });

  test('création habitude increase: le sélecteur d\'ancrage est visible', async ({ page }) => {
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Créer une habitude personnalisée de type Augmenter
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Méditation');
    await page.getByRole('textbox', { name: 'Unité' }).fill('minutes');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // À l'étape Intentions, le sélecteur d'ancrage devrait être visible
    await expect(page.getByText('Quand et où ?')).toBeVisible();

    // Vérifier que la section d'ancrage est présente pour une habitude increase
    await expect(page.getByText('Après quelle habitude ?')).toBeVisible();
  });

  test('création habitude decrease: le sélecteur d\'ancrage n\'est PAS visible', async ({ page }) => {
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Créer une habitude personnalisée de type Réduire
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Réduire/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Cigarettes');
    await page.getByRole('textbox', { name: 'Unité' }).fill('cigarettes');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // À l'étape Intentions
    await expect(page.getByText('Quand et où ?')).toBeVisible();

    // Le sélecteur d'ancrage NE devrait PAS être visible pour une habitude decrease
    await expect(page.getByText('Après quelle habitude ?')).not.toBeVisible();
  });

  test('création habitude maintain: le sélecteur d\'ancrage est visible', async ({ page }) => {
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Créer une habitude personnalisée de type Maintenir
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Maintenir/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Eau');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('8');
    await page.getByRole('textbox', { name: 'Unité' }).fill('verres');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // À l'étape Intentions, le sélecteur d'ancrage devrait être visible
    await expect(page.getByText('Quand et où ?')).toBeVisible();

    // Vérifier que la section d'ancrage est présente pour une habitude maintain
    await expect(page.getByText('Après quelle habitude ?')).toBeVisible();
  });
});
