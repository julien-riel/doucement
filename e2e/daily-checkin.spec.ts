import { test, expect } from './base-test';
import {
  setupLocalStorage,
  setupFreshLocalStorage,
  createEmptyAppData,
  completeHabitWizard,
  TodayPage,
} from './fixtures';

/**
 * Tests E2E pour le check-in quotidien
 * Vérifie les boutons Un peu / Fait ! / Encore + sur l'écran Aujourd'hui
 *
 * Refactorisé pour utiliser les fixtures centralisées et Page Objects
 */

test.describe('Check-in quotidien', () => {
  test.beforeEach(async ({ page }) => {
    // Utiliser les fixtures centralisées au lieu de données inline
    await setupLocalStorage(page, createEmptyAppData());

    // Créer une habitude via le wizard (utilise le helper centralisé)
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    await completeHabitWizard(page, {
      name: 'Push-ups',
      unit: 'répétitions',
      startValue: 10,
      direction: 'increase',
      skipFirstCheckIn: true,
    });

    // Attendre d'être sur la page principale avec l'habitude
    await page.waitForSelector('h3:has-text("Push-ups")');
  });

  test('affiche l\'écran Aujourd\'hui avec les habitudes', async ({ page }) => {
    const todayPage = new TodayPage(page);

    await todayPage.expectLoaded();
    await expect(todayPage.getHabitHeading('Push-ups')).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();

    // Vérifier les boutons de check-in
    const buttons = todayPage.getCheckInButtons('Push-ups');
    await expect(buttons.unPeu).toBeVisible();
    await expect(buttons.fait).toBeVisible();
    await expect(buttons.encorePlus).toBeVisible();

    // Vérifier le pourcentage initial (0%)
    await todayPage.expectCompletionPercentage(0);
  });

  test('check-in avec "Fait !" marque l\'habitude comme complétée', async ({ page }) => {
    const todayPage = new TodayPage(page);

    await todayPage.checkInDone('Push-ups');

    // Le pourcentage devrait passer à 100%
    await todayPage.expectCompletionPercentage(100);

    // Vérifier que le statut "Complété" est affiché
    await todayPage.expectHabitCompleted('Push-ups');
  });

  test('check-in avec "Un peu" ouvre le champ de saisie', async ({ page }) => {
    await page.getByRole('button', { name: 'Un peu' }).click();

    // Un champ de saisie devrait apparaître
    await expect(page.getByRole('spinbutton', { name: /répétitions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Valider' })).toBeVisible();

    // Le bouton Valider devrait être désactivé si le champ est vide
    await expect(page.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  test('saisie partielle avec "Un peu" et validation', async ({ page }) => {
    const todayPage = new TodayPage(page);

    await todayPage.checkInPartial(5, 'Push-ups');

    // L'entrée devrait être enregistrée
    await expect(page.getByText(/5 \/ 10/)).toBeVisible();
  });

  test('annuler la saisie "Un peu"', async ({ page }) => {
    const todayPage = new TodayPage(page);

    await page.getByRole('button', { name: 'Un peu' }).click();
    await page.getByRole('spinbutton', { name: /répétitions/i }).fill('3');

    // Annuler
    await todayPage.cancelCheckIn();

    // Les boutons de check-in devraient réapparaître
    const buttons = todayPage.getCheckInButtons('Push-ups');
    await expect(buttons.unPeu).toBeVisible();
    await expect(buttons.fait).toBeVisible();
  });

  test('check-in avec "Encore +" ouvre le champ avec valeur pré-remplie', async ({ page }) => {
    await page.getByRole('button', { name: 'Encore +' }).click();

    // Un champ de saisie devrait apparaître avec une valeur > dose cible
    const input = page.getByRole('spinbutton', { name: /répétitions/i });
    await expect(input).toBeVisible();

    // La valeur devrait être supérieure à la dose cible (10)
    const value = await input.inputValue();
    expect(parseInt(value)).toBeGreaterThan(10);
  });

  test('valider "Encore +" enregistre le dépassement', async ({ page }) => {
    const todayPage = new TodayPage(page);

    await todayPage.checkInExceeded(15, 'Push-ups');

    // Devrait afficher le dépassement
    await expect(page.getByText(/15 \/ 10/)).toBeVisible();
  });

  test('modifier un check-in existant', async ({ page }) => {
    const todayPage = new TodayPage(page);

    // Premier check-in
    await todayPage.checkInDone('Push-ups');
    await todayPage.expectHabitCompleted('Push-ups');

    // Modifier avec "Un peu"
    await todayPage.checkInPartial(7, 'Push-ups');

    // La nouvelle valeur devrait être affichée
    await expect(page.getByText(/7 \/ 10/)).toBeVisible();
  });
});

test.describe('Check-in avec données de test', () => {
  test('charger full-scenario.json et vérifier l\'affichage', async ({ page }) => {
    // Charger les données de test via fetch avant d'aller sur la page
    const testDataResponse = await page.request.get('http://localhost:4173/test-data/full-scenario.json');
    const testData = await testDataResponse.json();

    // Utiliser le helper de setup
    await setupLocalStorage(page, testData);

    const todayPage = new TodayPage(page);
    await todayPage.gotoAndWaitForHabit('Push-ups');

    // Vérifier que les habitudes du fichier de test sont affichées
    await expect(todayPage.getHabitHeading('Push-ups')).toBeVisible();
    await expect(todayPage.getHabitHeading('Méditation')).toBeVisible();
    await expect(todayPage.getHabitHeading('Sucre')).toBeVisible();
  });
});
