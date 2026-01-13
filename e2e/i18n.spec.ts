import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'internationalisation (i18n)
 * Vérifie le changement de langue, la persistance et la détection automatique
 */

test.describe('Internationalisation (i18n)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 3,
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true }
      }));
    });
  });

  test.describe('Sélecteur de langue', () => {
    test('affiche le sélecteur de langue dans les paramètres', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Vérifier que la section langue est visible
      await expect(page.getByRole('heading', { name: /Langue|Language/ })).toBeVisible();

      // Vérifier que les deux options de langue sont visibles
      await expect(page.getByRole('button', { name: /Français/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /English/ })).toBeVisible();
    });

    test('changement de langue de français vers anglais', async ({ page }) => {
      // Forcer le français d'abord
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'fr');
      });

      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Vérifier que l'interface est en français
      await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible();

      // Cliquer sur English
      await page.getByRole('button', { name: /English/ }).click();

      // Vérifier que l'interface passe en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('changement de langue de anglais vers français', async ({ page }) => {
      // Forcer l'anglais d'abord
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'en');
      });

      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Vérifier que l'interface est en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // Cliquer sur Français
      await page.getByRole('button', { name: /Français/ }).click();

      // Vérifier que l'interface passe en français
      await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible();
    });
  });

  test.describe('Persistance du choix de langue', () => {
    test('le choix de langue persiste après rechargement', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Changer vers l'anglais
      await page.getByRole('button', { name: /English/ }).click();

      // Vérifier que l'interface est en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

      // Recharger la page
      await page.reload();
      await page.waitForSelector('.page-settings');

      // Vérifier que l'interface est toujours en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('le choix de langue persiste entre les pages', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Changer vers l'anglais
      await page.getByRole('button', { name: /English/ }).click();

      // Naviguer vers la page d'accueil
      await page.goto('/');
      await page.waitForSelector('.page-today, .page-onboarding');

      // Vérifier que l'interface est en anglais (navigation)
      await expect(page.getByRole('link', { name: /Today|Habits|Statistics|Settings/ })).toBeVisible();
    });
  });

  test.describe('Traductions des éléments clés', () => {
    test('navigation en français', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'fr');
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Vérifier les éléments de navigation en français
      const nav = page.locator('nav, .navigation, .bottom-nav');
      await expect(nav.getByRole('link', { name: /Aujourd/i })).toBeVisible();
      await expect(nav.getByRole('link', { name: /Habitude/i })).toBeVisible();
    });

    test('navigation en anglais', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'en');
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Vérifier les éléments de navigation en anglais
      const nav = page.locator('nav, .navigation, .bottom-nav');
      await expect(nav.getByRole('link', { name: /Today/i })).toBeVisible();
      await expect(nav.getByRole('link', { name: /Habit/i })).toBeVisible();
    });

    test('page de création d\'habitude en français', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'fr');
      });

      await page.goto('/create');
      await page.waitForSelector('.page-create-habit');

      // Vérifier les éléments en français
      await expect(page.getByRole('heading', { name: /Nouvelle habitude/i })).toBeVisible();
      await expect(page.getByText(/Habitudes à fort impact/i)).toBeVisible();
    });

    test('page de création d\'habitude en anglais', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'en');
      });

      await page.goto('/create');
      await page.waitForSelector('.page-create-habit');

      // Vérifier les éléments en anglais
      await expect(page.getByRole('heading', { name: /New habit/i })).toBeVisible();
      await expect(page.getByText(/High impact habits/i)).toBeVisible();
    });
  });

  test.describe('Traduction des habitudes suggérées', () => {
    test('habitudes suggérées en français', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'fr');
      });

      await page.goto('/create');
      await page.waitForSelector('.page-create-habit');

      // Vérifier qu'une habitude suggérée est en français
      await expect(page.getByText(/Se coucher à heure fixe|Marche quotidienne|Méditation guidée/i)).toBeVisible();
    });

    test('habitudes suggérées en anglais', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'en');
      });

      await page.goto('/create');
      await page.waitForSelector('.page-create-habit');

      // Vérifier qu'une habitude suggérée est en anglais
      await expect(page.getByText(/Regular bedtime|Daily walk|Guided meditation/i)).toBeVisible();
    });
  });

  test.describe('Indicateur visuel de langue active', () => {
    test('bouton français actif quand langue est français', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'fr');
      });

      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Vérifier que le bouton français a la classe active
      const frButton = page.getByRole('button', { name: /Français/ });
      await expect(frButton).toHaveClass(/--active/);

      // Vérifier que le bouton anglais n'a pas la classe active
      const enButton = page.getByRole('button', { name: /English/ });
      await expect(enButton).not.toHaveClass(/--active/);
    });

    test('bouton anglais actif quand langue est anglais', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('doucement-language', 'en');
      });

      await page.goto('/settings');
      await page.waitForSelector('.page-settings');

      // Vérifier que le bouton anglais a la classe active
      const enButton = page.getByRole('button', { name: /English/ });
      await expect(enButton).toHaveClass(/--active/);

      // Vérifier que le bouton français n'a pas la classe active
      const frButton = page.getByRole('button', { name: /Français/ });
      await expect(frButton).not.toHaveClass(/--active/);
    });
  });
});
