import { Injectable, signal, computed, inject } from '@angular/core';
import { AppNotification, NotificationLevel } from '../models/notification.model';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { LanguageService } from './language.service';
import { AlertService } from './alert.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { NOTIFICATION_CONFIG } from '../config/notification.config';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([]);
  private unreadCountSignal = computed(() => this.notificationsSignal().filter(n => !n.read).length);
  private lastEmittedAtByKey = new Map<string, number>();
  private cooldownMs = NOTIFICATION_CONFIG.COOLDOWN_MS;
  private quietHours: { enabled: boolean; startHour: number; endHour: number } = { 
    enabled: NOTIFICATION_CONFIG.QUIET_HOURS.ENABLED, 
    startHour: NOTIFICATION_CONFIG.QUIET_HOURS.START_HOUR, 
    endHour: NOTIFICATION_CONFIG.QUIET_HOURS.END_HOUR 
  };
  private enabledLevels = signal<{ [K in NotificationLevel]: boolean }>(NOTIFICATION_CONFIG.DEFAULT_ENABLED_LEVELS);
  private enabledSources = signal<{ [k: string]: boolean }>(NOTIFICATION_CONFIG.DEFAULT_ENABLED_SOURCES);
  private socket?: Socket;
  private fallbackPollingInterval?: number;
  private isWebSocketConnected = false;
  public newNotification$ = new Subject<AppNotification>();
  private unreadCounterSignal = signal<number>(0);
  public readonly unreadSignal = this.unreadCounterSignal;

  // Action status events
  public actionAcknowledged$ = new Subject<any>();
  public actionFailed$ = new Subject<any>();
  public actionTimeout$ = new Subject<any>();
  public deviceStatus$ = new Subject<any>();

  constructor(
    private auth: AuthService, 
    private languageService: LanguageService, 
    private alertService: AlertService,
    private logger: LoggerService
  ) {}
  initSocket() {
    if (this.socket) return;
    const wsUrl = environment.wsUrl;
    this.logger.logWithPrefix('🔌 [WEBSOCKET]', 'Initializing Socket.IO connection to', wsUrl);

    // Add connection options for better reliability
    this.socket = io(wsUrl, {
      transports: NOTIFICATION_CONFIG.WEBSOCKET.TRANSPORTS as any,
      timeout: NOTIFICATION_CONFIG.WEBSOCKET.TIMEOUT,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: NOTIFICATION_CONFIG.WEBSOCKET.MAX_RETRIES,
      reconnectionDelay: NOTIFICATION_CONFIG.WEBSOCKET.RETRY_DELAY,
    });

    this.socket.on('connect', () => {
      this.logger.logWithPrefix('✅ [WEBSOCKET]', 'Connected to backend successfully');
      this.logger.logWithPrefix('🔗 [WEBSOCKET]', 'Socket ID:', this.socket?.id);
      this.isWebSocketConnected = true;
      // Stop fallback polling if WebSocket is connected
      if (this.fallbackPollingInterval) {
        clearInterval(this.fallbackPollingInterval);
        this.fallbackPollingInterval = undefined;
        this.logger.logWithPrefix('🔄 [WEBSOCKET]', 'Stopped fallback polling - WebSocket connected');
      }
    });

    // Debug: Log all WebSocket events
    this.socket.onAny((eventName: string, ...args: any[]) => {
      this.logger.debug(`🔍 [WEBSOCKET] Event received: ${eventName}`, args);
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.logWithPrefix('🔌 [WEBSOCKET]', 'Disconnected from backend:', reason);
      this.isWebSocketConnected = false;
      // Start fallback polling if WebSocket disconnects
      this.startFallbackPolling();
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('❌ [WEBSOCKET] Connection error', error, {
        message: error.message,
        description: (error as any).description,
        context: (error as any).context,
        type: (error as any).type
      });
      // Start fallback polling immediately on connection error
      this.isWebSocketConnected = false;
      this.startFallbackPolling();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.logger.logWithPrefix('🔄 [WEBSOCKET]', 'Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      this.logger.error('🔄❌ [WEBSOCKET] Reconnection error', error);
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('🔄❌ [WEBSOCKET] Reconnection failed after all attempts');
      this.isWebSocketConnected = false;
      // Start fallback polling if all reconnection attempts fail
      this.startFallbackPolling();
    });

    // Add a timeout to start fallback polling if WebSocket doesn't connect
    setTimeout(() => {
      if (!this.isWebSocketConnected && !this.fallbackPollingInterval) {
        this.logger.logWithPrefix('⏰ [WEBSOCKET]', 'Connection timeout - starting fallback polling');
        this.startFallbackPolling();
      }
    }, NOTIFICATION_CONFIG.WEBSOCKET.FALLBACK_TIMEOUT);
    this.socket.on('notification.created', (n: any) => {
      this.logger.logWithPrefix('🔔 [WEBSOCKET]', 'Received notification:', n);
      const currentUserId = this.auth.user()?.user_id;
      this.logger.debug('👤 [WEBSOCKET] Current user ID:', currentUserId);
      this.logger.debug('📧 [WEBSOCKET] Notification user ID:', n?.user_id);

      if (n?.user_id && currentUserId && n.user_id !== currentUserId) {
        this.logger.debug('❌ [WEBSOCKET] Notification not for current user, ignoring');
        return; // not for this user
      }

      this.logger.logWithPrefix('✅ [WEBSOCKET]', 'Processing notification for current user');
      // Only add if for current user; client may not have user here, but we can accept and filter by preferences
      const appN: AppNotification = {
        id: n.id,
        level: n.level,
        title: n.title,
        message: n.message,
        createdAt: n.created_at || new Date().toISOString(),
        read: false,
        source: n.source,
        context: n.context,
      };
      this.notificationsSignal.update(list => [appN, ...list]);
      this.newNotification$.next(appN);
      // increment unread counter
      this.unreadCounterSignal.update(v => v + 1);
      this.logger.debug('📊 [WEBSOCKET] Updated unread count:', this.unreadCounterSignal());
      // Toast for critical/success
      this.notify(appN.level, appN.title, appN.message);
    });

    // Listen for action acknowledgment events
    this.socket.on('action.acknowledged', (data: any) => {
      this.logger.logWithPrefix('🎯 [WEBSOCKET]', 'Action acknowledged:', data);
      this.actionAcknowledged$.next(data);
    });

    // Listen for action failure events
    this.socket.on('action.failed', (data: any) => {
      this.logger.logWithPrefix('❌ [WEBSOCKET]', 'Action failed:', data);
      this.actionFailed$.next(data);
    });

    // Listen for action timeout events
    this.socket.on('action.timeout', (data: any) => {
      this.logger.logWithPrefix('⏰ [WEBSOCKET]', 'Action timeout:', data);
      this.actionTimeout$.next(data);
    });

    // Listen for device status updates
    this.socket.on('device.status', (data: any) => {
      this.logger.debug('📊 [WEBSOCKET] Device status:', data);
      this.deviceStatus$.next(data);
    });
  }

  setUnreadCountFromApi(count: number) {
    this.unreadCounterSignal.set(count);
  }

  decrementUnread(by: number = 1) {
    this.unreadCounterSignal.update(v => Math.max(0, v - by));
  }

  incrementUnread(by: number = 1) {
    this.unreadCounterSignal.update(v => v + by);
  }

  unreadCounter() { return this.unreadCounterSignal(); }

  notifications() { return this.notificationsSignal(); }
  unreadCount() { return this.unreadCountSignal(); }
  getPreferences() { return { cooldownMs: this.cooldownMs, quietHours: { ...this.quietHours }, levels: this.enabledLevels(), sources: this.enabledSources() }; }

  notify(level: NotificationLevel, title: string, message?: string, options?: Partial<AppNotification>) {
    const id = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : Math.random().toString(36).slice(2);
    const n: AppNotification = {
      id,
      level,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      ...options
    };

    // Rate limiting using config
    this.notificationsSignal.update(list => [n, ...list].slice(0, NOTIFICATION_CONFIG.CACHE.MAX_SIZE));

    // Toast for immediate feedback
    const alertMessage = message || '';
    if (level === 'critical') {
      this.alertService.error(title, alertMessage);
    } else if (level === 'info' || level === 'success') {
      this.alertService.success(title, alertMessage);
    } else if (level === 'warning') {
      this.alertService.warning(title, alertMessage);
    }

    return n.id;
  }

  shouldNotify(key: string, priority: NotificationLevel): boolean {
    // quiet hours (except critical)
    if (this.quietHours.enabled && priority !== 'critical') {
      const hour = new Date().getHours();
      const { startHour, endHour } = this.quietHours;
      const inQuiet = startHour < endHour ? (hour >= startHour && hour < endHour) : (hour >= startHour || hour < endHour);
      if (inQuiet) return false;
    }
    if (!this.enabledLevels()[priority]) return false;
    const now = Date.now();
    const last = this.lastEmittedAtByKey.get(key) || 0;
    if (now - last < this.cooldownMs) return false;
    this.lastEmittedAtByKey.set(key, now);
    return true;
  }

  setCooldownMinutes(minutes: number) {
    this.cooldownMs = Math.max(0, minutes) * 60 * 1000;
  }

  setQuietHours(enabled: boolean, startHour?: number, endHour?: number) {
    this.quietHours.enabled = enabled;
    if (startHour != null) this.quietHours.startHour = startHour;
    if (endHour != null) this.quietHours.endHour = endHour;
  }

  setLevelEnabled(level: NotificationLevel, enabled: boolean) {
    const current = this.enabledLevels();
    this.enabledLevels.set({ ...current, [level]: enabled });
  }

  setSourceEnabled(source: string, enabled: boolean) {
    const current = this.enabledSources();
    this.enabledSources.set({ ...current, [source]: enabled });
  }

  isSourceEnabled(source?: string): boolean {
    if (!source) return true;
    const map = this.enabledSources();
    return map[source] !== false;
  }

  markRead(id: string) {
    this.notificationsSignal.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllRead() {
    this.notificationsSignal.update(list => list.map(n => ({ ...n, read: true })));
  }

  remove(id: string) {
    this.notificationsSignal.update(list => list.filter(n => n.id !== id));
  }

  // Method to add notifications without triggering notify logic (for loading from API)
  addNotifications(notifications: AppNotification[]) {
    this.notificationsSignal.update(list => [...notifications, ...list]);
  }

  // Fallback polling method when WebSocket is not available
  private startFallbackPolling() {
    if (this.fallbackPollingInterval) return; // Already polling
    if (!NOTIFICATION_CONFIG.POLLING.ENABLED) return; // Polling disabled

    this.logger.logWithPrefix('🔄 [FALLBACK]', 'Starting fallback polling for notifications');
    this.fallbackPollingInterval = window.setInterval(() => {
      this.pollForNotifications();
    }, NOTIFICATION_CONFIG.POLLING.INTERVAL);
  }

  private async pollForNotifications() {
    try {
      this.logger.debug('🔄 [FALLBACK] Polling for notifications...');

      // Note: This requires ApiService to be injected
      // For now, we'll skip the actual API call to avoid circular dependency
      // In production, you should inject ApiService and implement this:
      /*
      const response = await this.api.getNotifications({ 
        limit: 10, 
        offset: 0,
        is_read: '0'  // Only unread
      }).toPromise();
      
      if (response?.items && response.items.length > 0) {
        response.items.forEach(n => this.processNotification(n));
      }
      */
    } catch (error) {
      this.logger.error('❌ [FALLBACK] Error polling for notifications', error);
    }
  }

  private processNotification(n: any) {
    const currentUserId = this.auth.user()?.user_id;
    if (n?.user_id && currentUserId && n.user_id !== currentUserId) {
  return; // not for this user
    }

    const appN: AppNotification = {
      id: n.id,
      level: n.level,
      title: n.title,
      message: n.message,
      createdAt: n.created_at || new Date().toISOString(),
      read: false,
      source: n.source,
  context: n.context,
    };

    this.notificationsSignal.update(list => [appN, ...list]);
    this.newNotification$.next(appN);
    this.unreadCounterSignal.update(v => v + 1);
    this.notify(appN.level, appN.title, appN.message);
  }

  // Debug method to test notifications manually (development only)
  testNotification() {
    if (environment.production) {
      this.logger.warn('testNotification() called in production - ignoring');
      return;
    }

    this.logger.logWithPrefix('🧪 [TEST]', 'Creating test notification');
    const testNotification: AppNotification = {
      id: 'test-' + Date.now(),
      level: 'success',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      createdAt: new Date().toISOString(),
      read: false,
      source: 'system',
      context: { test: true }
    };

    this.notificationsSignal.update(list => [testNotification, ...list]);
    this.newNotification$.next(testNotification);
    this.unreadCounterSignal.update(v => v + 1);
    this.notify(testNotification.level, testNotification.title, testNotification.message);

    // Test WebSocket emission to backend
    if (this.socket && this.socket.connected) {
      this.logger.logWithPrefix('🧪 [TEST]', 'Emitting test notification to backend via WebSocket');
      this.socket.emit('test.notification', {
        level: 'info',
        title: 'Frontend Test',
        message: 'Test notification from frontend',
        source: 'frontend_test'
      });
    } else {
      this.logger.warn('❌ [TEST] WebSocket not connected, cannot emit to backend');
    }
  }
}
