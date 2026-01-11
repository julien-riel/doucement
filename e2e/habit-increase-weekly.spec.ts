import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les habitudes increase weekly
 * Vérifie l'affichage X/Y cette semaine et le check-in binaire quotidien
 *
 * Boutons pour weekly: "Fait" | "Pas aujourd'hui" (binaire)
 */

/**
 * Helper pour obtenir la date du jour au format YYYY-MM-DD
 */
function getToday(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Helper pour obtenir une date relative à aujourd'hui
 */
function getRelativeDate(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

/**
 * Helper pour obtenir le lundi de la semaine actuelle
 */
function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Si dimanche, reculer de 6 jours, sinon aller au lundi
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

// Données de test pour habitude weekly avec des entrées cette semaine
const createIncreaseWeeklyData = () => {
  const monday = getMondayOfCurrentWeek();
  const mondayDate = new Date(monday);

  // Créer 3 entrées pour cette semaine (lundi, mardi, mercredi)
  const entries = [0, 1, 2].map((offset, index) => {
    const entryDate = new Date(mondayDate);
    entryDate.setDate(mondayDate.getDate() + offset);
    const dateStr = entryDate.toISOString().split('T')[0];
    return {
      id: `e${index + 1}`,
      habitId: 'habit-bedtime-increase-weekly',
      date: dateStr,
      targetDose: 5,
      actualValue: 1,
      createdAt: `${dateStr}T22:30:00Z`,
      updatedAt: `${dateStr}T22:30:00Z`
    };
  });

  return {
    schemaVersion: 7,
    habits: [
      {
        id: 'habit-bedtime-increase-weekly',
        name: 'Se coucher à heure fixe',
        emoji: '🌙',
        description: 'Aller au lit à la même heure chaque soir',
        direction: 'increase',
        startValue: 3,
        unit: 'soirs/semaine',
        progression: { mode: 'absolute', value: 1, period: 'weekly' },
        targetValue: 7,
        createdAt: '2025-12-01',
        archivedAt: null,
        trackingMode: 'simple',
        trackingFrequency: 'weekly',
        implementationIntention: {
          trigger: 'À 22h30',
          location: 'Chambre'
        }
      }
    ],
    entries,
    preferences: {
      onboardingCompleted: true,
      lastWeeklyReviewDate: getRelativeDate(-7),
      notifications: {
        enabled: false,
        morningReminder: { enabled: true, time: '08:00' },
        eveningReminder: { enabled: false, time: '20:00' },
        weeklyReviewReminder: { enabled: false, time: '10:00' }
      },
      theme: 'system'
    }
  };
};

// Données avec 0 jours fait cette semaine pour tester le début de semaine
const createIncreaseWeeklyEmptyData = () => {
  const data = createIncreaseWeeklyData();
  return { ...data, entries: [] };
};

test.describe('Habitude increase weekly', () => {
  test('affiche le compteur X/Y cette semaine', async ({ page }) => {
    const testData = createIncreaseWeeklyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    // Vérifier que l'habitude est affichée avec le compteur hebdomadaire
    const habitCard = page.locator('.habit-card').filter({ hasText: 'Se coucher à heure fixe' });
    await expect(habitCard.getByRole('heading', { name: 'Se coucher à heure fixe' })).toBeVisible();
    await expect(habitCard.getByText('🌙')).toBeVisible();

    // Vérifier l'affichage X/Y cette semaine (format X/Y où X et Y sont des nombres)
    await expect(habitCard.getByText(/\d+\/\d+/)).toBeVisible();
    await expect(habitCard.getByText('cette semaine')).toBeVisible();
  });

  test('utilise les boutons de check-in binaire (Fait / Pas aujourd\'hui)', async ({ page }) => {
    const testData = createIncreaseWeeklyEmptyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    // Les habitudes weekly utilisent SimpleCheckIn avec boutons binaires
    await expect(page.getByRole('button', { name: 'Fait' })).toBeVisible();
    await expect(page.getByRole('button', { name: "Pas aujourd'hui" })).toBeVisible();

    // NE devrait PAS avoir les boutons du mode detailed
    await expect(page.getByRole('button', { name: 'Un peu' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore +' })).not.toBeVisible();
  });

  test('check-in "Fait" incrémente le compteur hebdomadaire', async ({ page }) => {
    const testData = createIncreaseWeeklyEmptyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    const habitCard = page.locator('.habit-card').filter({ hasText: 'Se coucher à heure fixe' });

    // Vérifier que le compteur montre 0 fait (format X/Y)
    await expect(habitCard.getByText(/^0\/\d+$/)).toBeVisible();

    // Cliquer sur "Fait"
    await page.getByRole('button', { name: 'Fait' }).click();

    // Le compteur devrait maintenant montrer 1/X
    await expect(habitCard.getByText(/^1\/\d+$/)).toBeVisible();
  });

  test('bouton "Fait" change de style après check-in', async ({ page }) => {
    const testData = createIncreaseWeeklyEmptyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    const doneButton = page.getByRole('button', { name: 'Fait' });

    // Cliquer sur "Fait"
    await doneButton.click();

    // Le bouton devrait maintenant avoir une coche et changer de style
    await expect(doneButton).toContainText('✓');
  });

  test('check-in "Pas aujourd\'hui" ne compte pas dans le total', async ({ page }) => {
    const testData = createIncreaseWeeklyEmptyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    const habitCard = page.locator('.habit-card').filter({ hasText: 'Se coucher à heure fixe' });

    // Vérifier le compteur initial (0/X)
    await expect(habitCard.getByText(/^0\/\d+$/)).toBeVisible();

    // Cliquer sur "Pas aujourd'hui"
    await page.getByRole('button', { name: "Pas aujourd'hui" }).click();

    // Le compteur devrait rester à 0/X
    await expect(habitCard.getByText(/^0\/\d+$/)).toBeVisible();
  });

  test('création d\'une habitude weekly complète', async ({ page }) => {
    // Utiliser des données vides pour partir de zéro
    const emptyData = {
      schemaVersion: 7,
      habits: [],
      entries: [],
      preferences: {
        onboardingCompleted: true,
        lastWeeklyReviewDate: null,
        notifications: {
          enabled: false,
          morningReminder: { enabled: true, time: '08:00' },
          eveningReminder: { enabled: false, time: '20:00' },
          weeklyReviewReminder: { enabled: false, time: '10:00' }
        },
        theme: 'system'
      }
    };

    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, emptyData);

    // Aller à la page de création
    await page.goto('/create');
    await page.waitForSelector('text=Nouvelle habitude');

    // Choisir une habitude suggérée weekly (sommeil)
    await page.getByText('Se coucher à heure fixe').click();

    // Step: details - Continuer
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Steps: intentions, identity - Cliquer sur Aperçu jusqu'à ce qu'on arrive à la preview
    // Le bouton Aperçu permet de sauter directement les étapes optionnelles
    while (await page.getByRole('button', { name: 'Aperçu' }).isVisible()) {
      const previewButton = page.getByRole('button', { name: 'Aperçu' });
      // Vérifier si on est déjà sur la page de preview (avec le bouton "Créer l'habitude")
      const createButton = page.getByRole('button', { name: "Créer l'habitude" });
      if (await createButton.isVisible({ timeout: 500 }).catch(() => false)) {
        break;
      }
      await previewButton.click();
      await page.waitForTimeout(200);
    }

    // Vérifier l'aperçu
    await expect(page.getByRole('heading', { name: 'Se coucher à heure fixe' })).toBeVisible();
    await expect(page.getByText('Augmenter')).toBeVisible();
    await expect(page.getByText(/\d+ soirs\/semaine$/)).toBeVisible();

    // Créer l'habitude
    await page.getByRole('button', { name: "Créer l'habitude" }).click();

    // Étape first-checkin
    await expect(page.getByText('Première victoire ?')).toBeVisible();
    await page.getByRole('button', { name: 'Non, je commence demain' }).click();

    // Vérifier que l'habitude est créée et a le bon format weekly
    await expect(page).toHaveURL('/');
    await expect(page.getByText('cette semaine')).toBeVisible();
  });

  test('affiche l\'intention et le lieu configurés', async ({ page }) => {
    const testData = createIncreaseWeeklyData();
    await page.addInitScript((data) => {
      localStorage.setItem('doucement_data', JSON.stringify(data));
    }, testData);

    await page.goto('/');
    await page.waitForSelector('h3:has-text("Se coucher à heure fixe")');

    // L'intention devrait être affichée (trigger: "À 22h30", location: "Chambre")
    const habitCard = page.locator('.habit-card').filter({ hasText: 'Se coucher à heure fixe' });
    await expect(habitCard.getByText(/22h30/).or(habitCard.getByText(/Chambre/))).toBeVisible();
  });
});
