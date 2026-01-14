import { test, expect } from './base-test';
import {
  setupLocalStorage,
  createEditTestData,
  createAppData,
  createIncreaseHabit,
  createDecreaseHabit,
  createMaintainHabit,
  EditHabitPage,
  TodayPage,
} from './fixtures';

/**
 * Tests E2E pour l'édition des habitudes
 * Vérifie que toutes les propriétés modifiables peuvent être éditées correctement
 *
 * Refactorisé pour utiliser les fixtures centralisées et Page Objects
 *
 * Propriétés testées:
 * - trackingFrequency (daily/weekly)
 * - entryMode (replace/cumulative)
 * - trackingMode (simple/detailed)
 * - identityStatement
 * - description
 * - Désactivation habit stacking pour decrease
 */

// Données de test créées via factories
const createIncreaseHabitTestData = () =>
  createAppData({
    habits: [
      createIncreaseHabit({
        id: 'habit-edit-test-increase',
        name: 'Push-ups test',
        emoji: '💪',
        startValue: 10,
        unit: 'répétitions',
        targetValue: 50,
        trackingMode: 'detailed',
        trackingFrequency: 'daily',
        entryMode: 'replace',
      }),
      createMaintainHabit({
        id: 'habit-anchor',
        name: 'Café matinal',
        emoji: '☕',
        startValue: 1,
        unit: 'tasse',
      }),
    ],
  });

const createDecreaseHabitTestData = () =>
  createAppData({
    habits: [
      createDecreaseHabit({
        id: 'habit-edit-test-decrease',
        name: 'Cigarettes',
        emoji: '🚭',
        startValue: 10,
        unit: 'cigarettes',
        targetValue: 0,
        trackingMode: 'detailed',
        trackingFrequency: 'daily',
        entryMode: 'replace',
      }),
      createIncreaseHabit({
        id: 'habit-anchor-decrease',
        name: 'Autre habitude',
        emoji: '🎯',
        startValue: 5,
        unit: 'fois',
      }),
    ],
  });

test.describe('Édition d\'habitude - Propriétés de base', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
    await page.goto('/');
    await page.waitForSelector('h3:has-text("Push-ups test")');
  });

  test('accède à la page d\'édition depuis la page détail', async ({ page }) => {
    // Aller à la page Habitudes (liste des habitudes)
    await page.getByRole('link', { name: 'Habitudes' }).click();
    await expect(page).toHaveURL('/habits');

    // Cliquer sur l'habitude dans la liste
    await page.getByRole('button', { name: 'Voir les détails de Push-ups test' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase/);

    // Cliquer sur le bouton modifier
    await page.getByRole('button', { name: 'Modifier' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase\/edit/);

    // Vérifier que le formulaire s'affiche
    const editPage = new EditHabitPage(page);
    await editPage.expectLoaded();
    await expect(editPage.nameInput).toHaveValue('Push-ups test');
  });

  test('modifie le nom et sauvegarde', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Modifier le nom
    await editPage.setName('Push-ups quotidiens');

    // Vérifier et sauvegarder
    await editPage.expectSaveEnabled();
    await editPage.saveAndExpectSuccess();

    // Vérifier la redirection et le nouveau nom
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
    await expect(page.getByRole('heading', { name: 'Push-ups quotidiens' })).toBeVisible();
  });

  test('modifie la description', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Ajouter une description
    await editPage.setDescription('Ma routine quotidienne de renforcement');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});

test.describe('Édition d\'habitude - Fréquence de suivi', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('affiche les options de fréquence de suivi', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await expect(page.getByText('Fréquence de suivi')).toBeVisible();
    await expect(editPage.getFrequencyOption('daily')).toBeVisible();
    await expect(editPage.getFrequencyOption('weekly')).toBeVisible();
  });

  test('change la fréquence de daily à weekly', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier que daily est sélectionné initialement
    await editPage.expectFrequency('daily');

    // Changer vers weekly
    await editPage.setFrequency('weekly');
    await editPage.expectFrequency('weekly');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });
});

test.describe('Édition d\'habitude - Mode de suivi', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('affiche les options de mode de suivi', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await expect(page.getByText('Mode de suivi')).toBeVisible();
    await expect(editPage.getTrackingModeOption('simple')).toBeVisible();
    await expect(editPage.getTrackingModeOption('detailed')).toBeVisible();
  });

  test('change le mode de detailed à simple', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier que detailed est sélectionné initialement
    await editPage.expectTrackingMode('detailed');

    // Changer vers simple
    await editPage.setTrackingMode('simple');
    await editPage.expectTrackingMode('simple');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});

