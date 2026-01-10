/**
 * Tests unitaires du service de notifications
 * Couvre: permissions, scheduling, calcul de délais
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermissionState,
  requestNotificationPermission,
  showNotification,
  calculateDelayUntil,
  calculateDelayUntilNextSunday,
  scheduleReminder,
  cancelReminder,
  cancelAllReminders,
  scheduleAllReminders,
  canEnableNotifications,
  getPermissionStateMessage,
  NOTIFICATION_MESSAGES,
} from './notifications';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types';

// ============================================================================
// MOCKS
// ============================================================================

/**
 * Mock de l'API Notification
 */
class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn();

  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onclick: ((this: MockNotification, ev: Event) => unknown) | null = null;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.body = options?.body || '';
    this.icon = options?.icon;
    this.tag = options?.tag;
    this.requireInteraction = options?.requireInteraction;
  }

  close = vi.fn();
}

/**
 * Helper pour configurer le mock de Notification
 */
function setupNotificationMock(permission: NotificationPermission = 'default') {
  MockNotification.permission = permission;
  MockNotification.requestPermission.mockResolvedValue(permission);
  vi.stubGlobal('Notification', MockNotification);
}

/**
 * Helper pour supprimer le support des notifications
 */
function removeNotificationSupport() {
  vi.stubGlobal('Notification', undefined);
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createNotificationSettings = (
  overrides: Partial<NotificationSettings> = {}
): NotificationSettings => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  enabled: true,
  ...overrides,
});

// ============================================================================
// SETUP / TEARDOWN
// ============================================================================

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-15T10:00:00'));
  setupNotificationMock('granted');
  cancelAllReminders();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ============================================================================
// isNotificationSupported TESTS
// ============================================================================

describe('isNotificationSupported', () => {
  it('retourne true quand Notification est disponible', () => {
    setupNotificationMock();
    expect(isNotificationSupported()).toBe(true);
  });
});

// ============================================================================
// getNotificationPermissionState TESTS
// ============================================================================

describe('getNotificationPermissionState', () => {
  it('retourne "granted" quand permission accordée', () => {
    setupNotificationMock('granted');
    expect(getNotificationPermissionState()).toBe('granted');
  });

  it('retourne "denied" quand permission refusée', () => {
    setupNotificationMock('denied');
    expect(getNotificationPermissionState()).toBe('denied');
  });

  it('retourne "default" quand permission non demandée', () => {
    setupNotificationMock('default');
    expect(getNotificationPermissionState()).toBe('default');
  });
});

// ============================================================================
// requestNotificationPermission TESTS
// ============================================================================

