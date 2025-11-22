/**
 * Device Utilities
 * Helper functions for device management and display
 */

/**
 * Get the color theme for a device status
 * @param status The device status
 * @returns Material color theme name
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
      return 'primary';
    case 'offline':
      return 'warn';
    case 'maintenance':
      return 'accent';
    default:
      return 'basic';
  }
}

/**
 * Get the Material icon name for a device type
 * @param deviceType The type of device
 * @returns Material icon name
 */
export function getDeviceTypeIcon(deviceType: string): string {
  if (!deviceType) return 'devices';

  switch (deviceType.toLowerCase()) {
    case 'sensor':
      return 'sensors';
    case 'controller':
      return 'settings';
    case 'gateway':
      return 'router';
    case 'camera':
      return 'videocam';
    case 'actuator':
      return 'build';
    case 'monitor':
      return 'monitor';
    default:
      return 'devices';
  }
}

/**
 * Get the status icon name for a device status
 * @param status The device status
 * @returns Material icon name
 */
export function getStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
      return 'wifi';
    case 'offline':
      return 'wifi_off';
    case 'maintenance':
      return 'build';
    default:
      return 'help_outline';
  }
}

/**
 * Get the gradient colors for a device type icon
 * @param deviceType The type of device
 * @returns CSS gradient string
 */
export function getDeviceTypeGradient(deviceType: string): string {
  if (!deviceType) return 'linear-gradient(135deg, #10b981, #059669)';

  switch (deviceType.toLowerCase()) {
    case 'sensor':
      return 'linear-gradient(135deg, #10b981, #059669)';
    case 'controller':
      return 'linear-gradient(135deg, #3b82f6, #2563eb)';
    case 'gateway':
      return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
    case 'camera':
      return 'linear-gradient(135deg, #f59e0b, #d97706)';
    case 'actuator':
      return 'linear-gradient(135deg, #ef4444, #dc2626)';
    case 'monitor':
      return 'linear-gradient(135deg, #06b6d4, #0891b2)';
    default:
      return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
}

/**
 * Get translated status text with fallback
 * @param status The device status
 * @param translator Translation function
 * @returns Translated status text
 */
export function getStatusTranslation(
  status: string,
  translator: (key: string) => string
): string {
  const statusKey = status.toLowerCase();
  const translationKey = `dashboard.deviceStatus.${statusKey}`;
  const translation = translator(translationKey);

  // If translation not found, return the original status
  return translation === translationKey ? status : translation;
}

/**
 * Get translated device type text with fallback
 * @param deviceType The device type
 * @param translator Translation function
 * @returns Translated device type text
 */
export function getDeviceTypeTranslation(
  deviceType: string,
  translator: (key: string) => string
): string {
  if (!deviceType) {
    return translator('common.none');
  }

  const typeKey = deviceType.toLowerCase();
  const translationKey = `devices.deviceTypes.${typeKey}`;
  const translation = translator(translationKey);

  // If translation not found, return the original device type
  return translation === translationKey ? deviceType : translation;
}

/**
 * Check if a device is considered online based on last seen time
 * @param lastSeen Last seen timestamp
 * @param thresholdMinutes Minutes threshold for considering device offline
 * @returns Whether the device is online
 */
export function isDeviceOnline(lastSeen: string | Date, thresholdMinutes: number = 5): boolean {
  if (!lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  return diffMinutes <= thresholdMinutes;
}

/**
 * Format time ago text for last seen
 * @param lastSeen Last seen timestamp
 * @param translator Translation function
 * @returns Formatted "time ago" string
 */
export function formatTimeAgo(
  lastSeen: string | Date | undefined,
  translator: (key: string) => string
): string {
  if (!lastSeen) return translator('common.never') || 'Never';

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

  if (diffSeconds < 0) {
    return translator('common.justNow') || 'Just now';
  }
  
  if (diffSeconds < 60) {
    return translator('common.justNow') || 'Just now';
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ${translator('common.ago') || 'ago'}`;
  } else if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ${translator('common.ago') || 'ago'}`;
  } else if (diffSeconds < 2592000) { // 30 days
    const days = Math.floor(diffSeconds / 86400);
    return `${days}d ${translator('common.ago') || 'ago'}`;
  } else {
    // For older dates, show the actual date
    return lastSeenDate.toLocaleDateString();
  }
}

