import { RouterProvider } from 'react-router-dom'
import { router } from './router'

/**
 * Application principale Doucement
 * Point d'entrée de l'application de suivi d'habitudes progressives
 */
function App() {
  return <RouterProvider router={router} />
}

export default App
