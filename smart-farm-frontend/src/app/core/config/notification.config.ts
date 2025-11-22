/**
 * Centralized Notification System Configuration
 * All hard-coded values extracted to this single source of truth
 */

export const NOTIFICATION_CONFIG = {
  // Cooldown and rate limiting
  COOLDOWN_MS: 15 * 60 * 1000, // 15 minutes between duplicate notifications
  
  // Quiet hours (10PM - 6AM by default)
  QUIET_HOURS: {
    ENABLED: true,
    START_HOUR: 22, // 10 PM
    END_HOUR: 6     // 6 AM
  },
  
  // WebSocket configuration
  WEBSOCKET: {
    TIMEOUT: 10000,           // 10 seconds
    MAX_RETRIES: 5,           // Maximum reconnection attempts
    RETRY_DELAY: 1000,        // 1 second between retries
    FALLBACK_TIMEOUT: 5000,   // 5 seconds before starting fallback polling
    TRANSPORTS: ['websocket', 'polling']
  },
  
  // Fallback polling configuration
  POLLING: {
    INTERVAL: 5000,           // Poll every 5 seconds
    ENABLED: true,            // Enable fallback polling
    MAX_RETRIES: 3            // Maximum polling retry attempts
  },
  
  // Cache and pagination
  CACHE: {
    MAX_SIZE: 100,            // Maximum notifications in memory
    PAGE_SIZE: 20,            // Items per page
    INITIAL_LOAD: 20          // Initial load size
  },
  
  // Auto-refresh settings
  AUTO_REFRESH: {
    ENABLED: true,
    INTERVAL_MS: 30000        // 30 seconds
  },
  
  // Toast/Alert durations (in milliseconds)
  DURATIONS: {
    SUCCESS: 3000,            // 3 seconds
    ERROR: 5000,              // 5 seconds
    WARNING: 4000,            // 4 seconds
    INFO: 3000,               // 3 seconds
    ALERT_SUCCESS: 5000,      // 5 seconds
    ALERT_ERROR: 7000,        // 7 seconds
    ALERT_WARNING: 6000,      // 6 seconds
    ALERT_INFO: 5000          // 5 seconds
  },
  
  // Notification levels enabled by default
  DEFAULT_ENABLED_LEVELS: {
    critical: true,
    warning: true,
    info: true,
    success: true
  },
  
  // Notification sources enabled by default
  DEFAULT_ENABLED_SOURCES: {
    sensor: true,
    device: true,
    action: true,
    system: true,
    maintenance: true,
    security: true
  },
  
  // UI Configuration
  UI: {
    SEARCH_DEBOUNCE_MS: 300,  // Debounce search input
    ANIMATION_DURATION: 300,  // Animation duration in ms
    TRANSITION_DURATION: 300  // Transition duration in ms
  }
} as const;

/**
 * Toast notification durations by type
 */
export const TOAST_DURATIONS = {
  SUCCESS: NOTIFICATION_CONFIG.DURATIONS.SUCCESS,
  ERROR: NOTIFICATION_CONFIG.DURATIONS.ERROR,
  WARNING: NOTIFICATION_CONFIG.DURATIONS.WARNING,
  INFO: NOTIFICATION_CONFIG.DURATIONS.INFO
} as const;

/**
 * Alert notification durations by type
 */
export const ALERT_DURATIONS = {
  SUCCESS: NOTIFICATION_CONFIG.DURATIONS.ALERT_SUCCESS,
  ERROR: NOTIFICATION_CONFIG.DURATIONS.ALERT_ERROR,
  WARNING: NOTIFICATION_CONFIG.DURATIONS.ALERT_WARNING,
  INFO: NOTIFICATION_CONFIG.DURATIONS.ALERT_INFO
} as const;

/**
 * Type-safe access to notification configuration
 */
export type NotificationConfig = typeof NOTIFICATION_CONFIG;
export type ToastDurations = typeof TOAST_DURATIONS;
export type AlertDurations = typeof ALERT_DURATIONS;

