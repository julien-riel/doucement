import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le wizard de création d'habitude
 * Vérifie la création d'habitudes de différents types avec le wizard 4 étapes
 */

test.describe('Création d\'habitude', () => {
  test.beforeEach(async ({ page }) => {
    // Effacer le localStorage avant chaque test et compléter l'onboarding
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 3,
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true }
      }));
    });
    await page.goto('/create');
  });

  test('affiche l\'étape 1 - choix du type d\'habitude', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nouvelle habitude' })).toBeVisible();
    await expect(page.getByText('Quel type d\'habitude souhaitez-vous créer ?')).toBeVisible();

    // Vérifier les 3 options de type
    await expect(page.getByRole('button', { name: /Augmenter/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Réduire/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Maintenir/ })).toBeVisible();

    // Le bouton Continuer devrait être désactivé tant qu'aucun type n'est sélectionné
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  test('sélectionner un type active le bouton Continuer', async ({ page }) => {
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
  });

  test('création complète d\'une habitude "Augmenter"', async ({ page }) => {
    // Étape 1: Choisir le type
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails
    await expect(page.getByText('Décrivez votre habitude')).toBeVisible();

    // Vérifier que l'emoji par défaut est sélectionné
    await expect(page.getByRole('button', { name: 'Emoji 💪' })).toHaveAttribute('aria-pressed', 'true');

    // Remplir le formulaire
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Push-ups');
    await page.getByRole('textbox', { name: 'Unité' }).fill('répétitions');

    // Le bouton Continuer devrait être actif avec les champs remplis
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Implementation Intentions (optionnel)
    await expect(page.getByText('Quand et où ?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aperçu' })).toBeVisible();

    // Sélectionner un déclencheur suggéré
    await page.getByRole('button', { name: 'Après mon café du matin' }).click();
    await expect(page.getByRole('textbox', { name: 'Après quoi ?' })).toHaveValue('Après mon café du matin');

    // Remplir le lieu
    await page.getByRole('textbox', { name: 'Où ?' }).fill('Salon');

    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 4: Confirmation
    await expect(page.getByText('Vérifiez et confirmez')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('Augmenter')).toBeVisible();
    await expect(page.getByText('1 répétitions')).toBeVisible();
    await expect(page.getByText('+5% par semaine')).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Devrait rediriger vers l'écran principal
    await expect(page).toHaveURL('/');

    // L'habitude devrait être visible sur l'écran principal
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();
  });

  test('création d\'une habitude "Réduire"', async ({ page }) => {
    // Étape 1: Choisir le type Réduire
    await page.getByRole('button', { name: /Réduire/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails
    await page.getByRole('button', { name: 'Emoji 🚭' }).click();
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Cigarettes');
    await page.getByRole('textbox', { name: 'Unité' }).fill('cigarettes');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Passer les intentions (optionnel)
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 4: Confirmation
    await expect(page.getByText('Réduire')).toBeVisible();
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Cigarettes' })).toBeVisible();
  });

  test('création d\'une habitude "Maintenir"', async ({ page }) => {
    // Étape 1: Choisir le type Maintenir
    await page.getByRole('button', { name: /Maintenir/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails (pas de section progression pour Maintenir)
    await page.getByRole('button', { name: 'Emoji 💧' }).click();
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Eau');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('8');
    await page.getByRole('textbox', { name: 'Unité' }).fill('verres');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Intentions
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 4: Confirmation
    await expect(page.getByText('Maintenir')).toBeVisible();
    await expect(page.getByText('8 verres', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Eau' })).toBeVisible();
  });

  test('navigation avec bouton Retour', async ({ page }) => {
    // Aller à l'étape 2
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Décrivez votre habitude')).toBeVisible();

    // Revenir à l'étape 1
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page.getByText('Quel type d\'habitude souhaitez-vous créer ?')).toBeVisible();
  });

  test('annuler la création redirige vers l\'accueil', async ({ page }) => {
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page).toHaveURL('/');
  });

  test('changer d\'emoji', async ({ page }) => {
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Emoji par défaut
    await expect(page.getByRole('button', { name: 'Emoji 💪' })).toHaveAttribute('aria-pressed', 'true');

    // Changer d'emoji
    await page.getByRole('button', { name: 'Emoji 🧘' }).click();
    await expect(page.getByRole('button', { name: 'Emoji 🧘' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Emoji 💪' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('changer le mode de progression (% vs unités)', async ({ page }) => {
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Par défaut en %
    await expect(page.getByRole('spinbutton', { name: 'Pourcentage' })).toBeVisible();

    // Changer en unités
    await page.getByRole('button', { name: 'En unités' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Unités' })).toBeVisible();
  });
});
