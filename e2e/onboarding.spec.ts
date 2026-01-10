import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le parcours d'onboarding
 * Vérifie la navigation à travers les 4 écrans, le skip, et la complétion
 */

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Effacer le localStorage avant chaque test pour avoir un état propre
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/onboarding');
    // Attendre que la page charge
    await page.waitForSelector('h1:has-text("Bienvenue")');
  });

  test('affiche le premier écran de bienvenue', async ({ page }) => {
    // Vérifier le contenu du premier écran
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.getByText('Doucement vous aide à améliorer vos habitudes progressivement')).toBeVisible();
    await expect(page.getByText('🌱')).toBeVisible();

    // Vérifier les indicateurs d'étapes
    await expect(page.getByRole('tab', { name: 'Étape 1 sur 4' })).toHaveAttribute('aria-selected', 'true');

    // Vérifier les boutons
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Passer l\'introduction' })).toBeVisible();
    // Pas de bouton Retour sur le premier écran
    await expect(page.getByRole('button', { name: /Retour|précédente/i })).not.toBeVisible();
  });

  test('navigation complète à travers les 4 étapes', async ({ page }) => {
    // Étape 1: Bienvenue
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 2: La dose du jour
    await expect(page.getByRole('heading', { name: 'La dose du jour' })).toBeVisible();
    await expect(page.getByText('Oubliez les objectifs intimidants')).toBeVisible();
    await expect(page.getByText('📊')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étape 2 sur 4' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('button', { name: /Retour|précédente/i })).toBeVisible();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 3: Progression douce
    await expect(page.getByRole('heading', { name: 'Progression douce' })).toBeVisible();
    await expect(page.getByText('l\'effet composé fait le travail')).toBeVisible();
    await expect(page.getByText('📈')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étape 3 sur 4' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Étape 4: Chaque effort compte
    await expect(page.getByRole('heading', { name: 'Chaque effort compte' })).toBeVisible();
    await expect(page.getByText('70% c\'est une victoire')).toBeVisible();
    await expect(page.getByText('💚')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étape 4 sur 4' })).toHaveAttribute('aria-selected', 'true');
    // Le bouton "Passer l'introduction" disparaît sur la dernière étape
    await expect(page.getByRole('button', { name: 'Passer l\'introduction' })).not.toBeVisible();
    // Le bouton devient "Commencer"
    await expect(page.getByRole('button', { name: 'Commencer' })).toBeVisible();
  });

  test('permet de revenir en arrière avec le bouton Retour', async ({ page }) => {
    // Aller à l'étape 2
    await page.getByRole('button', { name: 'Suivant' }).click();
    await expect(page.getByRole('heading', { name: 'La dose du jour' })).toBeVisible();

    // Revenir à l'étape 1
    await page.getByRole('button', { name: /Retour|précédente/i }).click();
    await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étape 1 sur 4' })).toHaveAttribute('aria-selected', 'true');
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

  test('compléter l\'onboarding redirige vers l\'écran principal', async ({ page }) => {
    // Naviguer jusqu'à la fin
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();
    await page.getByRole('button', { name: 'Suivant' }).click();

    // Cliquer sur Commencer
    await page.getByRole('button', { name: 'Commencer' }).click();

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
