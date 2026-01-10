/**
 * NotificationSettings Component
 * UI pour activer/désactiver les notifications et configurer les heures de rappel
 *
 * Principes:
 * - Opt-in uniquement (désactivées par défaut)
 * - 100% locales (aucun serveur push)
 * - Non intrusives (ton bienveillant)
 */
import { useState, useCallback, useEffect } from 'react';
import {
  NotificationSettings as NotificationSettingsType,
  ReminderConfig,
  ReminderType,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../types';
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  isNotificationSupported,
  scheduleAllReminders,
  cancelAllReminders,
  NotificationPermissionState,
} from '../../services/notifications';
import Card from './Card';
import Button from './Button';
import './NotificationSettings.css';

/**
 * Props du composant NotificationSettings
 */
interface NotificationSettingsProps {
  /** Paramètres de notifications actuels */
  settings: NotificationSettingsType;
  /** Callback appelé quand les paramètres changent */
  onChange: (settings: NotificationSettingsType) => void;
  /** Fonction pour vérifier si le rappel du soir doit être envoyé */
  checkEveningCondition?: () => boolean;
}

/**
 * Labels pour les types de rappel
 */
const REMINDER_LABELS: Record<ReminderType, { title: string; description: string }> = {
  morning: {
    title: 'Rappel matinal',
    description: 'Votre dose du jour vous attend',
  },
  evening: {
    title: 'Rappel du soir',
    description: 'Si journée non enregistrée',
  },
  weeklyReview: {
    title: 'Revue hebdomadaire',
    description: 'Chaque dimanche',
  },
};

/**
 * Messages d'état de permission
 */
const PERMISSION_MESSAGES: Record<NotificationPermissionState, string> = {
  granted: 'Notifications autorisées',
  denied: 'Notifications bloquées par le navigateur',
  default: 'Autorisez les notifications pour recevoir des rappels',
  unsupported: 'Votre navigateur ne supporte pas les notifications',
};

/**
 * Composant pour configurer un rappel individuel
 */
