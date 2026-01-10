import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from './Button'
import './PWAUpdatePrompt.css'

/**
 * Component that prompts users to update the PWA when a new version is available.
 * Shows a non-intrusive banner at the bottom of the screen.
 */
export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl, registration) {
      // Check for updates every hour
      if (registration) {
        setInterval(
          () => {
            registration.update()
          },
          60 * 60 * 1000
        )
      }
      console.log('SW registered:', swScriptUrl)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  useEffect(() => {
    setShowPrompt(needRefresh)
  }, [needRefresh])

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setNeedRefresh(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="pwa-update-prompt" role="alert" aria-live="polite">
      <div className="pwa-update-prompt__content">
        <span className="pwa-update-prompt__message">Une nouvelle version est disponible</span>
        <div className="pwa-update-prompt__actions">
          <Button variant="ghost" size="small" onClick={handleDismiss}>
            Plus tard
          </Button>
          <Button variant="primary" size="small" onClick={handleUpdate}>
            Mettre à jour
          </Button>
        </div>
      </div>
    </div>
  )
}
