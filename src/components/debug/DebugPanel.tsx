/**
 * Composant DebugPanel
 * Panneau de débogage accessible depuis les paramètres en mode debug
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebugMode, useAppData } from '../../hooks'
import {
  showNotification,
  NOTIFICATION_MESSAGES,
  getNotificationPermissionState,
} from '../../services/notifications'
import { STORAGE_KEY } from '../../services/storage'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import './DebugPanel.css'

/**
 * Noms des fichiers de test disponibles
 */
const TEST_DATA_FILES = [
  { id: 'goal-reached', name: "Atteinte d'objectif" },
  { id: 'growth-plateau', name: 'Arrêt de croissance' },
  { id: 'absence-detected', name: 'Absence détectée' },
  { id: 'weekly-review-due', name: 'Revue hebdomadaire' },
  { id: 'habit-stacking', name: 'Habitudes chaînées' },
  { id: 'planned-pause', name: 'Pause planifiée' },
  { id: 'full-scenario', name: 'Scénario complet' },
]

/**
 * DebugPanel component
 */
function DebugPanel() {
  const navigate = useNavigate()
  const { data, resetData } = useAppData()
  const {
    isDebugMode,
    simulatedDate,
    effectiveDate,
    disableDebugMode,
    setSimulatedDate,
    advanceOneDay,
    resetSimulatedDate,
  } = useDebugMode()

  const [showRawData, setShowRawData] = useState(false)
  const [dateInput, setDateInput] = useState(effectiveDate)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [loadingTestFile, setLoadingTestFile] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Show a temporary message
  const showMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }, [])

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  const handleTestNotification = useCallback(() => {
    const success = showNotification({
      title: 'Test Doucement',
      body: 'Notification de test',
      tag: 'doucement-test',
    })
    if (success) {
      showMessage('Notification envoyée')
    } else {
      showMessage(`Erreur: permission = ${getNotificationPermissionState()}`)
    }
  }, [showMessage])

  const handleTestMorningNotification = useCallback(() => {
    const { title, body } = NOTIFICATION_MESSAGES.morning
    showNotification({ title, body, tag: 'doucement-morning-test' })
    showMessage('Notification matinale envoyée')
  }, [showMessage])

  const handleTestEveningNotification = useCallback(() => {
    const { title, body } = NOTIFICATION_MESSAGES.evening
    showNotification({ title, body, tag: 'doucement-evening-test' })
    showMessage('Notification du soir envoyée')
  }, [showMessage])

  const handleTestWeeklyNotification = useCallback(() => {
    const { title, body } = NOTIFICATION_MESSAGES.weeklyReview
    showNotification({ title, body, tag: 'doucement-weekly-test' })
    showMessage('Notification de revue envoyée')
  }, [showMessage])

  // ============================================================================
  // SCREENS
  // ============================================================================

  const handleOpenWeeklyReview = useCallback(() => {
    navigate('/review')
  }, [navigate])

  const handleOpenOnboarding = useCallback(() => {
    navigate('/onboarding')
  }, [navigate])

  // ============================================================================
  // DATE SIMULATION
  // ============================================================================

  const handleSetDate = useCallback(() => {
    setSimulatedDate(dateInput)
    showMessage(`Date simulée: ${dateInput}`)
  }, [dateInput, setSimulatedDate, showMessage])

  const handleAdvanceDay = useCallback(() => {
    advanceOneDay()
    showMessage('Avancé de 1 jour')
  }, [advanceOneDay, showMessage])

  const handleResetDate = useCallback(() => {
    resetSimulatedDate()
    setDateInput(new Date().toISOString().split('T')[0])
    showMessage('Date réinitialisée')
  }, [resetSimulatedDate, showMessage])

  // ============================================================================
  // TEST DATA
  // ============================================================================

  const handleLoadTestFile = useCallback(
    async (fileId: string) => {
      setLoadingTestFile(true)
      try {
        const response = await fetch(`/test-data/${fileId}.json`)
        if (!response.ok) {
          throw new Error(`Fichier non trouvé: ${fileId}`)
        }
        const testData = await response.json()

        // Store to localStorage and reload
        localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))
        showMessage(`Données "${fileId}" chargées. Rechargement...`)
        setTimeout(() => window.location.reload(), 1000)
      } catch (error) {
        showMessage(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      } finally {
        setLoadingTestFile(false)
      }
    },
    [showMessage]
  )

  const handleExportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doucement-debug-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('Données exportées')
  }, [data, showMessage])

  const handleResetData = useCallback(() => {
    resetData()
    setShowResetConfirm(false)
    showMessage('Données réinitialisées')
    setTimeout(() => navigate('/onboarding'), 500)
  }, [resetData, navigate, showMessage])

  // ============================================================================
  // INSPECTION
  // ============================================================================

  const handleCopyData = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    showMessage('Données copiées')
  }, [data, showMessage])

  // If not in debug mode, don't render
  if (!isDebugMode) {
    return null
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel__header">
        <h2 className="debug-panel__title">Panneau Debug</h2>
        <Button variant="ghost" size="small" onClick={disableDebugMode}>
          Désactiver
        </Button>
      </div>

      {message && (
        <div className="debug-panel__message" role="status">
          {message}
        </div>
      )}

      {simulatedDate && (
        <div className="debug-panel__simulated-date-banner">
          Date simulée: {new Date(simulatedDate).toLocaleDateString('fr-FR')}
        </div>
      )}

      {/* Section: Notifications */}
      <section className="debug-panel__section">
        <h3 className="debug-panel__section-title">Notifications</h3>
        <div className="debug-panel__buttons">
          <Button variant="secondary" size="small" onClick={handleTestNotification}>
            Envoyer test
          </Button>
          <Button variant="secondary" size="small" onClick={handleTestMorningNotification}>
            Rappel matin
          </Button>
          <Button variant="secondary" size="small" onClick={handleTestEveningNotification}>
            Rappel soir
          </Button>
          <Button variant="secondary" size="small" onClick={handleTestWeeklyNotification}>
            Rappel revue
          </Button>
        </div>
        <p className="debug-panel__info">Permission: {getNotificationPermissionState()}</p>
      </section>

      {/* Section: Écrans */}
      <section className="debug-panel__section">
        <h3 className="debug-panel__section-title">Écrans spéciaux</h3>
        <div className="debug-panel__buttons">
          <Button variant="secondary" size="small" onClick={handleOpenWeeklyReview}>
            Ouvrir WeeklyReview
          </Button>
          <Button variant="secondary" size="small" onClick={handleOpenOnboarding}>
            Ouvrir Onboarding
          </Button>
        </div>
      </section>

      {/* Section: Date */}
      <section className="debug-panel__section">
        <h3 className="debug-panel__section-title">Simulation de date</h3>
        <div className="debug-panel__date-controls">
          <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
          <div className="debug-panel__buttons">
            <Button variant="secondary" size="small" onClick={handleSetDate}>
              Simuler
            </Button>
            <Button variant="secondary" size="small" onClick={handleAdvanceDay}>
              +1 jour
            </Button>
            <Button variant="ghost" size="small" onClick={handleResetDate}>
              Reset
            </Button>
          </div>
        </div>
        <p className="debug-panel__info">Date effective: {effectiveDate}</p>
      </section>

      {/* Section: Données de test */}
      <section className="debug-panel__section">
        <h3 className="debug-panel__section-title">Données de test</h3>
        <div className="debug-panel__test-files">
          {TEST_DATA_FILES.map((file) => (
            <Button
              key={file.id}
              variant="ghost"
              size="small"
              onClick={() => handleLoadTestFile(file.id)}
              disabled={loadingTestFile}
            >
              {file.name}
            </Button>
          ))}
        </div>
        <div className="debug-panel__buttons debug-panel__buttons--spaced">
          <Button variant="secondary" size="small" onClick={handleExportData}>
            Exporter
          </Button>
          <Button
            variant="ghost"
            size="small"
            className="debug-panel__button--danger"
            onClick={() => setShowResetConfirm(true)}
          >
            Réinitialiser
          </Button>
        </div>
      </section>

      {/* Section: Inspection */}
      <section className="debug-panel__section">
        <h3 className="debug-panel__section-title">Inspection</h3>
        <div className="debug-panel__buttons">
          <Button variant="secondary" size="small" onClick={() => setShowRawData(!showRawData)}>
            {showRawData ? 'Masquer JSON' : 'Afficher JSON'}
          </Button>
          <Button variant="secondary" size="small" onClick={handleCopyData}>
            Copier données
          </Button>
        </div>
        <p className="debug-panel__info">
          Schema v{data.schemaVersion} | {data.habits.length} habitudes | {data.entries.length}{' '}
          entrées
        </p>
        {showRawData && (
          <Card variant="default" className="debug-panel__raw-data">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Card>
        )}
      </section>

      {/* Modal: Confirmation reset */}
      {showResetConfirm && (
        <div className="debug-panel__modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div
            className="debug-panel__modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="debug-panel__modal-title">Réinitialiser les données ?</h3>
            <p className="debug-panel__modal-text">
              Cette action supprimera toutes les données de l'application.
            </p>
            <div className="debug-panel__modal-actions">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleResetData}
                className="debug-panel__button--danger"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel
