import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les modes d'agrégation hebdomadaire
 * - count-days: Compte les jours où l'objectif est atteint
 * - sum-units: Additionne les unités sur toute la semaine
 */

// Données de test pour habitude hebdomadaire avec count-days (ex: se coucher tôt)
const countDaysData = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-bedtime-weekly',
      name: 'Se coucher tôt',
      emoji: '🌙',
      direction: 'increase',
      startValue: 3, // Objectif: 3 soirs par semaine
      unit: 'soirs/semaine',
      progression: null,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'simple',
      trackingFrequency: 'weekly',
      weeklyAggregation: 'count-days'
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

// Données de test pour habitude hebdomadaire avec sum-units (ex: alcool)
const sumUnitsData = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-alcohol-weekly',
      name: 'Verres d\'alcool',
      emoji: '🍷',
      direction: 'decrease',
      startValue: 7, // Objectif: max 7 verres par semaine
      unit: 'verres/semaine',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'counter',
      trackingFrequency: 'weekly',
      weeklyAggregation: 'sum-units'
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

test.describe('Agrégation count-days (jours réussis)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, countDaysData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher tôt")');
  });

  test('affiche le compteur de jours réussis', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: 'Se coucher tôt' })).toBeVisible();
    await expect(page.getByText('🌙').first()).toBeVisible();

    // Pour une habitude weekly simple avec count-days, on devrait voir X/Y jours
    // L'affichage est "0/3 cette semaine"
    await expect(page.getByText('0/3')).toBeVisible();
  });

  test('boutons de check-in simples pour count-days', async ({ page }) => {
    // Mode simple: boutons "Fait" et "Pas aujourd'hui"
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pas aujourd/i })).toBeVisible();
  });

  test('check-in incrémente le compteur de jours', async ({ page }) => {
    // Cliquer sur "Fait"
    await page.getByRole('button', { name: 'Fait' }).click();

    // Le compteur devrait passer à 1/3
    await expect(page.getByText('1/3')).toBeVisible();
  });
});

// Données de test pour habitude daily avec sum-units et mode compteur
const sumUnitsDailyData = {
  schemaVersion: 9,
  habits: [
    {
      id: 'habit-alcohol-daily',
      name: "Verres d'alcool",
      emoji: '🍷',
      direction: 'decrease',
      startValue: 3, // Objectif quotidien: max 3 verres
      unit: 'verres',
      progression: null,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'counter',
      trackingFrequency: 'daily',
      entryMode: 'cumulative'
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

test.describe('Agrégation sum-units avec compteur daily', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, sumUnitsDailyData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Verres d\'alcool")');
  });

  test('affiche les boutons compteur pour habitude daily decrease', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Verres d'alcool" })).toBeVisible();
    await expect(page.getByText('🍷')).toBeVisible();

    // Pour une habitude daily avec mode counter, on voit les boutons compteur
    await expect(page.getByRole('button', { name: /Ajouter 1/i })).toBeVisible();
  });

  test('boutons compteur avec couleurs decrease', async ({ page }) => {
    // Pour decrease, +1 devrait être attention (ajouter de la consommation)
    const addButton = page.getByRole('button', { name: /Ajouter 1/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toHaveClass(/counter-buttons__btn--attention/);
  });

  test("ajouter des unités s'accumule dans la journée", async ({ page }) => {
    // Ajouter 2 verres
    await page.getByRole('button', { name: /Ajouter 1/i }).click();
    await page.getByRole('button', { name: /Ajouter 1/i }).click();

    // Le total devrait être 2
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '2' })).toBeVisible();
  });

  test('annuler réduit le total', async ({ page }) => {
    // Ajouter 3 puis annuler 1
    await page.getByRole('button', { name: /Ajouter 1/i }).click();
    await page.getByRole('button', { name: /Ajouter 1/i }).click();
    await page.getByRole('button', { name: /Ajouter 1/i }).click();
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '3' })).toBeVisible();

    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.locator('.counter-buttons__current').filter({ hasText: '2' })).toBeVisible();
  });
});

test.describe('Agrégation sum-units avec habitude weekly', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, sumUnitsData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Verres d\'alcool")');
  });

  test('affiche le compteur de semaine pour habitude weekly sum-units', async ({ page }) => {
    // Vérifier que l'habitude est affichée
    await expect(page.getByRole('heading', { name: "Verres d'alcool" })).toBeVisible();
    await expect(page.getByText('🍷')).toBeVisible();

    // Les habitudes weekly affichent un compteur X/Y cette semaine
    await expect(page.getByText(/cette semaine/)).toBeVisible();
  });

  test('boutons Fait/Pas aujourd\'hui pour weekly', async ({ page }) => {
    // Les habitudes weekly utilisent les boutons simples
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pas aujourd/i })).toBeVisible();
  });
});

test.describe('Options de création d\'habitude', () => {
  test.beforeEach(async ({ page }) => {
    // Données minimales avec onboarding complété
    await page.addInitScript(() => {
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 9,
        habits: [],
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

    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');
  });

  test('options de mode de suivi sont disponibles', async ({ page }) => {
    // Créer une habitude personnalisée
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Remplir les détails
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Sport');
    await page.getByRole('textbox', { name: 'Unité' }).fill('séances');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('3');

    // Vérifier que les options de mode de suivi sont présentes
    await expect(page.getByRole('button', { name: /Simple/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Détaillé/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Compteur/i })).toBeVisible();
  });
});
