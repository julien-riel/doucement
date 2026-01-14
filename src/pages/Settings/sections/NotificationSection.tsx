/**
 * NotificationSection - Section des paramètres de notifications
 */
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppData } from '../../../hooks'
import { NotificationSettings as NotificationSettingsType } from '../../../types'
import NotificationSettings from '../../../components/ui/NotificationSettings'
import { getCurrentDate } from '../../../utils'

/**
 * Section de configuration des notifications
 */
export function NotificationSection() {
  const { t } = useTranslation()
  const { data, updatePreferences, getEntriesForDate, activeHabits } = useAppData()

  /**
   * Met à jour les paramètres de notifications
   */
  const handleNotificationSettingsChange = useCallback(
    (settings: NotificationSettingsType) => {
      updatePreferences({
        notifications: settings,
      })
    },
    [updatePreferences]
  )

  /**
   * Vérifie si le rappel du soir doit être envoyé
   * (si aucune entrée enregistrée pour aujourd'hui)
   */
  const checkEveningCondition = useMemo(() => {
    return () => {
      const today = getCurrentDate()
      const todayEntries = getEntriesForDate(today)
      // Envoyer le rappel si moins d'entrées que d'habitudes actives
      return todayEntries.length < activeHabits.length
    }
  }, [getEntriesForDate, activeHabits.length])

  return (
    <section className="settings__section" aria-labelledby="section-notifications">
      <h2 id="section-notifications" className="settings__section-title">
        {t('settings.notifications.title')}
      </h2>

      <NotificationSettings
        settings={data.preferences.notifications}
        onChange={handleNotificationSettingsChange}
        checkEveningCondition={checkEveningCondition}
      />
    </section>
  )
}
