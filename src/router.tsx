import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import {
  Onboarding,
  Today,
  HabitList,
  HabitDetail,
  CreateHabit,
  EditHabit,
  Settings,
  WeeklyReview,
  Statistics,
} from './pages'
import { MainLayout } from './components/layout'

/**
 * Lazy-loaded QuickCheckIn component for optimal loading performance
 * Loaded in its own chunk for fast PWA shortcut access
 */
const QuickCheckIn = lazy(() => import('./pages/QuickCheckIn'))

/**
 * Minimal loading fallback for quick-checkin page
 * Styled inline to avoid loading additional CSS bundle
 */
function QuickCheckInFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#FDFCFB',
        fontFamily: 'system-ui, sans-serif',
        color: '#57534E',
      }}
    >
      <span>Chargement...</span>
    </div>
  )
}

/**
 * Configuration du routeur de l'application
 * Routes principales :
 * - / : Écran Aujourd'hui (par défaut)
 * - /onboarding : Introduction pour nouveaux utilisateurs
 * - /habits : Liste des habitudes
 * - /habits/:id : Détail d'une habitude
 * - /create : Création d'une nouvelle habitude
 * - /settings : Paramètres de l'application
 * - /statistics : Page des statistiques et graphiques
 * - /quick-checkin : Check-in rapide (sans navigation, accessible via PWA shortcut)
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
    path: '/habits/:id/edit',
    element: (
      <MainLayout>
        <EditHabit />
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
  {
    path: '/review',
    element: (
      <MainLayout>
        <WeeklyReview />
      </MainLayout>
    ),
  },
  {
    path: '/statistics',
    element: (
      <MainLayout>
        <Statistics />
      </MainLayout>
    ),
  },
  {
    path: '/quick-checkin',
    element: (
      <Suspense fallback={<QuickCheckInFallback />}>
        <QuickCheckIn />
      </Suspense>
    ),
  },
])
