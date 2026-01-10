import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { PWAUpdatePrompt, WhatsNewModal } from './components/ui'
import { AppProvider } from './components'
import { useWhatsNew } from './hooks'

/**
 * Application principale Doucement
 * Point d'entrée de l'application de suivi d'habitudes progressives
 */
function App() {
  const { showModal, release, currentVersion, dismissModal } = useWhatsNew()

  return (
    <AppProvider>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
      {showModal && release && currentVersion && (
        <WhatsNewModal
          release={release}
          version={currentVersion}
          onDismiss={dismissModal}
        />
      )}
    </AppProvider>
  )
}

export default App