test.describe('Édition d\'habitude - Mode de saisie', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('affiche les options de mode de saisie', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await expect(page.getByText('Mode de saisie')).toBeVisible();
    await expect(editPage.getEntryModeOption('replace')).toBeVisible();
    await expect(editPage.getEntryModeOption('cumulative')).toBeVisible();
  });

  test('change le mode de replace à cumulative', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier que replace est sélectionné initialement
    await editPage.expectEntryMode('replace');

    // Changer vers cumulative
    await editPage.setEntryMode('cumulative');
    await editPage.expectEntryMode('cumulative');

    // Vérifier l'affichage du hint cumulative
    await expect(page.getByText(/additionnent/)).toBeVisible();

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});

test.describe('Édition d\'habitude - Déclaration d\'identité', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('affiche la section identité avec suggestions', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await expect(page.getByText('Qui voulez-vous devenir ?')).toBeVisible();
    await expect(editPage.identityInput).toBeVisible();
    // Vérifier qu'il y a des suggestions
    await expect(page.locator('.edit-habit__identity-suggestion').first()).toBeVisible();
  });

  test('ajoute une déclaration d\'identité personnalisée', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await editPage.setIdentityStatement('fait du sport tous les jours');

    // Vérifier l'aperçu
    await editPage.expectIdentityPreview('fait du sport tous les jours');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });

  test('sélectionne une suggestion d\'identité', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Cliquer sur une suggestion
    const firstSuggestion = page.locator('.edit-habit__identity-suggestion').first();
    const suggestionText = await firstSuggestion.textContent();
    await editPage.selectIdentitySuggestion(0);

    // Vérifier que le champ est rempli
    await expect(editPage.identityInput).toHaveValue(suggestionText || '');

    // Vérifier que la suggestion est visuellement sélectionnée
    await expect(firstSuggestion).toHaveClass(/--selected/);
  });
});

test.describe('Édition d\'habitude - Habit Stacking', () => {
  test('affiche le sélecteur d\'ancrage pour habitude increase', async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());

    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // La section habit stacking doit être visible pour increase
    expect(await editPage.isHabitStackingVisible()).toBe(true);
    await expect(editPage.anchorSelector).toBeVisible();

    // Vérifier que l'habitude ancre est disponible dans le select
    const options = await editPage.getAnchorOptions();
    expect(options).toContain('☕ Café matinal');
  });

  test('ne PAS afficher le sélecteur d\'ancrage pour habitude decrease', async ({ page }) => {
    await setupLocalStorage(page, createDecreaseHabitTestData());

    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-decrease');

    // La section habit stacking ne doit PAS être visible pour decrease
    expect(await editPage.isHabitStackingVisible()).toBe(false);
  });

  test('sélectionne une habitude d\'ancrage', async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());

    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Sélectionner l'habitude d'ancrage
    await editPage.selectAnchorHabit('habit-anchor');

    // Vérifier que la sélection est effectuée
    await expect(editPage.anchorSelector).toHaveValue('habit-anchor');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});

test.describe('Édition d\'habitude - Validation et UX', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('bouton enregistrer désactivé si aucun changement', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await editPage.expectSaveDisabled();
  });

  test('bouton enregistrer désactivé si nom vide', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await editPage.nameInput.clear();

    await editPage.expectSaveDisabled();
  });

  test('affiche la valeur de départ non modifiable', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier la carte d'info readonly avec la valeur de départ
    await expect(page.getByText('Valeur de départ')).toBeVisible();
    await expect(page.getByText('Cette valeur ne peut pas être modifiée')).toBeVisible();
    // Vérifier la valeur de départ dans la carte info
    await expect(page.locator('.edit-habit__info-value').filter({ hasText: '10 répétitions' })).toBeVisible();
  });

  test('annuler retourne à la page détail', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await editPage.cancel();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });

  test('clic sur flèche retour annule et retourne', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    await editPage.goBack();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });
});

test.describe('Édition d\'habitude - Progression (sauf maintain)', () => {
  test('permet de modifier la progression pour increase', async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());

    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier que la section progression est visible
    expect(await editPage.isProgressionVisible()).toBe(true);

    // Modifier la valeur de progression
    await editPage.setProgressionValue(5);

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });

  test('permet de changer le mode de progression', async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());

    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Changer de absolute à percentage
    await editPage.setProgressionMode('percentage');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});

test.describe('Édition d\'habitude - Emoji', () => {
  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createIncreaseHabitTestData());
  });

  test('permet de changer l\'emoji', async ({ page }) => {
    const editPage = new EditHabitPage(page);
    await editPage.goto('habit-edit-test-increase');

    // Vérifier que l'emoji actuel est affiché
    const currentEmoji = await editPage.getEmoji();
    expect(currentEmoji).toBe('💪');

    // Ouvrir le picker et sélectionner un autre emoji
    await editPage.selectEmoji(2);

    // Vérifier que le nouvel emoji est affiché (pas 💪)
    const newEmoji = await editPage.getEmoji();
    expect(newEmoji).not.toBe('💪');

    // Sauvegarder
    await editPage.saveAndExpectSuccess();
  });
});
