import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le check-in quotidien
 * Vérifie les boutons Un peu / Fait ! / Encore + sur l'écran Aujourd'hui
 */

test.describe('Check-in quotidien', () => {
  test.beforeEach(async ({ page }) => {
    // Créer un état avec une habitude pour tester le check-in
    // D'abord créer l'habitude via l'interface pour éviter les problèmes de synchronisation
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => {
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 3,
        habits: [],
        entries: [],
        preferences: { onboardingCompleted: true }
      }));
    });

    // Créer une habitude via le wizard
    await page.goto('/create');
    await page.getByRole('button', { name: /Augmenter/ }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('textbox', { name: 'Nom de l\'habitude' }).fill('Push-ups');
    await page.getByRole('textbox', { name: 'Unité' }).fill('répétitions');
    await page.getByRole('spinbutton', { name: 'Dose de départ' }).fill('10');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Aperçu' }).click();
    await page.getByRole('button', { name: 'Créer l\'habitude' }).click();

    // Attendre d'être sur la page principale avec l'habitude
    await page.waitForSelector('h3:has-text("Push-ups")');
  });

  test('affiche l\'écran Aujourd\'hui avec les habitudes', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Aujourd\'hui' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByText('💪')).toBeVisible();

    // Vérifier les boutons de check-in
    await expect(page.getByRole('button', { name: 'Un peu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fait !' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore +' })).toBeVisible();

    // Vérifier le pourcentage initial (0%)
    await expect(page.getByRole('status', { name: /complété/ })).toContainText('0%');
  });

  test('check-in avec "Fait !" marque l\'habitude comme complétée', async ({ page }) => {
    await page.getByRole('button', { name: 'Fait !' }).click();

    // Le bouton devrait montrer qu'il est actif/sélectionné
    await expect(page.getByRole('button', { name: /Fait/ })).toBeVisible();

    // Le pourcentage devrait passer à 100%
    await expect(page.getByRole('status', { name: /complété/ })).toContainText('100%');

    // Vérifier que le statut "Complété" est affiché
    await expect(page.getByText('Complété')).toBeVisible();
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
    await page.getByRole('button', { name: 'Un peu' }).click();

    // Saisir une valeur partielle
    await page.getByRole('spinbutton', { name: /répétitions/i }).fill('5');

    // Le bouton Valider devrait être actif
    await expect(page.getByRole('button', { name: 'Valider' })).toBeEnabled();
    await page.getByRole('button', { name: 'Valider' }).click();

    // L'entrée devrait être enregistrée
    await expect(page.getByText(/5 \/ 10/)).toBeVisible();
  });

  test('annuler la saisie "Un peu"', async ({ page }) => {
    await page.getByRole('button', { name: 'Un peu' }).click();
    await page.getByRole('spinbutton', { name: /répétitions/i }).fill('3');

    // Annuler
    await page.getByRole('button', { name: 'Annuler' }).click();

    // Les boutons de check-in devraient réapparaître
    await expect(page.getByRole('button', { name: 'Un peu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fait !' })).toBeVisible();
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
    await page.getByRole('button', { name: 'Encore +' }).click();

    // Modifier la valeur pour un grand dépassement
    await page.getByRole('spinbutton', { name: /répétitions/i }).fill('15');
    await page.getByRole('button', { name: 'Valider' }).click();

    // Devrait afficher le dépassement
    await expect(page.getByText(/15 \/ 10/)).toBeVisible();
  });

  test('modifier un check-in existant', async ({ page }) => {
    // Premier check-in
    await page.getByRole('button', { name: 'Fait !' }).click();
    await expect(page.getByText('Complété')).toBeVisible();

    // Modifier avec "Un peu"
    await page.getByRole('button', { name: 'Un peu' }).click();
    await page.getByRole('spinbutton', { name: /répétitions/i }).fill('7');
    await page.getByRole('button', { name: 'Valider' }).click();

    // La nouvelle valeur devrait être affichée
    await expect(page.getByText(/7 \/ 10/)).toBeVisible();
  });
});

test.describe('Check-in avec données de test', () => {
  test('charger full-scenario.json et vérifier l\'affichage', async ({ page }) => {
    // Charger les données de test
    const testDataResponse = await page.request.get('/test-data/full-scenario.json');
    const testData = await testDataResponse.json();

    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);
    // Naviguer vers / pour que l'app lise le localStorage
    await page.goto('/');
    // Attendre que la page charge
    await page.waitForSelector('h3:has-text("Push-ups")');

    // Vérifier que les habitudes du fichier de test sont affichées
    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Méditation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sucre' })).toBeVisible();
  });
});
