import { test, expect } from './base-test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  setupLocalStorage,
  createMixedHabitsData,
  createAppData,
  createIncreaseHabit,
  createEntry,
  createPreferences,
  createEmptyAppData,
  SettingsPage,
  TestAppData,
} from './fixtures';

/**
 * Tests E2E pour l'import/export de données
 * Fonctionnalité critique pour backup/restore
 */

test.describe('Export de données', () => {
  let tempDir: string;

  test.beforeAll(() => {
    // Create temp directory for downloads
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doucement-e2e-'));
  });

  test.afterAll(() => {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    const testData = createMixedHabitsData();
    await setupLocalStorage(page, testData);
  });

  test('exporte les données en fichier JSON', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    // Déclencher l'export
    const download = await settingsPage.exportData();

    // Vérifier le nom du fichier
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^doucement-export-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/);

    // La réussite de l'export est confirmée par le téléchargement du fichier
  });

  test('le fichier exporté contient des données valides', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    // Export et récupérer le JSON
    const exportedData = (await settingsPage.exportDataAsJson()) as TestAppData;

    // Vérifier la structure
    expect(exportedData).toHaveProperty('schemaVersion');
    expect(exportedData).toHaveProperty('habits');
    expect(exportedData).toHaveProperty('entries');
    expect(exportedData).toHaveProperty('preferences');

    // Vérifier les habitudes (créées par createMixedHabitsData)
    expect(exportedData.habits.length).toBe(3);
    expect(exportedData.habits[0]).toHaveProperty('id');
    expect(exportedData.habits[0]).toHaveProperty('name');
    expect(exportedData.habits[0]).toHaveProperty('direction');
  });

  test('le fichier exporté peut être réimporté', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    // Export vers un fichier
    const download = await settingsPage.exportData();
    const filePath = path.join(tempDir, 'export-test.json');
    await download.saveAs(filePath);

    // Vider les données locales
    await page.evaluate(() => {
      localStorage.removeItem('doucement_data');
    });

    // Recharger la page et aller dans settings
    await settingsPage.goto();

    // Import le fichier
    await settingsPage.importData(filePath);

    // Confirmer l'import
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier le message de succès
    await expect(page.getByText(/Import réussi|3 habitude/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Import de données', () => {
  let tempDir: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doucement-e2e-import-'));
  });

  test.afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Note: We don't use setupLocalStorage in beforeEach here because import tests
  // need to persist data across navigation. Instead, each test sets up its own data
  // using page.evaluate() which doesn't interfere with subsequent navigations.

  test('importe un fichier JSON valide', async ({ page }) => {
    // Setup empty data (using evaluate, not addInitScript)
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 10, habits: [], entries: [], preferences: { onboardingCompleted: true }
      }));
    });
    await page.reload();
    await page.waitForSelector('.page-settings');

    // Créer un fichier de test valide
    const importData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'imported-habit-1',
          name: 'Habitude Importée',
          emoji: '📚',
          startValue: 10,
          unit: 'pages',
        }),
      ],
      entries: [
        createEntry({
          id: 'imported-entry-1',
          habitId: 'imported-habit-1',
          date: '2026-01-10',
          targetDose: 10,
          actualValue: 12,
        }),
      ],
    });

    const filePath = path.join(tempDir, 'valid-import.json');
    fs.writeFileSync(filePath, JSON.stringify(importData, null, 2));

    const settingsPage = new SettingsPage(page);
    // Already on settings page from setup above

    // Import
    await settingsPage.importData(filePath);

    // Confirmer l'import
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier le succès
    await expect(page.getByText(/Import réussi|1 habitude/i).first()).toBeVisible({ timeout: 10000 });

    // Fermer la modale et continuer
    await page.getByRole('button', { name: /Continuer|Continue/i }).click();

    // Vérifier que l'habitude est visible sur la page Today (SPA navigation)
    await page.getByRole('link', { name: /Aujourd'hui|Today/i }).click();
    await expect(page.getByRole('heading', { name: 'Habitude Importée' })).toBeVisible();
  });

  test('affiche une erreur pour un JSON invalide', async ({ page }) => {
    // Setup empty data
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 10, habits: [], entries: [], preferences: { onboardingCompleted: true }
      }));
    });
    await page.reload();
    await page.waitForSelector('.page-settings');

    // Créer un fichier JSON invalide (pas un objet valide)
    const filePath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(filePath, '{ invalid json }');

    const settingsPage = new SettingsPage(page);

    // Import
    await settingsPage.importData(filePath);

    // Confirmer l'import
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier le message d'erreur
    await expect(page.getByText(/invalide|erreur|échoué/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('affiche une erreur pour un schéma invalide', async ({ page }) => {
    // Setup empty data
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 10, habits: [], entries: [], preferences: { onboardingCompleted: true }
      }));
    });
    await page.reload();
    await page.waitForSelector('.page-settings');

    // Créer un fichier avec structure invalide (manque schemaVersion)
    const invalidData = {
      habits: [],
      entries: [],
      // schemaVersion manquant
    };

    const filePath = path.join(tempDir, 'invalid-schema.json');
    fs.writeFileSync(filePath, JSON.stringify(invalidData, null, 2));

    const settingsPage = new SettingsPage(page);

    // Import
    await settingsPage.importData(filePath);

    // Confirmer l'import
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier le message d'erreur
    await expect(page.getByText(/invalide|erreur|schemaVersion/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('migre automatiquement une ancienne version', async ({ page }) => {
    // Setup empty data
    await page.goto('/settings', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem('doucement_data', JSON.stringify({
        schemaVersion: 10, habits: [], entries: [], preferences: { onboardingCompleted: true }
      }));
    });
    await page.reload();
    await page.waitForSelector('.page-settings');

    // Créer un fichier avec une ancienne version du schéma
    const oldVersionData = {
      schemaVersion: 3, // Ancienne version
      habits: [
        {
          id: 'old-habit',
          name: 'Ancienne Habitude',
          emoji: '🏃',
          direction: 'increase',
          startValue: 5,
          unit: 'km',
          progression: { mode: 'absolute', value: 1, period: 'weekly' },
          createdAt: '2025-01-01',
          archivedAt: null,
          trackingMode: 'detailed',
        },
      ],
      entries: [],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' },
        },
      },
    };

    const filePath = path.join(tempDir, 'old-version.json');
    fs.writeFileSync(filePath, JSON.stringify(oldVersionData, null, 2));

    const settingsPage = new SettingsPage(page);
    // Already on settings page from setup above

    // Import
    await settingsPage.importData(filePath);

    // Confirmer l'import
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier le succès (migration automatique)
    await expect(page.getByText(/Import réussi|migration/i).first()).toBeVisible({ timeout: 10000 });

    // Fermer et vérifier que l'habitude est présente (SPA navigation)
    await page.getByRole('button', { name: /Continuer|Continue/i }).click();
    await page.getByRole('link', { name: /Aujourd'hui|Today/i }).click();
    await expect(page.getByRole('heading', { name: 'Ancienne Habitude' })).toBeVisible();
  });
});

