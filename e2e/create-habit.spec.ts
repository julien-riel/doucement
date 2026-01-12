import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le wizard de création d'habitude
 * Vérifie la création d'habitudes de différents types avec le wizard 5 étapes
 * (Choose → Type → Details → Intentions → Confirm)
 */

test.describe('Création d\'habitude', () => {
  test.beforeEach(async ({ page }) => {
    // Injecter le localStorage AVANT que la page charge pour éviter la redirection vers onboarding
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 3,
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true }
      }));
    });
    // Naviguer directement vers /create - le localStorage sera lu au chargement
    await page.goto('/create');
    // Attendre que la page de création soit chargée
    await page.waitForSelector('text=Nouvelle habitude');
  });

  test('affiche l\'étape de choix avec suggestions et option personnalisée', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Nouvelle habitude' })).toBeVisible();
    await expect(page.getByText('Choisis une habitude à fort impact ou crée la tienne')).toBeVisible();

    // Vérifier la section des suggestions
    await expect(page.getByText('Habitudes à fort impact')).toBeVisible();
    await expect(page.getByText('Basées sur la science')).toBeVisible();

    // Vérifier les filtres de catégorie
    await expect(page.getByRole('button', { name: 'Top 6' })).toBeVisible();

    // Vérifier le bouton pour créer une habitude personnalisée
    await expect(page.getByRole('button', { name: /Créer une habitude personnalisée/ })).toBeVisible();
  });

  test('sélectionner une suggestion pré-remplit le formulaire', async ({ page }) => {
    // Cliquer sur une habitude suggérée (Marche quotidienne par exemple)
    await page.locator('.suggested-habit-card').first().click();

    // Devrait passer directement à l'étape intentions (les détails sont pré-remplis)
    await expect(page.getByText('Quand et où ?')).toBeVisible();
  });

  test('créer une habitude personnalisée affiche l\'étape type', async ({ page }) => {
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    await expect(page.getByText('Quel type d\'habitude souhaitez-vous créer ?')).toBeVisible();

    // Vérifier les 3 options de type
    await expect(page.getByRole('button', { name: /Augmenter/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Réduire/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Maintenir/ })).toBeVisible();

    // Le bouton Continuer devrait être désactivé tant qu'aucun type n'est sélectionné
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  test('sélectionner un type active le bouton Continuer', async ({ page }) => {
    // Passer l'étape choose
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    await page.getByRole('button', { name: /Augmenter/ }).click();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
  });

  test('création complète d\'une habitude "Augmenter"', async ({ page }) => {
    // Étape Choose: Aller vers personnalisé
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    // Étape 1: Choisir le type
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails
    await expect(page.getByText('Décrivez votre habitude')).toBeVisible();

    // Vérifier que l'emoji par défaut est affiché
    await expect(page.locator('.emoji-picker__current')).toHaveText('💪');

    // Remplir le formulaire
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Push-ups');
    await page.getByRole('textbox', { name: 'Unité' }).fill('répétitions');

    // Le bouton Continuer devrait être actif avec les champs remplis
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeEnabled();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Implementation Intentions (optionnel)
    await expect(page.getByText('Quand et où ?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeVisible();

    // Sélectionner un déclencheur suggéré
    await page.getByRole('button', { name: 'Après mon café du matin' }).click();
    await expect(page.getByRole('textbox', { name: 'Après quoi ?' })).toHaveValue('Après mon café du matin');

    // Remplir le lieu
    await page.getByRole('textbox', { name: 'Où ?' }).fill('Salon');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 4: Identity (optionnel)
    await expect(page.getByText('Qui voulez-vous devenir ?')).toBeVisible();
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 5: Confirmation
    await expect(page.getByText('Vérifiez et confirmez')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('Augmenter')).toBeVisible();
    await expect(page.getByText('1 répétitions')).toBeVisible();
    await expect(page.getByText('+5% par semaine')).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Étape first-checkin: Première victoire ?
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Devrait rediriger vers l'écran principal
    await expect(page).toHaveURL('/');

    // L'habitude devrait être visible sur l'écran principal
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();
  });

  test('création d\'une habitude "Réduire"', async ({ page }) => {
    // Étape Choose: Aller vers personnalisé
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    // Étape 1: Choisir le type Réduire
    await page.getByRole('button', { name: /Réduire/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails (on garde l'emoji par défaut)
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Cigarettes');
    await page.getByRole('textbox', { name: 'Unité' }).fill('cigarettes');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Passer les intentions (optionnel)
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 4: Passer l'identity (optionnel)
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 5: Confirmation
    await expect(page.getByText('Réduire')).toBeVisible();
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Étape first-checkin: Première victoire ?
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Cigarettes' })).toBeVisible();
  });

  test('création d\'une habitude "Maintenir"', async ({ page }) => {
    // Étape Choose: Aller vers personnalisé
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    // Étape 1: Choisir le type Maintenir
    await page.getByRole('button', { name: /Maintenir/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Détails (pas de section progression pour Maintenir, on garde l'emoji par défaut)
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Eau');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('8');
    await page.getByRole('textbox', { name: 'Unité' }).fill('verres');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Intentions
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 4: Identity
    await page.getByRole('button', { name: 'Aperçu' }).click();

    // Étape 5: Confirmation
    await expect(page.getByText('Maintenir')).toBeVisible();
    await expect(page.getByText('8 verres', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Étape first-checkin: Première victoire ?
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Eau' })).toBeVisible();
  });

  test('navigation avec bouton Retour', async ({ page }) => {
    // Passer l'étape choose
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    // Aller à l'étape 2 (details)
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Décrivez votre habitude')).toBeVisible();

    // Revenir à l'étape type
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page.getByText('Quel type d\'habitude souhaitez-vous créer ?')).toBeVisible();

    // Revenir à l'étape choose
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page.getByText('Choisis une habitude à fort impact ou crée la tienne')).toBeVisible();
  });

  test('changer d\'emoji', async ({ page }) => {
    // Passer l'étape choose
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Emoji par défaut
    await expect(page.locator('.emoji-picker__current')).toHaveText('💪');

    // Ouvrir le picker et changer d'emoji
    await page.locator('.emoji-picker__trigger').click();
    await expect(page.locator('.emoji-picker__dropdown')).toBeVisible();

    // Sélectionner un emoji différent (le 3ème visible - 😊)
    const emojiButtons = page.locator('.emoji-picker__dropdown button.epr-emoji');
    await emojiButtons.nth(2).click();

    // Vérifier que l'emoji a changé (pas 💪)
    await expect(page.locator('.emoji-picker__current')).not.toHaveText('💪');
    await expect(page.locator('.emoji-picker__dropdown')).not.toBeVisible();
  });

  test('changer le mode de progression (% vs unités)', async ({ page }) => {
    // Passer l'étape choose
    await page.getByRole('button', { name: /Créer une habitude personnalisée/ }).click();

    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Par défaut en %
    await expect(page.getByRole('spinbutton', { name: 'Pourcentage' })).toBeVisible();

    // Changer en unités
    await page.getByRole('button', { name: 'En unités' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Unités' })).toBeVisible();
  });

  test('filtrer les suggestions par catégorie', async ({ page }) => {
    // Vérifier que les filtres existent
    await expect(page.getByRole('button', { name: 'Top 6' })).toBeVisible();
    await expect(page.getByRole('button', { name: '😴' })).toBeVisible(); // Sommeil

    // Cliquer sur le filtre sommeil
    await page.getByRole('button', { name: '😴' }).click();

    // Les habitudes de sommeil devraient être visibles
    await expect(page.getByText('Se coucher à heure fixe')).toBeVisible();
  });
});
