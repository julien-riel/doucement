import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'édition des habitudes
 * Vérifie que toutes les propriétés modifiables peuvent être éditées correctement
 *
 * Propriétés testées:
 * - trackingFrequency (daily/weekly)
 * - entryMode (replace/cumulative)
 * - trackingMode (simple/detailed)
 * - identityStatement
 * - description
 * - Désactivation habit stacking pour decrease
 */

// Données de test pour habitude increase (peut avoir habit stacking)
const increaseHabitData = {
  schemaVersion: 8,
  habits: [
    {
      id: 'habit-edit-test-increase',
      name: 'Push-ups test',
      emoji: '💪',
      direction: 'increase',
      startValue: 10,
      unit: 'répétitions',
      progression: { mode: 'absolute', value: 2, period: 'weekly' },
      targetValue: 50,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily',
      entryMode: 'replace',
    },
    {
      id: 'habit-anchor',
      name: 'Café matinal',
      emoji: '☕',
      direction: 'maintain',
      startValue: 1,
      unit: 'tasse',
      progression: null,
      createdAt: '2025-11-01',
      archivedAt: null,
      trackingMode: 'simple',
      trackingFrequency: 'daily',
    },
  ],
  entries: [],
  preferences: {
    onboardingCompleted: true,
    lastWeeklyReviewDate: '2026-01-05',
    notifications: {
      enabled: false,
      morningReminder: { enabled: true, time: '08:00' },
      eveningReminder: { enabled: false, time: '20:00' },
      weeklyReviewReminder: { enabled: false, time: '10:00' },
    },
    theme: 'system',
  },
};

// Données de test pour habitude decrease (pas de habit stacking)
const decreaseHabitData = {
  schemaVersion: 8,
  habits: [
    {
      id: 'habit-edit-test-decrease',
      name: 'Cigarettes',
      emoji: '🚭',
      direction: 'decrease',
      startValue: 10,
      unit: 'cigarettes',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
      targetValue: 0,
      createdAt: '2025-12-01',
      archivedAt: null,
      trackingMode: 'detailed',
      trackingFrequency: 'daily',
      entryMode: 'replace',
    },
    {
      id: 'habit-anchor-decrease',
      name: 'Autre habitude',
      emoji: '🎯',
      direction: 'increase',
      startValue: 5,
      unit: 'fois',
      progression: { mode: 'absolute', value: 1, period: 'weekly' },
      createdAt: '2025-11-01',
      archivedAt: null,
    },
  ],
  entries: [],
  preferences: {
    onboardingCompleted: true,
    lastWeeklyReviewDate: '2026-01-05',
    notifications: {
      enabled: false,
      morningReminder: { enabled: true, time: '08:00' },
      eveningReminder: { enabled: false, time: '20:00' },
      weeklyReviewReminder: { enabled: false, time: '10:00' },
    },
    theme: 'system',
  },
};

test.describe('Édition d\'habitude - Propriétés de base', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Push-ups test")');
  });

  test('accède à la page d\'édition depuis la page détail', async ({ page }) => {
    // Aller à la page Progrès (liste des habitudes)
    await page.getByRole('link', { name: 'Progrès' }).click();
    await expect(page).toHaveURL('/habits');

    // Cliquer sur l'habitude dans la liste
    await page.getByRole('button', { name: 'Voir les détails de Push-ups test' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase/);

    // Cliquer sur le bouton modifier
    await page.getByRole('button', { name: 'Modifier' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase\/edit/);

    // Vérifier que le formulaire s'affiche
    await expect(page.getByRole('heading', { name: 'Modifier l\'habitude' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nom de l\'habitude' })).toHaveValue('Push-ups test');
  });

  test('modifie le nom et sauvegarde', async ({ page }) => {
    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // Modifier le nom
    const nameInput = page.getByRole('textbox', { name: 'Nom de l\'habitude' });
    await nameInput.clear();
    await nameInput.fill('Push-ups quotidiens');

    // Vérifier que le bouton enregistrer est actif
    const saveButton = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveButton).toBeEnabled();

    // Sauvegarder
    await saveButton.click();

    // Vérifier le message de succès
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();

    // Vérifier la redirection et le nouveau nom
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
    await expect(page.getByRole('heading', { name: 'Push-ups quotidiens' })).toBeVisible();
  });

  test('modifie la description', async ({ page }) => {
    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // Ajouter une description
    const descriptionInput = page.getByRole('textbox', { name: /Description/ });
    await descriptionInput.fill('Ma routine quotidienne de renforcement');

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});

test.describe('Édition d\'habitude - Fréquence de suivi', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('affiche les options de fréquence de suivi', async ({ page }) => {
    await expect(page.getByText('Fréquence de suivi')).toBeVisible();
    await expect(page.locator('.edit-habit__frequency-option').filter({ hasText: 'Quotidien' })).toBeVisible();
    await expect(page.locator('.edit-habit__frequency-option').filter({ hasText: 'Hebdomadaire' })).toBeVisible();
  });

  test('change la fréquence de daily à weekly', async ({ page }) => {
    // Vérifier que daily est sélectionné initialement
    const dailyButton = page.locator('.edit-habit__frequency-option').filter({ hasText: 'Quotidien' });
    await expect(dailyButton).toHaveAttribute('aria-pressed', 'true');

    // Changer vers weekly
    const weeklyButton = page.locator('.edit-habit__frequency-option').filter({ hasText: 'Hebdomadaire' });
    await weeklyButton.click();

    // Vérifier la sélection
    await expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');
    await expect(dailyButton).toHaveAttribute('aria-pressed', 'false');

    // Sauvegarder
    const saveButton = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Attendre la redirection vers la page de détail
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });
});

test.describe('Édition d\'habitude - Mode de suivi', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('affiche les options de mode de suivi', async ({ page }) => {
    await expect(page.getByText('Mode de suivi')).toBeVisible();
    await expect(page.locator('.edit-habit__tracking-mode-option').filter({ hasText: 'Simple' })).toBeVisible();
    await expect(page.locator('.edit-habit__tracking-mode-option').filter({ hasText: 'Détaillé' })).toBeVisible();
  });

  test('change le mode de detailed à simple', async ({ page }) => {
    // Vérifier que detailed est sélectionné initialement
    const detailedButton = page.locator('.edit-habit__tracking-mode-option').filter({ hasText: 'Détaillé' });
    await expect(detailedButton).toHaveAttribute('aria-pressed', 'true');

    // Changer vers simple
    const simpleButton = page.locator('.edit-habit__tracking-mode-option').filter({ hasText: 'Simple' });
    await simpleButton.click();

    // Vérifier la sélection
    await expect(simpleButton).toHaveAttribute('aria-pressed', 'true');
    await expect(detailedButton).toHaveAttribute('aria-pressed', 'false');

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});

test.describe('Édition d\'habitude - Mode de saisie', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('affiche les options de mode de saisie', async ({ page }) => {
    await expect(page.getByText('Mode de saisie')).toBeVisible();
    await expect(page.locator('.edit-habit__entry-mode-option').filter({ hasText: 'Remplacer' })).toBeVisible();
    await expect(page.locator('.edit-habit__entry-mode-option').filter({ hasText: 'Cumuler' })).toBeVisible();
  });

  test('change le mode de replace à cumulative', async ({ page }) => {
    // Vérifier que replace est sélectionné initialement
    const replaceButton = page.locator('.edit-habit__entry-mode-option').filter({ hasText: 'Remplacer' });
    await expect(replaceButton).toHaveAttribute('aria-pressed', 'true');

    // Changer vers cumulative
    const cumulativeButton = page.locator('.edit-habit__entry-mode-option').filter({ hasText: 'Cumuler' });
    await cumulativeButton.click();

    // Vérifier la sélection
    await expect(cumulativeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(replaceButton).toHaveAttribute('aria-pressed', 'false');

    // Vérifier l'affichage du hint cumulative
    await expect(page.getByText(/additionnent/)).toBeVisible();

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});

test.describe('Édition d\'habitude - Déclaration d\'identité', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('affiche la section identité avec suggestions', async ({ page }) => {
    await expect(page.getByText('Qui voulez-vous devenir ?')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Je deviens quelqu'un qui/ })).toBeVisible();
    // Vérifier qu'il y a des suggestions
    await expect(page.locator('.edit-habit__identity-suggestion').first()).toBeVisible();
  });

  test('ajoute une déclaration d\'identité personnalisée', async ({ page }) => {
    const identityInput = page.getByRole('textbox', { name: /Je deviens quelqu'un qui/ });
    await identityInput.fill('fait du sport tous les jours');

    // Vérifier l'aperçu
    await expect(page.getByText('« Je deviens quelqu\'un qui fait du sport tous les jours »')).toBeVisible();

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });

  test('sélectionne une suggestion d\'identité', async ({ page }) => {
    // Cliquer sur une suggestion
    const firstSuggestion = page.locator('.edit-habit__identity-suggestion').first();
    const suggestionText = await firstSuggestion.textContent();
    await firstSuggestion.click();

    // Vérifier que le champ est rempli
    const identityInput = page.getByRole('textbox', { name: /Je deviens quelqu'un qui/ });
    await expect(identityInput).toHaveValue(suggestionText || '');

    // Vérifier que la suggestion est visuellement sélectionnée
    await expect(firstSuggestion).toHaveClass(/--selected/);
  });
});

test.describe('Édition d\'habitude - Habit Stacking', () => {
  test('affiche le sélecteur d\'ancrage pour habitude increase', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // La section habit stacking doit être visible pour increase
    await expect(page.getByText('Enchaînement d\'habitudes')).toBeVisible();
    await expect(page.locator('.edit-habit__select')).toBeVisible();

    // Vérifier que l'habitude ancre est disponible dans le select (les options sont cachées avant ouverture)
    const select = page.locator('.edit-habit__select');
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('☕ Café matinal');
  });

  test('ne PAS afficher le sélecteur d\'ancrage pour habitude decrease', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, decreaseHabitData);

    await page.goto('/habits/habit-edit-test-decrease/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // La section habit stacking ne doit PAS être visible pour decrease
    await expect(page.getByText('Enchaînement d\'habitudes')).not.toBeVisible();
  });

  test('sélectionne une habitude d\'ancrage', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // Sélectionner l'habitude d'ancrage
    const select = page.locator('.edit-habit__select');
    await select.selectOption('habit-anchor');

    // Vérifier que la sélection est effectuée
    await expect(select).toHaveValue('habit-anchor');

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});

test.describe('Édition d\'habitude - Validation et UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('bouton enregistrer désactivé si aucun changement', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveButton).toBeDisabled();
  });

  test('bouton enregistrer désactivé si nom vide', async ({ page }) => {
    const nameInput = page.getByRole('textbox', { name: 'Nom de l\'habitude' });
    await nameInput.clear();

    const saveButton = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveButton).toBeDisabled();
  });

  test('affiche les infos non modifiables (direction, startValue)', async ({ page }) => {
    // Vérifier la carte d'info readonly
    await expect(page.getByText('Ces valeurs ne peuvent pas être modifiées')).toBeVisible();
    // Vérifier le type et la valeur de départ dans la carte info
    await expect(page.locator('.edit-habit__info-value').filter({ hasText: 'Augmenter' })).toBeVisible();
    await expect(page.locator('.edit-habit__info-value').filter({ hasText: '10 répétitions' })).toBeVisible();
  });

  test('annuler retourne à la page détail', async ({ page }) => {
    // Le bouton "Annuler" est dans le footer
    await page.locator('.edit-habit__footer').getByRole('button', { name: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });

  test('clic sur flèche retour annule et retourne', async ({ page }) => {
    await page.getByRole('button', { name: 'Annuler et retourner' }).click();
    await expect(page).toHaveURL(/\/habits\/habit-edit-test-increase$/);
  });
});

test.describe('Édition d\'habitude - Progression (sauf maintain)', () => {
  test('permet de modifier la progression pour increase', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // Vérifier que la section progression est visible
    await expect(page.locator('.edit-habit__progression-section')).toBeVisible();

    // Modifier la valeur de progression - le label est "Unités" dans la section progression
    const progressionInput = page.locator('.edit-habit__progression-section').getByRole('spinbutton');
    await progressionInput.clear();
    await progressionInput.fill('5');

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });

  test('permet de changer le mode de progression', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');

    // Changer de absolute à percentage
    await page.locator('.edit-habit__progression-section').getByRole('button', { name: 'En %' }).click();

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});

test.describe('Édition d\'habitude - Emoji', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, increaseHabitData);

    await page.goto('/habits/habit-edit-test-increase/edit');
    await page.waitForSelector('text=Modifier l\'habitude');
  });

  test('permet de changer l\'emoji', async ({ page }) => {
    // Vérifier que l'emoji actuel est sélectionné
    const currentEmoji = page.locator('.edit-habit__emoji-btn--selected');
    await expect(currentEmoji).toHaveText('💪');

    // Sélectionner un autre emoji (le second dans la grille)
    await page.locator('.edit-habit__emoji-btn').filter({ hasText: '🏃' }).click();

    // Vérifier que le nouvel emoji est sélectionné
    await expect(page.locator('.edit-habit__emoji-btn--selected')).toHaveText('🏃');

    // Sauvegarder
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Modification enregistrée.')).toBeVisible();
  });
});
