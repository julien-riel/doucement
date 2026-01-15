import { test, expect } from '@playwright/test'
import {
  setupLocalStorage,
  setupLocalStorageForPersistence,
  createEmptyAppData,
} from './fixtures'

/**
 * Tests E2E pour l'internationalisation (i18n)
 * Vérifie le changement de langue, la persistance et la détection automatique
 */

test.describe('Internationalisation (i18n)', () => {
  test.describe('Sélecteur de langue', () => {
    test('affiche le sélecteur de langue dans les paramètres', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Vérifier que la section langue est visible
      await expect(page.getByRole('heading', { name: /Langue|Language/ })).toBeVisible()

      // Vérifier que les deux options de langue sont visibles
      await expect(page.getByRole('radio', { name: /Français/ })).toBeVisible()
      await expect(page.getByRole('radio', { name: /English/ })).toBeVisible()
    })

    test('changement de langue de français vers anglais', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Vérifier que l'interface est en français
      await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible()

      // Cliquer sur English
      await page.getByRole('radio', { name: /English/ }).click()

      // Vérifier que l'interface passe en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    })

    test('changement de langue de anglais vers français', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData(), 'en')

      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Vérifier que l'interface est en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

      // Cliquer sur Français
      await page.getByRole('radio', { name: /Français/ }).click()

      // Vérifier que l'interface passe en français
      await expect(page.getByRole('heading', { name: 'Paramètres' })).toBeVisible()
    })
  })

  test.describe('Persistance du choix de langue', () => {
    test('le choix de langue persiste après rechargement', async ({ page }) => {
      // Setup avec page.evaluate pour permettre la persistance après reload
      await setupLocalStorageForPersistence(page, createEmptyAppData(), {
        path: '/settings',
        waitSelector: '.page-settings',
      })

      // Changer vers l'anglais
      await page.getByRole('radio', { name: /English/ }).click()

      // Vérifier que l'interface est en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

      // Recharger la page
      await page.reload()
      await page.waitForSelector('.page-settings')

      // Vérifier que l'interface est toujours en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    })

    test('le choix de langue persiste entre les pages', async ({ page }) => {
      // Setup avec page.evaluate pour permettre la persistance entre navigations
      await setupLocalStorageForPersistence(page, createEmptyAppData(), {
        path: '/settings',
        waitSelector: '.page-settings',
      })

      // Changer vers l'anglais
      await page.getByRole('radio', { name: /English/ }).click()

      // Vérifier le changement
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

      // Utiliser la navigation SPA au lieu de goto pour préserver l'état
      const nav = page.locator('nav, .navigation, .bottom-nav')
      await nav.getByRole('link', { name: /Today/i }).click()
      await page.waitForLoadState('networkidle')

      // Vérifier que l'interface est toujours en anglais
      await expect(nav.getByRole('link', { name: /Today/i })).toBeVisible()
    })
  })

  test.describe('Traductions des éléments clés', () => {
    test('navigation en français', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Vérifier les éléments de navigation en français
      const nav = page.locator('nav, .navigation, .bottom-nav')
      await expect(nav.getByRole('link', { name: /Aujourd/i })).toBeVisible()
      await expect(nav.getByRole('link', { name: /Habitude/i })).toBeVisible()
    })

    test('navigation en anglais', async ({ page }) => {
      // Setup en français d'abord
      await setupLocalStorage(page, createEmptyAppData())

      // Aller aux Settings et changer la langue
      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Changer vers l'anglais via le sélecteur
      await page.getByRole('radio', { name: /English/ }).click()

      // Vérifier que Settings a changé en anglais
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

      // Naviguer vers la page d'accueil via SPA
      const nav = page.locator('nav, .navigation, .bottom-nav')
      await nav.getByRole('link', { name: /Today/i }).click()

      // Vérifier les éléments de navigation en anglais
      await expect(nav.getByRole('link', { name: /Today/i })).toBeVisible()
      await expect(nav.getByRole('link', { name: /Habit/i })).toBeVisible()
    })

    test('page de création d\'habitude en français', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/create')
      await page.waitForSelector('.page-create-habit')

      // Vérifier les éléments en français
      await expect(page.getByRole('heading', { name: /Nouvelle habitude/i })).toBeVisible()
      await expect(page.getByText(/Habitudes à fort impact/i)).toBeVisible()
    })

    test('page de création d\'habitude en anglais', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData(), 'en')

      await page.goto('/create')
      await page.waitForSelector('.page-create-habit')

      // Vérifier les éléments en anglais
      await expect(page.getByRole('heading', { name: /New habit/i })).toBeVisible()
      await expect(page.getByText(/High.impact habits/i)).toBeVisible()
    })
  })

  test.describe('Traduction des habitudes suggérées', () => {
    test('habitudes suggérées en français', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/create')
      await page.waitForSelector('.page-create-habit')

      // Vérifier qu'une habitude suggérée est en français
      await expect(
        page.getByText(/Se coucher à heure fixe|Marche quotidienne|Méditation guidée/i).first()
      ).toBeVisible()
    })

    test('habitudes suggérées en anglais', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData(), 'en')

      await page.goto('/create')
      await page.waitForSelector('.page-create-habit')

      // Vérifier qu'une habitude suggérée est en anglais
      await expect(
        page.getByText(/Regular bedtime|Daily walk|Guided meditation/i).first()
      ).toBeVisible()
    })
  })

  test.describe('Indicateur visuel de langue active', () => {
    test('bouton français actif quand langue est français', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData())

      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Vérifier que le bouton français a la classe active
      const frButton = page.getByRole('radio', { name: /Français/ })
      await expect(frButton).toHaveClass(/--active/)

      // Vérifier que le bouton anglais n'a pas la classe active
      const enButton = page.getByRole('radio', { name: /English/ })
      await expect(enButton).not.toHaveClass(/--active/)
    })

    test('bouton anglais actif quand langue est anglais', async ({ page }) => {
      await setupLocalStorage(page, createEmptyAppData(), 'en')

      await page.goto('/settings')
      await page.waitForSelector('.page-settings')

      // Vérifier que le bouton anglais a la classe active
      const enButton = page.getByRole('radio', { name: /English/ })
      await expect(enButton).toHaveClass(/--active/)

      // Vérifier que le bouton français n'a pas la classe active
      const frButton = page.getByRole('radio', { name: /Français/ })
      await expect(frButton).not.toHaveClass(/--active/)
    })
  })
})
