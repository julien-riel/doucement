import { test, expect, Page } from './base-test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Tests E2E pour la page Statistiques
 * Vérifie la navigation, le changement de période, l'affichage des graphiques
 * et l'état vide
 */

/**
 * Close all celebration modals that may appear
 * The statistics page can show multiple milestones in sequence
 */
async function closeAllCelebrationModals(page: Page): Promise<void> {
  await page.waitForTimeout(500)
  const dialog = page.getByRole('dialog')
  // Loop to close multiple celebration modals
  for (let i = 0; i < 10; i++) {
    if (await dialog.isVisible().catch(() => false)) {
      const continueBtn = page.getByRole('button', { name: 'Continuer' })
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click()
        await page.waitForTimeout(200)
      } else {
        break
      }
    } else {
      break
    }
  }
}

test.describe('Page Statistiques', () => {
  test.describe('Navigation et accès', () => {
    test('navigation vers la page statistiques depuis la nav principale', async ({ page }) => {
      // Charger les données de test
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/')
      await page.waitForSelector('[data-testid="main-layout"]', { timeout: 5000 }).catch(() => {
        // Layout may not have testid, wait for content instead
      })

      // Fermer les popups éventuels (WelcomeBack, TransitionSuggestion)
      const welcomeBackClose = page.locator('.welcome-back__close, .welcome-back-message button')
      if (await welcomeBackClose.isVisible({ timeout: 1000 }).catch(() => false)) {
        await welcomeBackClose.click()
      }
      const transitionClose = page.getByRole('button', { name: /rester|mode simple/i })
      if (await transitionClose.isVisible({ timeout: 1000 }).catch(() => false)) {
        await transitionClose.click()
      }

      // Cliquer sur le lien Statistiques dans la navigation
      await page.getByRole('link', { name: /Statistiques|Statistics/i }).click()

      // Vérifier qu'on est sur la page statistiques
      await expect(page).toHaveURL('/statistics')
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()
    })

    test('affiche les statistiques avec des données', async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Attendre que la page soit chargée (le tablist est visible)
      await expect(page.getByRole('tablist', { name: /période d'affichage/i })).toBeVisible()

      // Fermer les modales de célébration si elles apparaissent
      await closeAllCelebrationModals(page)

      // Vérifier que les éléments principaux sont présents
      await expect(page.getByRole('heading', { name: 'Mes statistiques' })).toBeVisible()

      // Vérifier le sélecteur de période
      await expect(page.getByRole('tab', { name: 'Semaine' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Mois' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Année' })).toBeVisible()

      // Vérifier les StatCards
      await expect(page.getByText('Moyenne')).toBeVisible()
      await expect(page.getByText('Jours actifs')).toBeVisible()
      // Note: "Habitudes" apparaît aussi dans la navigation, utiliser un sélecteur plus précis
      await expect(page.locator('.stat-card__label').filter({ hasText: 'Habitudes' })).toBeVisible()

      // Vérifier le sélecteur d'habitude
      await expect(page.getByLabel('Habitude :')).toBeVisible()
    })
  })

  test.describe('Sélecteur de période', () => {
    test.beforeEach(async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Fermer les modales de célébration si elles apparaissent
      await closeAllCelebrationModals(page)

      // Attendre que la page soit complètement chargée avec les statistiques
      // Le tablist n'est visible que si on a assez de données
      await expect(page.getByRole('tablist', { name: /période d'affichage/i })).toBeVisible({ timeout: 10000 })
    })

    test('changement de période Semaine', async ({ page }) => {
      // Cliquer sur Semaine
      await page.getByRole('tab', { name: 'Semaine' }).click()

      // Vérifier que le bouton est actif
      await expect(page.getByRole('tab', { name: 'Semaine' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    test('changement de période Mois', async ({ page }) => {
      // Le mois est sélectionné par défaut, vérifier
      await expect(page.getByRole('tab', { name: 'Mois' })).toHaveAttribute('aria-selected', 'true')
    })

    test('changement de période Année', async ({ page }) => {
      await page.getByRole('tab', { name: 'Année' }).click()
      await expect(page.getByRole('tab', { name: 'Année' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    })

    test('changement de période Tout', async ({ page }) => {
      await page.getByRole('tab', { name: 'Tout' }).click()
      await expect(page.getByRole('tab', { name: 'Tout' })).toHaveAttribute('aria-selected', 'true')
    })
  })

  test.describe('Sélecteur d\'habitude', () => {
    test('permet de changer d\'habitude', async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Vérifier que le select existe
      const habitSelect = page.getByLabel('Habitude :')
      await expect(habitSelect).toBeVisible()

      // Changer l'habitude
      await habitSelect.selectOption({ label: '🧘 Méditation' })

      // Vérifier que l'option est sélectionnée
      await expect(habitSelect).toHaveValue('habit-meditation-full')
    })
  })

  test.describe('Graphiques', () => {
    test.beforeEach(async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Attendre que la page soit chargée (le tablist est visible)
      await expect(page.getByRole('tablist', { name: /période d'affichage/i })).toBeVisible()

      // Fermer les modales de célébration si elles apparaissent
      await closeAllCelebrationModals(page)
    })

    test('affiche le graphique de progression', async ({ page }) => {
      // Vérifier que le graphique de progression est présent
      await expect(
        page.getByRole('region', { name: /graphique de progression/i })
      ).toBeVisible()
    })

    test('affiche le calendrier heatmap', async ({ page }) => {
      // Vérifier que le calendrier heatmap est présent
      await expect(
        page.getByRole('region', { name: /calendrier de progression/i })
      ).toBeVisible()
    })

    test('affiche le graphique de comparaison quand plusieurs habitudes', async ({ page }) => {
      // Vérifier que la section comparaison est présente (plusieurs habitudes dans le test)
      await expect(
        page.getByRole('region', { name: /comparaison des habitudes/i })
      ).toBeVisible()
      // Note: Il y a un h2 et un h3 "Comparaison", utiliser le h2 de la section
      await expect(page.locator('.statistics__section-title').filter({ hasText: 'Comparaison' })).toBeVisible()
    })
  })

  test.describe('Section Projections', () => {
    test('affiche la section projections pour une habitude avec targetValue', async ({
      page,
    }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Push-ups a un targetValue de 50, donc la section projection devrait être visible
      // Sélectionner Push-ups (devrait être par défaut)
      const habitSelect = page.getByLabel('Habitude :')
      await habitSelect.selectOption({ label: '💪 Push-ups' })

      // Vérifier que la section projections est présente
      await expect(page.getByRole('region', { name: /projections/i })).toBeVisible()
      await expect(page.getByText('Progression vers l\'objectif')).toBeVisible()
    })
  })

  test.describe('État vide', () => {
    test('affiche un message quand aucune habitude', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem(
          'doucement_data',
          JSON.stringify({
            schemaVersion: 10,
            habits: [],
            entries: [],
            preferences: { onboardingCompleted: true },
          })
        )
      })

      await page.goto('/statistics')

      // Vérifier le message d'état vide
      await expect(page.getByText('Pas encore de statistiques')).toBeVisible()
      await expect(
        page.getByText(/Créez votre première habitude pour commencer à voir vos statistiques/)
      ).toBeVisible()
    })

    test('affiche un message quand pas assez de données', async ({ page }) => {
      // Créer une habitude avec seulement 1 entrée (en dessous du minimum de 3)
      // IMPORTANT: Utiliser la date locale (pas UTC via toISOString) car l'app utilise des dates locales
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      await page.addInitScript(
        (currentDate) => {
          localStorage.clear()
          localStorage.setItem('doucement-language', 'fr')
          localStorage.setItem(
            'doucement_data',
            JSON.stringify({
              schemaVersion: 10,
              habits: [
                {
                  id: 'habit-test',
                  name: 'Test',
                  emoji: '🧪',
                  direction: 'increase',
                  startValue: 10,
                  unit: 'unités',
                  progression: { mode: 'percentage', value: 5, period: 'weekly' },
                  createdAt: currentDate,
                  archivedAt: null,
                },
              ],
              entries: [
                {
                  id: 'e1',
                  habitId: 'habit-test',
                  date: currentDate,
                  targetDose: 10,
                  actualValue: 10,
                  createdAt: `${currentDate}T10:00:00Z`,
                  updatedAt: `${currentDate}T10:00:00Z`,
                },
              ],
              preferences: { onboardingCompleted: true },
            })
          )
        },
        today
      )

      await page.goto('/statistics')

      // Vérifier le message "pas assez de données"
      await expect(page.getByText('Continue encore quelques jours')).toBeVisible()
      await expect(page.getByText(/Tu en es à 1 jour/)).toBeVisible()
    })
  })

  test.describe('Accessibilité', () => {
    test('les graphiques ont des labels ARIA', async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Vérifier les sections avec aria-label
      await expect(page.getByRole('region', { name: 'Résumé statistique' })).toBeVisible()
      await expect(page.getByRole('region', { name: /graphique de progression/i })).toBeVisible()
      await expect(page.getByRole('region', { name: /calendrier de progression/i })).toBeVisible()
    })

    test('le sélecteur de période utilise des tabs accessibles', async ({ page }) => {
      const testDataPath = path.join(process.cwd(), 'public/test-data/full-scenario.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'))

      await page.addInitScript((data) => {
        localStorage.clear()
        localStorage.setItem('doucement-language', 'fr')
        localStorage.setItem('doucement_data', JSON.stringify(data))
      }, testData)

      await page.goto('/statistics')

      // Vérifier le tablist
      await expect(page.getByRole('tablist', { name: /période d'affichage/i })).toBeVisible()

      // Vérifier que les tabs ont le bon rôle
      const weekTab = page.getByRole('tab', { name: 'Semaine' })
      await expect(weekTab).toHaveRole('tab')
    })
  })
})