test.describe('Cycle complet import/export', () => {
  let tempDir: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doucement-e2e-cycle-'));
  });

  test.afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('préserve toutes les données dans un cycle export → import', async ({ page }) => {
    // Setup initial avec données complètes
    const originalData = createAppData({
      habits: [
        createIncreaseHabit({
          id: 'habit-pushups',
          name: 'Push-ups',
          emoji: '💪',
          startValue: 10,
          unit: 'répétitions',
          targetValue: 50,
          identityStatement: 'fait du sport régulièrement',
        }),
        createIncreaseHabit({
          id: 'habit-reading',
          name: 'Lecture',
          emoji: '📚',
          startValue: 20,
          unit: 'pages',
          targetValue: 100,
        }),
      ],
      entries: [
        createEntry({
          id: 'entry-1',
          habitId: 'habit-pushups',
          date: '2026-01-10',
          targetDose: 10,
          actualValue: 15,
        }),
        createEntry({
          id: 'entry-2',
          habitId: 'habit-reading',
          date: '2026-01-10',
          targetDose: 20,
          actualValue: 25,
        }),
      ],
      preferences: createPreferences({
        theme: 'dark',
      }),
    });

    await setupLocalStorage(page, originalData);

    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    // Step 1: Export
    const download = await settingsPage.exportData();
    const filePath = path.join(tempDir, 'full-cycle.json');
    await download.saveAs(filePath);

    // Step 2: Vider le localStorage
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem(
        'doucement_data',
        JSON.stringify({
          schemaVersion: 10,
          habits: [],
          entries: [],
          preferences: { onboardingCompleted: true },
        })
      );
    });

    // Step 3: Recharger et vérifier que c'est vide
    await settingsPage.goto();

    // Step 4: Import
    await settingsPage.importData(filePath);
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();
    await expect(page.getByText(/Import réussi|2 habitude/i).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Continuer|Continue/i }).click();

    // Step 5: Vérifier les données restaurées sur Today (SPA navigation)
    await page.getByRole('link', { name: /Aujourd'hui|Today/i }).click();
    await page.waitForSelector('h3:has-text("Push-ups")');

    await expect(page.getByRole('heading', { name: 'Push-ups' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lecture' })).toBeVisible();
    await expect(page.getByText('💪').first()).toBeVisible();
    await expect(page.getByText('📚').first()).toBeVisible();

    // Vérifier que les doses calculées sont affichées (progression depuis les entrées)
    // Note: Today page shows today's calculated dose, not historical entry values
    await expect(page.getByText(/répétitions|pages/).first()).toBeVisible();
  });

  test('restaure correctement les préférences de thème', async ({ page }) => {
    // Setup avec thème dark
    const dataWithDarkTheme = createAppData({
      habits: [createIncreaseHabit({ name: 'Test Habit' })],
      preferences: createPreferences({
        theme: 'dark',
      }),
    });

    await setupLocalStorage(page, dataWithDarkTheme);

    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    // Export
    const download = await settingsPage.exportData();
    const filePath = path.join(tempDir, 'theme-test.json');
    await download.saveAs(filePath);

    // Changer vers light et vider
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('doucement-language', 'fr');
      localStorage.setItem(
        'doucement_data',
        JSON.stringify({
          schemaVersion: 10,
          habits: [],
          entries: [],
          preferences: { onboardingCompleted: true, theme: 'light' },
        })
      );
    });

    // Import
    await settingsPage.goto();
    await settingsPage.importData(filePath);
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();
    await expect(page.getByText(/Import réussi/i).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Continuer|Continue/i }).click();

    // Vérifier que le thème dark est restauré
    await settingsPage.goto();
    await settingsPage.expectTheme('dark');
  });
});

