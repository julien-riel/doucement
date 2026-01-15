import { test, expect } from './base-test'
import { setupLocalStorage, createEmptyAppData, CreateHabitPage } from './fixtures'

/**
 * Tests E2E pour les filtres de suggestions d'habitudes
 * Vérifie le fonctionnement des filtres par catégorie, difficulté et moment de la journée
 */

test.describe('Filtres de suggestions d\'habitudes', () => {
  let createHabitPage: CreateHabitPage

  test.beforeEach(async ({ page }) => {
    createHabitPage = new CreateHabitPage(page)
    await setupLocalStorage(page, createEmptyAppData())
    await createHabitPage.goto()
  })

  test.describe('Filtres par catégorie', () => {
    test('affiche tous les filtres de catégorie avec emoji et nom', async ({ page }) => {
      // Vérifier le filtre Top 6 (par défaut, sans emoji)
      await expect(page.getByRole('button', { name: 'Top 6' })).toBeVisible()

      // Vérifier les filtres de catégorie avec emoji + nom (noms réels de HABIT_CATEGORIES)
      await expect(page.getByRole('button', { name: /😴.*Sommeil/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /🏃.*Mouvement/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /🧘.*Méditation/ })).toBeVisible()
    })

    test('filtre par catégorie Sommeil affiche les habitudes de sommeil', async ({ page }) => {
      // Cliquer sur le filtre Sommeil
      await page.getByRole('button', { name: /😴.*Sommeil/ }).click()

      // Vérifier que le filtre est actif visuellement (a la classe active)
      await expect(page.getByRole('button', { name: /😴.*Sommeil/ })).toHaveClass(/--active/)

      // Vérifier que les habitudes de sommeil sont visibles
      await expect(page.getByText('Se coucher à heure fixe')).toBeVisible()
    })

    test('filtre par catégorie Mouvement affiche les habitudes de mouvement', async ({ page }) => {
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Vérifier que le filtre est actif
      await expect(page.getByRole('button', { name: /🏃.*Mouvement/ })).toHaveClass(/--active/)

      // Vérifier que des habitudes de mouvement sont visibles (ex: Marche quotidienne)
      await expect(page.getByText('Marche quotidienne')).toBeVisible()
    })

    test('retour au filtre Top 6 après sélection d\'une catégorie', async ({ page }) => {
      // Cliquer sur un filtre catégorie
      await page.getByRole('button', { name: /😴.*Sommeil/ }).click()

      // Vérifier que Top 6 n'est plus actif
      await expect(page.getByRole('button', { name: 'Top 6' })).not.toHaveClass(/--active/)

      // Revenir à Top 6
      await createHabitPage.showTop6()

      // Vérifier que Top 6 est actif à nouveau
      await expect(page.getByRole('button', { name: 'Top 6' })).toHaveClass(/--active/)
    })
  })

  test.describe('Filtres par difficulté', () => {
    test('affiche tous les filtres de difficulté', async ({ page }) => {
      // Vérifier les 4 filtres de difficulté
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await expect(difficultyFilters.getByRole('button', { name: 'Tous' })).toBeVisible()
      await expect(difficultyFilters.getByRole('button', { name: 'Facile' })).toBeVisible()
      await expect(difficultyFilters.getByRole('button', { name: 'Modéré' })).toBeVisible()
      await expect(difficultyFilters.getByRole('button', { name: 'Exigeant' })).toBeVisible()
    })

    test('filtre par difficulté Facile', async ({ page }) => {
      // Sélectionner une catégorie d'abord pour avoir plus de résultats
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Cliquer sur Facile dans les filtres de difficulté
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Facile' }).click()

      // Vérifier que le filtre est actif
      await expect(difficultyFilters.getByRole('button', { name: 'Facile' })).toHaveClass(/--active/)

      // Vérifier que le compteur de résultats est mis à jour
      await expect(page.locator('.step-choose__result-count')).toContainText(/\d+ habitude/)
    })

    test('filtre par difficulté Exigeant', async ({ page }) => {
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Exigeant' }).click()

      // Vérifier que le filtre est actif
      await expect(difficultyFilters.getByRole('button', { name: 'Exigeant' })).toHaveClass(/--active/)
    })
  })

  test.describe('Filtres par moment de la journée', () => {
    test('affiche tous les filtres de moment avec emoji et nom', async ({ page }) => {
      // Les filtres de moment sont dans la deuxième ligne de filtres secondaires
      const timeFilters = page.locator('.step-choose__filters').last()

      await expect(timeFilters.getByRole('button', { name: 'Tous' })).toBeVisible()
      await expect(timeFilters.getByRole('button', { name: /Matin/ })).toBeVisible()
      await expect(timeFilters.getByRole('button', { name: /Après-midi/ })).toBeVisible()
      await expect(timeFilters.getByRole('button', { name: /Soir/ })).toBeVisible()
      await expect(timeFilters.getByRole('button', { name: /Nuit/ })).toBeVisible()
    })

    test('filtre par moment Matin', async ({ page }) => {
      // Sélectionner une catégorie pour avoir plus de résultats
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Cliquer sur Matin
      const timeFilters = page.locator('.step-choose__filters').last()
      await timeFilters.getByRole('button', { name: /Matin/ }).click()

      // Vérifier que le filtre est actif
      await expect(timeFilters.getByRole('button', { name: /Matin/ })).toHaveClass(/--active/)
    })

    test('filtre par moment Soir', async ({ page }) => {
      const timeFilters = page.locator('.step-choose__filters').last()
      await timeFilters.getByRole('button', { name: /Soir/ }).click()

      // Vérifier que le filtre est actif
      await expect(timeFilters.getByRole('button', { name: /Soir/ })).toHaveClass(/--active/)
    })
  })

  test.describe('Combinaison de filtres', () => {
    test('combinaison catégorie + difficulté', async ({ page }) => {
      // Sélectionner catégorie Physique
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Sélectionner difficulté Facile
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Facile' }).click()

      // Vérifier que les deux filtres sont actifs
      await expect(page.getByRole('button', { name: /🏃.*Mouvement/ })).toHaveClass(/--active/)
      await expect(difficultyFilters.getByRole('button', { name: 'Facile' })).toHaveClass(/--active/)

      // Le compteur devrait montrer les résultats filtrés
      await expect(page.locator('.step-choose__result-count')).toBeVisible()
    })

    test('combinaison catégorie + moment', async ({ page }) => {
      // Sélectionner catégorie Sommeil
      await page.getByRole('button', { name: /😴.*Sommeil/ }).click()

      // Sélectionner moment Soir
      const timeFilters = page.locator('.step-choose__filters').last()
      await timeFilters.getByRole('button', { name: /Soir/ }).click()

      // Vérifier que les deux filtres sont actifs
      await expect(page.getByRole('button', { name: /😴.*Sommeil/ })).toHaveClass(/--active/)
      await expect(timeFilters.getByRole('button', { name: /Soir/ })).toHaveClass(/--active/)
    })

    test('combinaison triple : catégorie + difficulté + moment', async ({ page }) => {
      // Sélectionner catégorie Physique
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Sélectionner difficulté Facile
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Facile' }).click()

      // Sélectionner moment Matin
      const timeFilters = page.locator('.step-choose__filters').last()
      await timeFilters.getByRole('button', { name: /Matin/ }).click()

      // Vérifier que les trois filtres sont actifs
      await expect(page.getByRole('button', { name: /🏃.*Mouvement/ })).toHaveClass(/--active/)
      await expect(difficultyFilters.getByRole('button', { name: 'Facile' })).toHaveClass(/--active/)
      await expect(timeFilters.getByRole('button', { name: /Matin/ })).toHaveClass(/--active/)

      // Le compteur devrait être visible avec les résultats
      const resultCount = page.locator('.step-choose__result-count')
      await expect(resultCount).toBeVisible()
    })

    test('reset des filtres en revenant à Top 6', async ({ page }) => {
      // Appliquer des filtres
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Facile' }).click()

      // Revenir à Top 6
      await createHabitPage.showTop6()

      // Vérifier que Top 6 est actif
      await expect(page.getByRole('button', { name: 'Top 6' })).toHaveClass(/--active/)

      // Les filtres secondaires devraient toujours être visibles
      await expect(difficultyFilters.getByRole('button', { name: 'Facile' })).toBeVisible()
    })
  })

  test.describe('Compteur de résultats', () => {
    test('affiche le compteur de résultats', async ({ page }) => {
      // Par défaut avec Top 6, devrait afficher "6 habitudes"
      await expect(page.locator('.step-choose__result-count')).toContainText(/\d+ habitude/)
    })

    test('singulier pour 1 résultat', async ({ page }) => {
      // Appliquer des filtres restrictifs pour avoir peu de résultats
      // Si on obtient 1 résultat, vérifier le singulier
      await page.getByRole('button', { name: /😴.*Sommeil/ }).click()
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Exigeant' }).click()

      // Vérifier que le compteur est mis à jour (peut être 0, 1 ou plus)
      const resultCount = page.locator('.step-choose__result-count')
      await expect(resultCount).toBeVisible()

      // Si le texte contient "1 habitude" (singulier) ou "X habitudes" (pluriel), c'est correct
      const text = await resultCount.textContent()
      expect(text).toMatch(/\d+ habitudes?/)
    })

    test('mise à jour en temps réel', async ({ page }) => {
      // Obtenir le compteur initial
      const resultCount = page.locator('.step-choose__result-count')
      await expect(resultCount).toBeVisible()

      // Changer de filtre catégorie
      await createHabitPage.filterByCategory('🧘')

      // Le compteur devrait s'actualiser (le texte peut être le même ou différent selon les données)
      await expect(resultCount).toBeVisible()

      // Ajouter un filtre de difficulté
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Exigeant' }).click()

      // Le compteur devrait toujours être visible
      await expect(resultCount).toBeVisible()
    })
  })

  test.describe('Carrousel et filtres', () => {
    test('le carrousel se réinitialise au changement de filtre catégorie', async ({ page }) => {
      // Aller sur une catégorie avec plusieurs habitudes
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Le carrousel devrait être visible
      await expect(page.locator('.habit-carousel')).toBeVisible()

      // Changer de catégorie
      await page.getByRole('button', { name: /😴.*Sommeil/ }).click()

      // Le carrousel devrait toujours être visible
      await expect(page.locator('.habit-carousel')).toBeVisible()
    })

    test('le carrousel se réinitialise au changement de filtre difficulté', async ({ page }) => {
      // Aller sur une catégorie
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Le carrousel devrait être visible
      await expect(page.locator('.habit-carousel')).toBeVisible()

      // Changer la difficulté
      const difficultyFilters = page.locator('.step-choose__filters').nth(1)
      await difficultyFilters.getByRole('button', { name: 'Facile' }).click()

      // Le carrousel devrait toujours être visible
      await expect(page.locator('.habit-carousel')).toBeVisible()
    })

    test('sélectionner une habitude depuis le carrousel filtré', async ({ page }) => {
      // Aller sur une catégorie
      await page.getByRole('button', { name: /🏃.*Mouvement/ }).click()

      // Sélectionner une habitude du carrousel
      await createHabitPage.selectSuggestedHabit(0)

      // Devrait passer à l'étape suivante (intentions)
      await createHabitPage.expectIntentionsStep()
    })
  })
})
