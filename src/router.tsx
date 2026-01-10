import { createBrowserRouter } from 'react-router-dom'
import { Onboarding, Today, HabitList, HabitDetail, CreateHabit, Settings } from './pages'

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
    element: <Today />,
  },
  {
    path: '/onboarding',
    element: <Onboarding />,
  },
  {
    path: '/habits',
    element: <HabitList />,
  },
  {
    path: '/habits/:id',
    element: <HabitDetail />,
  },
  {
    path: '/create',
    element: <CreateHabit />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
])
