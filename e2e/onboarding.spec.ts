import { test, expect } from './base-test';

/**
 * Tests E2E pour le parcours d'onboarding
 * Vérifie la navigation à travers les 4 écrans (3 intro + suggestions), le skip, et la complétion
 */

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Effacer le localStorage avant chaque test pour avoir un état propre
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
    });
    await page.goto('/onboarding');
    // Attendre que la page charge
    await page.waitForSelector('h1:has-text("Bienvenue")');
  });

  test('affiche le premier écran de bienvenue', async ({ page }) => {
    // Vérifier le contenu du premier écran
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.getByText(/Doucement t'aide à améliorer tes habitudes/)).toBeVisible();
    await expect(page.getByText('🌱')).toBeVisible();

    // Vérifier le message de confidentialité
    await expect(page.getByText(/Tes données restent sur ton appareil/)).toBeVisible();

    // Vérifier les indicateurs d'étapes (4 étapes au total: 3 intro + suggestions)
    await expect(page.getByRole('tab', { name: '1/4' })).toHaveAttribute('aria-selected', 'true');

    // Vérifier les boutons
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Passer l\'introduction' })).toBeVisible();
    // Pas de bouton Retour sur le premier écran
    await expect(page.getByRole('button', { name: /Retour|Précédent/i })).not.toBeVisible();
  });

  test('navigation complète à travers les 3 étapes intro', async ({ page }) => {
    // Étape 1: Bienvenue (avec info confidentialité)
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 2: La dose du jour (avec progression)
    await expect(page.getByRole('heading', { name: 'La dose du jour' })).toBeVisible();
    await expect(page.getByText(/Oublie les objectifs intimidants/)).toBeVisible();
    await expect(page.getByText(/l'effet composé fait le travail/)).toBeVisible();
    await expect(page.getByText('📊')).toBeVisible();
    await expect(page.getByRole('tab', { name: '2/4' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: /Retour|Précédent/i })).toBeVisible();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 3: Chaque effort compte
    await expect(page.getByRole('heading', { name: 'Chaque effort compte' })).toBeVisible();
    await expect(page.getByText(/70% c'est une victoire/)).toBeVisible();
    await expect(page.getByText('💚')).toBeVisible();
    await expect(page.getByRole('tab', { name: '3/4' })).toHaveAttribute('aria-selected', 'true');
    // Le bouton devient "Choisir mes habitudes" pour passer aux suggestions
    await expect(page.getByRole('button', { name: 'Choisir mes habitudes' })).toBeVisible();
  });

  test('permet de revenir en arrière avec le bouton Retour', async ({ page }) => {
    // Aller à l'étape 2
    await page.getByRole('button', { name: 'Suivant' }).click();
    await expect(page.getByRole('heading', { name: 'La dose du jour' })).toBeVisible();

    // Revenir à l'étape 1
    await page.getByRole('button', { name: /Retour|Précédent/i }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '1/4' })).toHaveAttribute('aria-selected', 'true');
  });

  test('skip l\'onboarding redirige vers l\'écran principal', async ({ page }) => {
    await page.getByRole('button', { name: 'Passer l\'introduction' }).click();

    // Devrait rediriger vers la page principale
    await expect(page).toHaveURL('/');

    // L'onboarding devrait être marqué comme complété
    const onboardingCompleted = await page.evaluate(() => {
      const data = localStorage.getItem('doucement_data');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.preferences?.onboardingCompleted;
      }
      return false;
    });
    expect(onboardingCompleted).toBe(true);
  });

  test('affiche l\'écran de suggestions d\'habitudes', async ({ page }) => {
    // Naviguer jusqu'à l'écran des suggestions (3 intro steps)
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Choisir mes habitudes' }).click();

    // Vérifier l'écran des suggestions
    await expect(page.getByRole('heading', { name: 'Habitudes à fort impact' })).toBeVisible();
    await expect(page.getByText('Basées sur la science')).toBeVisible();
    await expect(page.getByRole('tab', { name: '4/4' })).toHaveAttribute('aria-selected', 'true');

    // Le bouton Skip n'est plus visible sur l'écran des suggestions
    await expect(page.getByRole('button', { name: 'Passer l\'introduction' })).not.toBeVisible();
  });

  test('sélectionner des habitudes suggérées et terminer', async ({ page }) => {
    // Naviguer jusqu'à l'écran des suggestions (3 intro steps)
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Choisir mes habitudes' }).click();

    // Sélectionner une habitude suggérée
    await page.locator('.suggested-habit-card').first().click();

    // Le compteur devrait montrer 1 sélectionnée
    await expect(page.getByText('1 / 3 sélectionnée')).toBeVisible();

    // Le bouton devrait indiquer qu'on va créer 1 habitude
    await expect(page.getByRole('button', { name: 'Créer 1 habitude' })).toBeVisible();

    // Cliquer pour terminer
    await page.getByRole('button', { name: 'Créer 1 habitude' }).click();

    // Devrait rediriger vers la page principale
    await expect(page).toHaveURL('/');

    // L'habitude devrait être créée
    await expect(page.locator('.habit-card')).toBeVisible();
  });

  test('compléter l\'onboarding sans sélectionner d\'habitude', async ({ page }) => {
    // Naviguer jusqu'à l'écran des suggestions (3 intro steps)
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Choisir mes habitudes' }).click();

    // Ne pas sélectionner d'habitude, cliquer sur "Commencer sans habitude"
    await page.getByRole('button', { name: 'Commencer sans habitude' }).click();

    // Devrait rediriger vers la page principale
    await expect(page).toHaveURL('/');

    // L'onboarding devrait être marqué comme complété
    const onboardingCompleted = await page.evaluate(() => {
      const data = localStorage.getItem('doucement_data');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.preferences?.onboardingCompleted;
      }
      return false;
    });
    expect(onboardingCompleted).toBe(true);
  });

  test('revenir de l\'écran suggestions vers l\'intro', async ({ page }) => {
    // Naviguer jusqu'à l'écran des suggestions (3 intro steps)
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Choisir mes habitudes' }).click();

    // Revenir à l'étape précédente
    await page.getByRole('button', { name: /Retour|Précédent/i }).click();
    await expect(page.getByRole('heading', { name: 'Chaque effort compte' })).toBeVisible();
  });

  test('l\'EmptyState permet d\'accéder aux paramètres sans habitude', async ({ page }) => {
    // Compléter l'onboarding rapidement
    await page.getByRole('button', { name: 'Passer l\'introduction' }).click();
    await expect(page).toHaveURL('/');

    // Vérifier qu'on est sur l'EmptyState
    await expect(page.getByRole('heading', { name: 'Tout commence par une habitude' })).toBeVisible();

    // Vérifier que le lien Paramètres est visible et fonctionnel
    const settingsLink = page.getByRole('link', { name: 'Paramètres' });
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    // Devrait être sur la page des paramètres
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible();
  });
});
