import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Today } from './pages'
import { MainLayout } from './components/layout'
import { PageLoader } from './components/ui'

/**
 * Lazy-loaded page components for optimal bundle splitting
 * Only Today is eager-loaded as it's the main landing page
 */
const Onboarding = lazy(() => import('./pages/Onboarding'))
const HabitList = lazy(() => import('./pages/HabitList'))
const HabitDetail = lazy(() => import('./pages/HabitDetail'))
const CreateHabit = lazy(() => import('./pages/CreateHabit'))
const EditHabit = lazy(() => import('./pages/EditHabit'))
const Settings = lazy(() => import('./pages/Settings'))
const WeeklyReview = lazy(() => import('./pages/WeeklyReview'))
const Statistics = lazy(() => import('./pages/Statistics'))
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
 * - / : Écran Aujourd'hui (par défaut) - Eager loaded
 * - /onboarding : Introduction pour nouveaux utilisateurs - Lazy loaded
 * - /habits : Liste des habitudes - Lazy loaded
 * - /habits/:id : Détail d'une habitude - Lazy loaded
 * - /create : Création d'une nouvelle habitude - Lazy loaded
 * - /settings : Paramètres de l'application - Lazy loaded
 * - /statistics : Page des statistiques et graphiques - Lazy loaded
 * - /quick-checkin : Check-in rapide (sans navigation, accessible via PWA shortcut) - Lazy loaded
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
        <Suspense fallback={<PageLoader />}>
          <Onboarding />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/habits',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <HabitList />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/habits/:id',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <HabitDetail />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/habits/:id/edit',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <EditHabit />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/create',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <CreateHabit />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/settings',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Settings />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/review',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <WeeklyReview />
        </Suspense>
      </MainLayout>
    ),
  },
  {
    path: '/statistics',
    element: (
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          <Statistics />
        </Suspense>
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
