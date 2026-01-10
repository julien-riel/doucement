import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { PWAUpdatePrompt } from './components/ui'

/**
 * Application principale Doucement
 * Point d'entrée de l'application de suivi d'habitudes progressives
 */
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
    </>
  )
}

export default App