test.describe('Gestion des erreurs d\'import', () => {
  let tempDir: string;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doucement-e2e-errors-'));
  });

  test.afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    await setupLocalStorage(page, createEmptyAppData());
  });

  test('rejette un fichier non-JSON', async ({ page }) => {
    // Créer un fichier texte
    const filePath = path.join(tempDir, 'not-json.txt');
    fs.writeFileSync(filePath, 'This is not JSON');

    // Renommer en .json pour tester
    const jsonPath = path.join(tempDir, 'fake.json');
    fs.copyFileSync(filePath, jsonPath);

    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    await settingsPage.importData(jsonPath);
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier l'erreur
    await expect(page.getByText(/invalide|erreur|JSON/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('rejette un fichier avec des habitudes invalides', async ({ page }) => {
    // Créer un fichier avec une habitude invalide (direction manquante)
    const invalidHabitData = {
      schemaVersion: 10,
      habits: [
        {
          id: 'bad-habit',
          name: 'Habitude Invalide',
          // direction manquante
          startValue: 10,
          unit: 'fois',
        },
      ],
      entries: [],
      preferences: {
        onboardingCompleted: true,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' },
        },
      },
    };

    const filePath = path.join(tempDir, 'invalid-habit.json');
    fs.writeFileSync(filePath, JSON.stringify(invalidHabitData, null, 2));

    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();

    await settingsPage.importData(filePath);
    await page.getByRole('button', { name: 'Importer', exact: true }).or(page.getByRole('button', { name: 'Import', exact: true })).click();

    // Vérifier l'erreur
    await expect(page.getByText(/invalide|erreur|direction/i).first()).toBeVisible({ timeout: 10000 });
  });
});
