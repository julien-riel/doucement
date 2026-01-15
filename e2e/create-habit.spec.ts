import { test, expect } from './base-test';
import { setupLocalStorage, createEmptyAppData, CreateHabitPage } from './fixtures';

/**
 * Tests E2E pour le wizard de création d'habitude
 * Vérifie la création d'habitudes de différents types avec le wizard 7 étapes
 * (Choose → Type → Details → Intentions → Identity → Confirm → First Check-in)
 */

test.describe('Création d\'habitude', () => {
  let createHabitPage: CreateHabitPage;

  test.beforeEach(async ({ page }) => {
    createHabitPage = new CreateHabitPage(page);
    await setupLocalStorage(page, createEmptyAppData());
    await createHabitPage.goto();
  });

  test('affiche l\'étape de choix avec suggestions et option personnalisée', async ({ page }) => {
    await createHabitPage.expectLoaded();
    await createHabitPage.expectChooseStep();

    // Vérifier la section des suggestions
    await expect(page.getByText('Habitudes à fort impact')).toBeVisible();
    await expect(page.getByText('Basées sur la science')).toBeVisible();

    // Vérifier les filtres de catégorie
    await expect(page.getByRole('button', { name: 'Top 6' })).toBeVisible();

    // Vérifier le bouton pour créer une habitude personnalisée
    await expect(page.getByRole('button', { name: /Créer une habitude personnalisée/ })).toBeVisible();
  });

  test('sélectionner une suggestion pré-remplit le formulaire', async () => {
    // Cliquer sur une habitude suggérée (la première)
    await createHabitPage.selectSuggestedHabit(0);

    // Devrait passer directement à l'étape intentions (les détails sont pré-remplis)
    await createHabitPage.expectIntentionsStep();
  });

  test('créer une habitude personnalisée affiche l\'étape type', async () => {
    await createHabitPage.clickCreateCustomHabit();

    await createHabitPage.expectTypeStep();

    // Vérifier les 3 options de type
    await expect(createHabitPage.getTypeOption('increase')).toBeVisible();
    await expect(createHabitPage.getTypeOption('decrease')).toBeVisible();
    await expect(createHabitPage.getTypeOption('maintain')).toBeVisible();

    // Le bouton Continuer devrait être désactivé tant qu'aucun type n'est sélectionné
    await createHabitPage.expectContinueDisabled();
  });

  test('sélectionner un type active le bouton Continuer', async () => {
    await createHabitPage.clickCreateCustomHabit();
    await createHabitPage.selectType('increase');
    await createHabitPage.expectContinueEnabled();
  });

  test('création complète d\'une habitude "Augmenter"', async ({ page }) => {
    // Étape Choose: Aller vers personnalisé
    await createHabitPage.clickCreateCustomHabit();

    // Étape Type: Choisir le type
    await createHabitPage.selectType('increase');
    await createHabitPage.clickContinue();

    // Étape Details
    await createHabitPage.expectDetailsStep();

    // Vérifier que l'emoji par défaut est affiché
    const emoji = await createHabitPage.getEmoji();
    expect(emoji).toBe('💪');

    // Remplir le formulaire
    await createHabitPage.setName('Push-ups');
    await createHabitPage.setUnit('répétitions');

    // Le bouton Continuer devrait être actif avec les champs remplis
    await createHabitPage.expectContinueEnabled();
    await createHabitPage.clickContinue();

    // Étape Intentions (optionnel)
    await createHabitPage.expectIntentionsStep();

    // Sélectionner un déclencheur suggéré
    await createHabitPage.selectSuggestedTrigger('Après mon café du matin');
    await expect(createHabitPage.triggerInput).toHaveValue('Après mon café du matin');

    // Remplir le lieu
    await createHabitPage.setLocation('Salon');
    await createHabitPage.clickContinue();

    // Étape Identity (optionnel)
    await createHabitPage.expectIdentityStep();
    await createHabitPage.clickPreview();

    // Étape Confirmation
    await createHabitPage.expectConfirmStep();
    await createHabitPage.expectSummary({
      name: 'Push-ups',
      type: 'increase',
      startValue: 1,
      unit: 'répétitions',
      progression: '+5% par semaine',
    });

    // Créer l'habitude
    await createHabitPage.clickCreate();

    // Étape first-checkin: Première victoire ?
    await createHabitPage.expectFirstCheckInStep();
    await createHabitPage.skipFirstCheckIn();

    // Devrait rediriger vers l'écran principal
    await expect(page).toHaveURL('/');

    // L'habitude devrait être visible sur l'écran principal
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();
  });

  test('création d\'une habitude "Réduire"', async ({ page }) => {
    await createHabitPage.createHabitWithOptions({
      direction: 'decrease',
      name: 'Cigarettes',
      unit: 'cigarettes',
    });

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Cigarettes' })).toBeVisible();
  });

  test('création d\'une habitude "Maintenir"', async ({ page }) => {
    // Étape Choose: Aller vers personnalisé
    await createHabitPage.clickCreateCustomHabit();

    // Étape Type: Choisir le type Maintenir
    await createHabitPage.selectType('maintain');
    await createHabitPage.clickContinue();

    // Étape Details (pas de section progression pour Maintenir)
    await createHabitPage.setName('Eau');
    await createHabitPage.setStartValue(8);
    await createHabitPage.setUnit('verres');
    await createHabitPage.clickContinue();

    // Étape Intentions
    await createHabitPage.clickContinue();

    // Étape Identity
    await createHabitPage.clickPreview();

    // Étape Confirmation
    await createHabitPage.expectSummary({
      name: 'Eau',
      type: 'maintain',
      startValue: 8,
      unit: 'verres',
    });
    await createHabitPage.clickCreate();

    // Étape first-checkin
    await createHabitPage.skipFirstCheckIn();

    // Vérifier la création
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Eau' })).toBeVisible();
  });

  test('navigation avec bouton Retour', async () => {
    // Aller à l'étape type
    await createHabitPage.clickCreateCustomHabit();

    // Aller à l'étape details
    await createHabitPage.selectType('increase');
    await createHabitPage.clickContinue();
    await createHabitPage.expectDetailsStep();

    // Revenir à l'étape type
    await createHabitPage.clickBack();
    await createHabitPage.expectTypeStep();

    // Revenir à l'étape choose
    await createHabitPage.clickBack();
    await createHabitPage.expectChooseStep();
  });

  test('changer d\'emoji', async ({ page }) => {
    await createHabitPage.clickCreateCustomHabit();
    await createHabitPage.selectType('increase');
    await createHabitPage.clickContinue();

    // Emoji par défaut
    const defaultEmoji = await createHabitPage.getEmoji();
    expect(defaultEmoji).toBe('💪');

    // Changer d'emoji (sélectionner le 3ème)
    await createHabitPage.selectEmoji(2);

    // Vérifier que l'emoji a changé
    const newEmoji = await createHabitPage.getEmoji();
    expect(newEmoji).not.toBe('💪');
    await expect(page.locator('.emoji-picker__dropdown')).not.toBeVisible();
  });

  test('changer le mode de progression (% vs unités)', async ({ page }) => {
    await createHabitPage.clickCreateCustomHabit();
    await createHabitPage.selectType('increase');
    await createHabitPage.clickContinue();

    // Par défaut en %
    await expect(page.getByRole('spinbutton', { name: 'Pourcentage' })).toBeVisible();

    // Changer en unités
    await createHabitPage.setProgressionMode('absolute');
    await expect(page.getByRole('spinbutton', { name: 'Unités' })).toBeVisible();
  });

  test('filtrer les suggestions par catégorie', async ({ page }) => {
    // Vérifier que les filtres existent
    await expect(page.getByRole('button', { name: 'Top 6' })).toBeVisible();
    await expect(page.getByRole('button', { name: '😴' })).toBeVisible(); // Sommeil

    // Cliquer sur le filtre sommeil
    await createHabitPage.filterByCategory('😴');

    // Les habitudes de sommeil devraient être visibles
    await expect(page.getByText('Se coucher à heure fixe')).toBeVisible();
  });
});