function ReminderToggle({
  type,
  config,
  disabled,
  onChange,
}: {
  type: ReminderType;
  config: ReminderConfig;
  disabled: boolean;
  onChange: (config: ReminderConfig) => void;
}) {
  const { title, description } = REMINDER_LABELS[type];

  const handleToggle = useCallback(() => {
    onChange({ ...config, enabled: !config.enabled });
  }, [config, onChange]);

  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...config, time: e.target.value });
    },
    [config, onChange]
  );

  return (
    <div className={`reminder-toggle ${disabled ? 'reminder-toggle--disabled' : ''}`}>
      <div className="reminder-toggle__header">
        <div className="reminder-toggle__info">
          <span className="reminder-toggle__title">{title}</span>
          <span className="reminder-toggle__description">{description}</span>
        </div>
        <label className="reminder-toggle__switch">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleToggle}
            disabled={disabled}
            aria-label={`${config.enabled ? 'Désactiver' : 'Activer'} ${title.toLowerCase()}`}
          />
          <span className="reminder-toggle__slider" />
        </label>
      </div>
      {config.enabled && !disabled && (
        <div className="reminder-toggle__time">
          <label className="reminder-toggle__time-label">
            Heure
            <input
              type="time"
              value={config.time}
              onChange={handleTimeChange}
              className="reminder-toggle__time-input"
              aria-label={`Heure du ${title.toLowerCase()}`}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/**
 * Composant principal de configuration des notifications
 */
function NotificationSettings({
  settings: rawSettings,
  onChange,
  checkEveningCondition,
}: NotificationSettingsProps) {
  // Merge with defaults to handle missing fields from old data
  const settings: NotificationSettingsType = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...rawSettings,
    morningReminder: { ...DEFAULT_NOTIFICATION_SETTINGS.morningReminder, ...rawSettings?.morningReminder },
    eveningReminder: { ...DEFAULT_NOTIFICATION_SETTINGS.eveningReminder, ...rawSettings?.eveningReminder },
    weeklyReviewReminder: { ...DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewReminder, ...rawSettings?.weeklyReviewReminder },
  };

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(
    getNotificationPermissionState()
  );
  const [isRequesting, setIsRequesting] = useState(false);

  // Mettre à jour l'état de permission au montage
  useEffect(() => {
    setPermissionState(getNotificationPermissionState());
  }, []);

  // Programmer les rappels quand les paramètres changent
  useEffect(() => {
    if (settings.enabled && permissionState === 'granted') {
      scheduleAllReminders(settings, checkEveningCondition);
    } else {
      cancelAllReminders();
    }

    return () => {
      // Cleanup: annuler les rappels au démontage
      cancelAllReminders();
    };
  }, [settings, permissionState, checkEveningCondition]);

  /**
   * Demande la permission de notification
   */
  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    const result = await requestNotificationPermission();
    setPermissionState(result.state);
    setIsRequesting(false);

    if (result.success) {
      // Activer les notifications si permission accordée
      onChange({
        ...settings,
        enabled: true,
      });
    }
  }, [settings, onChange]);

  /**
   * Active/désactive les notifications globalement
   */
  const handleToggleEnabled = useCallback(() => {
    if (!settings.enabled && permissionState !== 'granted') {
      // Si on essaie d'activer mais pas de permission, demander d'abord
      handleRequestPermission();
      return;
    }

    onChange({
      ...settings,
      enabled: !settings.enabled,
    });
  }, [settings, permissionState, onChange, handleRequestPermission]);

  /**
   * Met à jour un rappel spécifique
   */
  const handleReminderChange = useCallback(
    (type: ReminderType, config: ReminderConfig) => {
      const key = `${type}Reminder` as keyof Pick<
        NotificationSettingsType,
        'morningReminder' | 'eveningReminder' | 'weeklyReviewReminder'
      >;
      onChange({
        ...settings,
        [key]: config,
      });
    },
    [settings, onChange]
  );

  /**
   * Réinitialise les paramètres par défaut
   */
  const handleReset = useCallback(() => {
    onChange({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      enabled: settings.enabled && permissionState === 'granted',
    });
  }, [settings.enabled, permissionState, onChange]);

  const isSupported = isNotificationSupported();
  const canEnable = isSupported && permissionState !== 'denied';
  const isEnabled = settings.enabled && permissionState === 'granted';

  return (
    <div className="notification-settings">
      {/* État global */}
      <Card variant="default" className="notification-settings__card">
        <div className="notification-settings__header">
          <div className="notification-settings__info">
            <span className="notification-settings__title">
              {isEnabled ? '🔔' : '🔕'} Notifications
            </span>
            <span className="notification-settings__status">
              {PERMISSION_MESSAGES[permissionState]}
            </span>
          </div>

          {canEnable && permissionState === 'granted' && (
            <label className="reminder-toggle__switch reminder-toggle__switch--large">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={handleToggleEnabled}
                aria-label={isEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
              />
              <span className="reminder-toggle__slider" />
            </label>
          )}

          {canEnable && permissionState !== 'granted' && (
            <Button
              variant="primary"
              size="small"
              onClick={handleRequestPermission}
              disabled={isRequesting}
            >
              {isRequesting ? 'Demande...' : 'Activer'}
            </Button>
          )}

          {permissionState === 'denied' && (
            <span className="notification-settings__blocked-badge">Bloquées</span>
          )}
        </div>

        {permissionState === 'denied' && (
          <p className="notification-settings__help">
            Pour recevoir des rappels, autorisez les notifications dans les paramètres de votre
            navigateur, puis rechargez la page.
          </p>
        )}
      </Card>

      {/* Configuration des rappels */}
      {isEnabled && (
        <Card variant="default" className="notification-settings__card notification-settings__reminders">
          <h4 className="notification-settings__section-title">Rappels</h4>

          <ReminderToggle
            type="morning"
            config={settings.morningReminder}
            disabled={!isEnabled}
            onChange={(config) => handleReminderChange('morning', config)}
          />

          <ReminderToggle
            type="evening"
            config={settings.eveningReminder}
            disabled={!isEnabled}
            onChange={(config) => handleReminderChange('evening', config)}
          />

          <ReminderToggle
            type="weeklyReview"
            config={settings.weeklyReviewReminder}
            disabled={!isEnabled}
            onChange={(config) => handleReminderChange('weeklyReview', config)}
          />

          <button
            type="button"
            className="notification-settings__reset"
            onClick={handleReset}
            aria-label="Réinitialiser les paramètres de notification"
          >
            Réinitialiser les valeurs par défaut
          </button>
        </Card>
      )}

      {/* Message d'aide si non supporté */}
      {!isSupported && (
        <p className="notification-settings__unsupported">
          Installez l'application sur votre appareil pour recevoir des rappels.
        </p>
      )}
    </div>
  );
}

export default NotificationSettings;