describe('requestNotificationPermission', () => {
  it('retourne success quand permission déjà accordée', async () => {
    setupNotificationMock('granted');

    const result = await requestNotificationPermission();

    expect(result.success).toBe(true);
    expect(result.state).toBe('granted');
    expect(MockNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('retourne erreur quand permission déjà refusée', async () => {
    setupNotificationMock('denied');

    const result = await requestNotificationPermission();

    expect(result.success).toBe(false);
    expect(result.state).toBe('denied');
    expect(result.error).toContain('refusées');
    expect(MockNotification.requestPermission).not.toHaveBeenCalled();
  });

  it('demande la permission quand état par défaut', async () => {
    setupNotificationMock('default');
    MockNotification.requestPermission.mockResolvedValue('granted');

    const result = await requestNotificationPermission();

    expect(MockNotification.requestPermission).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.state).toBe('granted');
  });

  it('retourne erreur quand permission refusée après demande', async () => {
    setupNotificationMock('default');
    MockNotification.requestPermission.mockResolvedValue('denied');

    const result = await requestNotificationPermission();

    expect(result.success).toBe(false);
    expect(result.state).toBe('denied');
    expect(result.error).toBe('Permission refusée');
  });

  it('gère les erreurs de requestPermission', async () => {
    setupNotificationMock('default');
    MockNotification.requestPermission.mockRejectedValue(new Error('Test error'));

    const result = await requestNotificationPermission();

    expect(result.success).toBe(false);
    expect(result.state).toBe('default');
    expect(result.error).toBe('Test error');
  });
});

// ============================================================================
// showNotification TESTS
// ============================================================================

describe('showNotification', () => {
  it('crée une notification avec les options fournies', () => {
    setupNotificationMock('granted');

    const result = showNotification({
      title: 'Test',
      body: 'Corps du message',
      tag: 'test-tag',
    });

    expect(result).toBe(true);
  });

  it('retourne false quand permission non accordée', () => {
    setupNotificationMock('denied');

    const result = showNotification({
      title: 'Test',
      body: 'Corps du message',
    });

    expect(result).toBe(false);
  });
});

// ============================================================================
// calculateDelayUntil TESTS
// ============================================================================

describe('calculateDelayUntil', () => {
  it('calcule le délai jusqu\'à une heure future du même jour', () => {
    // Current time: 10:00
    const delay = calculateDelayUntil('14:00');

    // 4 hours = 4 * 60 * 60 * 1000 = 14400000 ms
    expect(delay).toBe(4 * 60 * 60 * 1000);
  });

  it('calcule le délai jusqu\'au lendemain si l\'heure est passée', () => {
    // Current time: 10:00
    const delay = calculateDelayUntil('08:00');

    // 22 hours until 08:00 tomorrow = 22 * 60 * 60 * 1000 = 79200000 ms
    expect(delay).toBe(22 * 60 * 60 * 1000);
  });

  it('calcule le délai correct pour minuit', () => {
    const delay = calculateDelayUntil('00:00');

    // 14 hours until 00:00 = 14 * 60 * 60 * 1000 = 50400000 ms
    expect(delay).toBe(14 * 60 * 60 * 1000);
  });

  it('gère les minutes correctement', () => {
    // Current time: 10:00
    const delay = calculateDelayUntil('10:30');

    // 30 minutes = 30 * 60 * 1000 = 1800000 ms
    expect(delay).toBe(30 * 60 * 1000);
  });
});

// ============================================================================
// calculateDelayUntilNextSunday TESTS
// ============================================================================

describe('calculateDelayUntilNextSunday', () => {
  it('calcule le délai jusqu\'au dimanche prochain', () => {
    // 2025-01-15 is a Wednesday (day 3)
    // Next Sunday is 2025-01-19 (4 days away)
    vi.setSystemTime(new Date('2025-01-15T10:00:00'));

    const delay = calculateDelayUntilNextSunday('10:00');

    // 4 days = 4 * 24 * 60 * 60 * 1000
    expect(delay).toBe(4 * 24 * 60 * 60 * 1000);
  });

  it('programme pour le dimanche suivant si c\'est dimanche mais l\'heure est passée', () => {
    // 2025-01-19 is a Sunday
    vi.setSystemTime(new Date('2025-01-19T14:00:00'));

    const delay = calculateDelayUntilNextSunday('10:00');

    // 7 days - 4 hours = 7 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000
    expect(delay).toBe(7 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000);
  });

  it('programme pour aujourd\'hui si c\'est dimanche et l\'heure n\'est pas passée', () => {
    // 2025-01-19 is a Sunday
    vi.setSystemTime(new Date('2025-01-19T08:00:00'));

    const delay = calculateDelayUntilNextSunday('10:00');

    // 2 hours = 2 * 60 * 60 * 1000
    expect(delay).toBe(2 * 60 * 60 * 1000);
  });
});

// ============================================================================
// scheduleReminder TESTS
// ============================================================================

describe('scheduleReminder', () => {
  it('programme un rappel avec setTimeout', () => {
    setupNotificationMock('granted');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    scheduleReminder('morning', { enabled: true, time: '14:00' });

    // Should have scheduled a timeout
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('ne programme pas si disabled', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    scheduleReminder('morning', { enabled: false, time: '08:00' });

    // Should not call setTimeout for scheduling
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('annule le rappel existant avant d\'en programmer un nouveau', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    scheduleReminder('morning', { enabled: true, time: '08:00' });
    scheduleReminder('morning', { enabled: true, time: '09:00' });

    // Should have cleared the first timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('appelle checkCondition quand le timeout expire', () => {
    setupNotificationMock('granted');
    const checkCondition = vi.fn().mockReturnValue(false);

    scheduleReminder('evening', { enabled: true, time: '14:00' }, checkCondition);

    // Advance time to trigger
    vi.advanceTimersByTime(4 * 60 * 60 * 1000);

    expect(checkCondition).toHaveBeenCalled();
  });
});

// ============================================================================
// cancelReminder TESTS
// ============================================================================

describe('cancelReminder', () => {
  it('annule un rappel programmé', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    scheduleReminder('morning', { enabled: true, time: '14:00' });
    cancelReminder('morning');

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('ne fait rien si le rappel n\'existe pas', () => {
    // Should not throw
    expect(() => cancelReminder('morning')).not.toThrow();
  });
});

// ============================================================================
// cancelAllReminders TESTS
// ============================================================================

describe('cancelAllReminders', () => {
  it('annule tous les rappels programmés', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    scheduleReminder('morning', { enabled: true, time: '08:00' });
    scheduleReminder('evening', { enabled: true, time: '20:00' });
    scheduleReminder('weeklyReview', { enabled: true, time: '10:00' });

    cancelAllReminders();

    // Should have cleared all timeouts
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(3);
  });
});

// ============================================================================
// scheduleAllReminders TESTS
// ============================================================================

describe('scheduleAllReminders', () => {
  it('programme tous les rappels actifs', () => {
    setupNotificationMock('granted');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const settings = createNotificationSettings({
      morningReminder: { enabled: true, time: '08:00' },
      eveningReminder: { enabled: true, time: '20:00' },
      weeklyReviewReminder: { enabled: true, time: '10:00' },
    });

    scheduleAllReminders(settings);

    // Should have scheduled 3 reminders (plus potential SW messages)
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('ne programme rien si notifications désactivées globalement', () => {
    setupNotificationMock('granted');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const settings = createNotificationSettings({ enabled: false });

    scheduleAllReminders(settings);

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('ne programme rien si permission non accordée', () => {
    setupNotificationMock('denied');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const settings = createNotificationSettings({ enabled: true });

    scheduleAllReminders(settings);

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('utilise checkEveningCondition pour le rappel du soir', () => {
    setupNotificationMock('granted');
    const checkCondition = vi.fn().mockReturnValue(true);

    const settings = createNotificationSettings({
      eveningReminder: { enabled: true, time: '14:00' },
    });

    scheduleAllReminders(settings, checkCondition);

    // Advance time to trigger
    vi.advanceTimersByTime(4 * 60 * 60 * 1000);

    expect(checkCondition).toHaveBeenCalled();
  });
});

// ============================================================================
// canEnableNotifications TESTS
// ============================================================================

describe('canEnableNotifications', () => {
  it('retourne true quand supporté et permission non refusée', () => {
    setupNotificationMock('default');
    expect(canEnableNotifications()).toBe(true);
  });

  it('retourne true quand permission accordée', () => {
    setupNotificationMock('granted');
    expect(canEnableNotifications()).toBe(true);
  });

  it('retourne false quand permission refusée', () => {
    setupNotificationMock('denied');
    expect(canEnableNotifications()).toBe(false);
  });
});

// ============================================================================
// getPermissionStateMessage TESTS
// ============================================================================

describe('getPermissionStateMessage', () => {
  it('retourne message pour granted', () => {
    setupNotificationMock('granted');
    expect(getPermissionStateMessage()).toBe('Notifications autorisées');
  });

  it('retourne message pour denied', () => {
    setupNotificationMock('denied');
    expect(getPermissionStateMessage()).toContain('Notifications bloquées');
  });

  it('retourne message pour default', () => {
    setupNotificationMock('default');
    expect(getPermissionStateMessage()).toContain('Cliquez pour activer');
  });
});

// ============================================================================
// NOTIFICATION_MESSAGES TESTS
// ============================================================================

describe('NOTIFICATION_MESSAGES', () => {
  it('contient les messages pour tous les types de rappels', () => {
    expect(NOTIFICATION_MESSAGES.morning).toBeDefined();
    expect(NOTIFICATION_MESSAGES.evening).toBeDefined();
    expect(NOTIFICATION_MESSAGES.weeklyReview).toBeDefined();
  });

  it('a un titre et un corps pour chaque message', () => {
    expect(NOTIFICATION_MESSAGES.morning.title).toBe('Doucement');
    expect(NOTIFICATION_MESSAGES.morning.body).toContain('dose du jour');

    expect(NOTIFICATION_MESSAGES.evening.title).toBe('Doucement');
    expect(NOTIFICATION_MESSAGES.evening.body).toContain('enregistré');

    expect(NOTIFICATION_MESSAGES.weeklyReview.title).toBe('Doucement');
    expect(NOTIFICATION_MESSAGES.weeklyReview.body).toContain('revue hebdomadaire');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('intégration notifications', () => {
  it('cycle complet: schedule -> cancel -> vérifier annulation', () => {
    setupNotificationMock('granted');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    // Schedule morning reminder at 14:00
    scheduleReminder('morning', { enabled: true, time: '14:00' });
    expect(setTimeoutSpy).toHaveBeenCalled();

    // Cancel reminder
    cancelReminder('morning');
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('rappel du soir vérifie la condition avant affichage', () => {
    setupNotificationMock('granted');
    let callCount = 0;
    const checkCondition = vi.fn(() => {
      callCount++;
      return false; // Ne jamais afficher
    });

    scheduleReminder('evening', { enabled: true, time: '14:00' }, checkCondition);

    // First trigger - condition called
    vi.advanceTimersByTime(4 * 60 * 60 * 1000);
    expect(checkCondition).toHaveBeenCalled();
    expect(callCount).toBeGreaterThan(0);
  });

  it('scheduleAllReminders puis cancelAllReminders', () => {
    setupNotificationMock('granted');
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const settings = createNotificationSettings({
      morningReminder: { enabled: true, time: '08:00' },
      eveningReminder: { enabled: true, time: '20:00' },
    });

    scheduleAllReminders(settings);
    cancelAllReminders();

    // All reminders should be cleared
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
