import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { PWAUpdatePrompt } from './components/ui'
import { AppProvider } from './components'

/**
 * Application principale Doucement
 * Point d'entrée de l'application de suivi d'habitudes progressives
 */
function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
    </AppProvider>
  )
}

export default App
