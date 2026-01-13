import { test, expect } from './base-test';

/**
 * Tests E2E pour les habitudes decrease avec saisie de zéro
 * Quand l'utilisateur saisit 0 pour une habitude decrease, c'est une grande victoire
 * qui mérite un message de félicitations spécial.
 */

// Données de test pour habitude decrease avec entrée à zéro
// Simule le jour après une journée parfaite (sans aucune cigarette)
const decreaseZeroData = {
  schemaVersion: 7,
  habits: [
    {
      id: 'habit-cigarettes-decrease-zero',
      name: 'Réduire les cigarettes',
      emoji: '🚭',
      description: 'Réduction progressive du tabac - jour parfait avec 0',
      direction: 'decrease',
      startValue: 10,
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

// Messages de félicitations pour zéro (doivent correspondre à DECREASE_ZERO_MESSAGES)
const zeroMessages = [
  'Journée parfaite !',
  'Zéro. Bravo !',
  "Tu n'as pas cédé.",
  'Victoire totale.',
  'Rien du tout. Impressionnant.'
];

test.describe('Habitude decrease - saisie zéro', () => {
  test.beforeEach(async ({ page }) => {
    // Injecter les données de test AVANT que la page charge
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, decreaseZeroData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Réduire les cigarettes")');
  });

  test('saisie de 0 affiche un message de félicitations spécial', async ({ page }) => {
    // Cliquer sur "Moins" pour saisir une valeur personnalisée
    await page.getByRole('button', { name: 'Moins' }).click();

    // Attendre que le champ de saisie apparaisse
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await expect(input).toBeVisible();

    // Saisir 0 (victoire totale pour une habitude de réduction)
    await input.fill('0');

    // Valider
    const validateButton = page.getByRole('button', { name: 'Valider' });
    await expect(validateButton).toBeEnabled();
    await validateButton.click();

    // Vérifier qu'un des messages de félicitations spéciaux est affiché
    // On utilise une regex pour matcher n'importe lequel des messages
    const messageRegex = new RegExp(zeroMessages.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
    await expect(page.getByText(messageRegex)).toBeVisible();
  });

  test('saisie de 0 affiche le badge "Journée sans"', async ({ page }) => {
    // Cliquer sur "Moins" pour saisir une valeur personnalisée
    await page.getByRole('button', { name: 'Moins' }).click();

    // Attendre que le champ de saisie apparaisse
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await expect(input).toBeVisible();

    // Saisir 0
    await input.fill('0');

    // Valider
    await page.getByRole('button', { name: 'Valider' }).click();

    // Vérifier que le badge "Journée sans" est affiché
    await expect(page.getByText('Journée sans')).toBeVisible();
  });

  test('la carte a un style de victoire (fond vert) après saisie de 0', async ({ page }) => {
    // Saisir 0
    await page.getByRole('button', { name: 'Moins' }).click();
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await input.fill('0');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Vérifier que la carte de statut a le style de victoire zéro
    // Elle devrait avoir la classe habit-card__status--zero-victory
    const statusBlock = page.locator('.habit-card__status--zero-victory');
    await expect(statusBlock).toBeVisible();
  });

  test('après saisie de 0, la carte montre le style de victoire totale', async ({ page }) => {
    // Saisir 0
    await page.getByRole('button', { name: 'Moins' }).click();
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await input.fill('0');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Vérifier que le badge et le message sont visibles
    await expect(page.getByText('Journée sans')).toBeVisible();

    // Vérifier que la carte a le bon statut
    // La classe habit-card--completed devrait être présente
    const habitCard = page.locator('.habit-card').first();
    await expect(habitCard).toHaveClass(/habit-card--completed|habit-card--exceeded/);
  });
});

test.describe('Habitude decrease - feedback visuel moins que cible', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, decreaseZeroData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Réduire les cigarettes")');
  });

  test('saisie inférieure à la cible affiche badge "En contrôle"', async ({ page }) => {
    // La cible est actuellement autour de 9 (startValue 10 - quelques semaines)
    // Saisir une valeur inférieure
    await page.getByRole('button', { name: 'Moins' }).click();
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await input.fill('3');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Vérifier que le badge "En contrôle" est affiché (pour less than target)
    await expect(page.getByText('En contrôle')).toBeVisible();
  });

  test('la carte a un style de succès (fond vert) quand moins que cible', async ({ page }) => {
    await page.getByRole('button', { name: 'Moins' }).click();
    const input = page.getByRole('spinbutton', { name: /cigarettes/i });
    await input.fill('3');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Vérifier que le bloc de statut a le style de succès decrease
    const statusBlock = page.locator('.habit-card__status--decrease-success');
    await expect(statusBlock).toBeVisible();
  });
});
