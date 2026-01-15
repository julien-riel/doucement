import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { PWAUpdatePrompt, WhatsNewModal } from './components/ui'
import { AppProvider, ErrorBoundary } from './components'
import { WhatsNewProvider, useWhatsNewContext } from './contexts'

/**
 * Contenu principal de l'app avec accès au contexte WhatsNew
 */
function AppContent() {
  const { showModal, release, currentVersion, dismissModal } = useWhatsNewContext()

  return (
    <>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
      {showModal && release && currentVersion && (
        <WhatsNewModal release={release} version={currentVersion} onDismiss={dismissModal} />
      )}
    </>
  )
}

/**
 * Application principale Doucement
 * Point d'entrée de l'application de suivi d'habitudes progressives
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <WhatsNewProvider>
          <AppContent />
        </WhatsNewProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
