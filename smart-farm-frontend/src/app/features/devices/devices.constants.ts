/**
 * Devices Module Configuration Constants
 * Centralized configuration to avoid magic numbers and enable easy maintenance
 */

export const DEVICES_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  
  // Search & Filtering
  SEARCH_DEBOUNCE_MS: 300,
  
  // Device Status Thresholds
  DEVICE_ONLINE_THRESHOLD_MINUTES: 5,
  
  // Cache Configuration
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Request Configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  
  // Animation Durations
  REFRESH_ANIMATION_MS: 1000,
  
  // Available Device Types
  DEVICE_TYPES: [
    'sensor',
    'controller',
    'gateway',
    'camera',
    'actuator',
    'monitor'
  ] as const,
  
  // Available Device Statuses
  DEVICE_STATUSES: ['online', 'offline', 'maintenance'] as const,
  
  // Export Configuration
  EXPORT_FILENAME_PREFIX: 'device_data_',
  EXPORT_DATE_FORMAT: 'yyyy-MM-dd_HHmmss'
} as const;

/**
 * Device feature table column definitions
 */
export const DEVICE_TABLE_COLUMNS = [
  'name',
  'type',
  'location',
  'status',
  'lastSeen',
  'actions'
] as const;

export type DeviceType = typeof DEVICES_CONFIG.DEVICE_TYPES[number];
export type DeviceStatusType = typeof DEVICES_CONFIG.DEVICE_STATUSES[number];
