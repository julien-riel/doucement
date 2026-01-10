import { createBrowserRouter } from 'react-router-dom'
import { Onboarding, Today, HabitList, HabitDetail, CreateHabit, Settings } from './pages'
import { MainLayout } from './components/layout'

/**
 * Configuration du routeur de l'application
 * Routes principales :
 * - / : Écran Aujourd'hui (par défaut)
 * - /onboarding : Introduction pour nouveaux utilisateurs
 * - /habits : Liste des habitudes
 * - /habits/:id : Détail d'une habitude
 * - /create : Création d'une nouvelle habitude
 * - /settings : Paramètres de l'application
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <MainLayout>
        <Today />
      </MainLayout>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <MainLayout hideNavigation>
        <Onboarding />
      </MainLayout>
    ),
  },
  {
    path: '/habits',
    element: (
      <MainLayout>
        <HabitList />
      </MainLayout>
    ),
  },
  {
    path: '/habits/:id',
    element: (
      <MainLayout>
        <HabitDetail />
      </MainLayout>
    ),
  },
  {
    path: '/create',
    element: (
      <MainLayout>
        <CreateHabit />
      </MainLayout>
    ),
  },
  {
    path: '/settings',
    element: (
      <MainLayout>
        <Settings />
      </MainLayout>
    ),
  },
])
