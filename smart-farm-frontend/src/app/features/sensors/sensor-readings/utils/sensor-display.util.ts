/**
 * Sensor Display Utility
 * Centralized configuration for sensor display properties (icons, colors, names)
 * This removes hardcoded values and provides a single source of truth
 */

export type SensorType = 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'ph' | 'pressure' | 'all';
export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

/**
 * Sensor display configuration
 */
export interface SensorDisplayConfig {
  icon: string;
  displayName: string;
  color: {
    light: string;
    dark: string;
  };
  gradient: {
    light: string;
    dark: string;
  };
}

/**
 * Sensor type display configurations
 */
export const SENSOR_TYPE_CONFIG: Record<string, SensorDisplayConfig> = {
  temperature: {
    icon: 'thermostat',
    displayName: 'Temperature',
    color: {
      light: '#ef4444',
      dark: '#fca5a5',
    },
    gradient: {
      light: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      dark: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.2))',
    },
  },
  humidity: {
    icon: 'water_drop',
    displayName: 'Humidity',
    color: {
      light: '#3b82f6',
      dark: '#93c5fd',
    },
    gradient: {
      light: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      dark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(191, 219, 254, 0.2))',
    },
  },
  soil_moisture: {
    icon: 'grass',
    displayName: 'Soil Moisture',
    color: {
      light: '#84cc16',
      dark: '#bef264',
    },
    gradient: {
      light: 'linear-gradient(135deg, #ecfccb, #d9f99d)',
      dark: 'linear-gradient(135deg, rgba(132, 204, 22, 0.3), rgba(217, 249, 157, 0.2))',
    },
  },
  light: {
    icon: 'light_mode',
    displayName: 'Light Intensity',
    color: {
      light: '#f59e0b',
      dark: '#fcd34d',
    },
    gradient: {
      light: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      dark: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.2))',
    },
  },
  ph: {
    icon: 'science',
    displayName: 'pH Level',
    color: {
      light: '#8b5cf6',
      dark: '#c4b5fd',
    },
    gradient: {
      light: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
      dark: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(221, 214, 254, 0.2))',
    },
  },
  pressure: {
    icon: 'speed',
    displayName: 'Pressure',
    color: {
      light: '#06b6d4',
      dark: '#67e8f9',
    },
    gradient: {
      light: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
      dark: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(165, 243, 252, 0.2))',
    },
  },
  irrigation: {
    icon: 'sprinkler',
    displayName: 'Irrigation',
    color: {
      light: '#0284c7',
      dark: '#7dd3fc',
    },
    gradient: {
      light: 'linear-gradient(135deg, #cff0fe, #a5e9fc)',
      dark: 'linear-gradient(135deg, rgba(14, 165, 233, 0.3), rgba(186, 230, 253, 0.2))',
    },
  },
  water_flow: {
    icon: 'waves',
    displayName: 'Water Flow',
    color: {
      light: '#0369a1',
      dark: '#93c5fd',
    },
    gradient: {
      light: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
      dark: 'linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(186, 230, 253, 0.2))',
    },
  },
  all: {
    icon: 'sensors',
    displayName: 'All Sensors',
    color: {
      light: '#10b981',
      dark: '#34d399',
    },
    gradient: {
      light: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      dark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.2))',
    },
  },
};

/**
 * Status color configurations
 */
export const STATUS_COLORS = {
  normal: {
    light: '#10b981',
    dark: '#34d399',
    bg: {
      light: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      dark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.25))',
    },
  },
  warning: {
    light: '#f59e0b',
    dark: '#fcd34d',
    bg: {
      light: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      dark: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.25))',
    },
  },
  critical: {
    light: '#ef4444',
    dark: '#fca5a5',
    bg: {
      light: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      dark: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.25))',
    },
  },
  offline: {
    light: '#6b7280',
    dark: '#cbd5e1',
    bg: {
      light: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
      dark: 'linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(229, 231, 235, 0.15))',
    },
  },
};

/**
 * Get sensor icon with intelligent detection
 * Considers sensor type, ID, and unit to distinguish similar sensors
 * e.g., humidity vs irrigation/water sensors
 */
export function getSensorIcon(type: string, sensorId?: string, unit?: string): string {
  if (!type) return SENSOR_TYPE_CONFIG['all'].icon;

  const normalizedType = type.toLowerCase().replace(/[_-]/g, '_');
  const normalizedId = sensorId?.toLowerCase() || '';
  const normalizedUnit = unit?.toLowerCase() || '';

  // Irrigation/Water sensors detection
  // Check for irrigation-related keywords in ID or type
  const isIrrigation = 
    normalizedId.includes('irrigat') ||
    normalizedId.includes('sprinkler') ||
    normalizedId.includes('water_flow') ||
    normalizedId.includes('waterflow') ||
    normalizedId.includes('flow') ||
    normalizedType.includes('irrigat') ||
    normalizedType.includes('water_flow') ||
    normalizedType.includes('flow') ||
    normalizedUnit === 'l/min' ||
    normalizedUnit === 'gpm' ||
    normalizedUnit === 'l/h';

  // Humidity sensors (not irrigation)
  const isHumidity = 
    (normalizedType.includes('humid') || normalizedType === 'humidity') &&
    !isIrrigation;

  // Soil moisture vs general moisture
  const isSoilMoisture = 
    normalizedType.includes('soil') || 
    normalizedType.includes('moisture') ||
    normalizedId.includes('soil');

  // Smart icon selection based on context
  if (isIrrigation) {
    return 'sprinkler'; // or 'water_drop', 'waves', 'water'
  }
  
  if (isHumidity) {
    return 'water_drop';
  }

  if (isSoilMoisture) {
    return 'grass';
  }

  // Direct type match
  if (SENSOR_TYPE_CONFIG[normalizedType]) {
    return SENSOR_TYPE_CONFIG[normalizedType].icon;
  }

  // Fallback for unknown types
  return SENSOR_TYPE_CONFIG['all'].icon;
}

/**
 * Get sensor display name
 */
export function getSensorDisplayName(type: string): string {
  const normalizedType = type.toLowerCase().replace(/[_-]/g, '_');
  return SENSOR_TYPE_CONFIG[normalizedType]?.displayName || type;
}


/**
 * Get sensor color for light/dark mode
 */
export function getSensorColor(type: string, isDark: boolean = false): string {
  const normalizedType = type.toLowerCase().replace(/[_-]/g, '_');
  const config = SENSOR_TYPE_CONFIG[normalizedType] || SENSOR_TYPE_CONFIG['all'];
  return isDark ? config.color.dark : config.color.light;
}

/**
 * Get sensor gradient for light/dark mode
 */
export function getSensorGradient(type: string, isDark: boolean = false): string {
  const normalizedType = type.toLowerCase().replace(/[_-]/g, '_');
  const config = SENSOR_TYPE_CONFIG[normalizedType] || SENSOR_TYPE_CONFIG['all'];
  return isDark ? config.gradient.dark : config.gradient.light;
}

/**
 * Get status icon
 */
export function getStatusIcon(status: SensorStatus): string {
  const icons: Record<SensorStatus, string> = {
    normal: 'check_circle',
    warning: 'warning',
    critical: 'error',
    offline: 'sensors_off',
  };
  return icons[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: SensorStatus, isDark: boolean = false): string {
  return isDark ? STATUS_COLORS[status].dark : STATUS_COLORS[status].light;
}

/**
 * Get status background gradient
 */
export function getStatusBackground(status: SensorStatus, isDark: boolean = false): string {
  return isDark ? STATUS_COLORS[status].bg.dark : STATUS_COLORS[status].bg.light;
}

/**
 * Format sensor value with appropriate precision
 */
export function formatSensorValue(value: number, type: string): string {
  const normalizedType = type.toLowerCase();
  
  // High precision for pH
  if (normalizedType.includes('ph')) {
    return value.toFixed(2);
  }
  
  // Standard precision for most sensors
  return value.toFixed(1);
}

/**
 * Get unit symbol for sensor type
 */
export function getDefaultUnit(type: string): string {
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('temp')) return '°C';
  if (normalizedType.includes('humid')) return '%';
  if (normalizedType.includes('soil') || normalizedType.includes('moisture')) return '%';
  if (normalizedType.includes('light')) return 'lux';
  if (normalizedType.includes('ph')) return 'pH';
  if (normalizedType.includes('pressure')) return 'hPa';
  
  return '';
}

/**
 * Theme colors for consistent eco-futuristic design
 */
export const THEME_COLORS = {
  // Primary eco-tech colors
  primary: {
    light: '#005f5b', // Deep teal (nature-tech)
    dark: '#80cbc4',  // Soft aqua
  },
  
  // Accent colors
  accent: {
    light: '#10b981', // Emerald
    dark: '#34d399',  // Light emerald
  },
  
  // Background gradients
  background: {
    light: 'linear-gradient(135deg, #f8fafb 0%, #f0fdf4 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  
  // Glass effects
  glass: {
    light: {
      bg: 'rgba(255, 255, 255, 0.75)',
      border: 'rgba(16, 185, 129, 0.2)',
    },
    dark: {
      bg: 'rgba(30, 41, 59, 0.75)',
      border: 'rgba(100, 116, 139, 0.3)',
    },
  },
};

/**
 * Spacing constants (8px grid system)
 */
export const SPACING = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

/**
 * Border radius constants
 */
export const BORDER_RADIUS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
};

/**
 * Transition durations
 */
export const TRANSITIONS = {
  fast: '0.15s',
  normal: '0.3s',
  slow: '0.5s',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Generate unique sensor identifier
 * Combines sensor_id with type to handle composite sensors (like DHT11)
 * that report multiple values (temp + humidity) with the same ID
 */
export function generateUniqueSensorId(sensorId: string, type: string, unit?: string): string {
  if (!sensorId) return 'unknown';
  
  // Normalize the type
  const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
  
  // For composite sensors, append the type to make it unique
  // e.g., "dht11" + "temperature" = "dht11-temperature"
  // e.g., "dht11" + "humidity" = "dht11-humidity"
  return `${sensorId}-${normalizedType}`;
}

/**
 * Parse unique sensor ID back to base sensor ID and type
 */
export function parseUniqueSensorId(uniqueId: string): { baseSensorId: string; type: string } {
  const lastDashIndex = uniqueId.lastIndexOf('-');
  
  if (lastDashIndex === -1) {
    return { baseSensorId: uniqueId, type: '' };
  }
  
  return {
    baseSensorId: uniqueId.substring(0, lastDashIndex),
    type: uniqueId.substring(lastDashIndex + 1),
  };
}

/**
 * Extract action purpose from sensor action fields
 * Identifies the purpose (roof, humidifier, etc.) from MQTT action strings
 * 
 * @param actionLow - Action string for low threshold (e.g., "mqtt:smartfarm/actuators/dht11H/close_roof")
 * @param actionHigh - Action string for high threshold (e.g., "mqtt:smartfarm/actuators/dht11H/open_roof")
 * @returns Human-readable purpose label (e.g., "Roof Control", "Humidifier Control", or null)
 */
export function extractActionPurpose(actionLow?: string, actionHigh?: string): string | null {
  // Combine both actions to check for purpose
  const actions = [actionLow, actionHigh].filter(Boolean).join(' ');
  
  if (!actions) return null;
  
  // Extract action commands from MQTT topics
  // Format: "mqtt:smartfarm/actuators/dht11H/close_roof"
  const actionPatterns = [
    { keywords: ['roof', 'open_roof', 'close_roof'], label: 'Roof Control', icon: 'roofing' },
    { keywords: ['humidifier', 'humidifier_on', 'humidifier_off'], label: 'Humidifier Control', icon: 'humidity_high' },
    { keywords: ['fan', 'fan_on', 'fan_off'], label: 'Fan Control', icon: 'air' },
    { keywords: ['heater', 'heater_on', 'heater_off'], label: 'Heater Control', icon: 'local_fire_department' },
    { keywords: ['irrigation', 'irrigation_on', 'irrigation_off'], label: 'Irrigation Control', icon: 'water_drop' },
    { keywords: ['ventilator', 'ventilator_on', 'ventilator_off'], label: 'Ventilator Control', icon: 'air' },
    { keywords: ['water_pump', 'water_pump_on', 'water_pump_off'], label: 'Water Pump Control', icon: 'water_pump' },
    { keywords: ['light', 'light_on', 'light_off'], label: 'Light Control', icon: 'light_mode' },
  ];
  
  const lowerActions = actions.toLowerCase();
  
  for (const pattern of actionPatterns) {
    if (pattern.keywords.some(keyword => lowerActions.includes(keyword))) {
      return pattern.label;
    }
  }
  
  return null;
}

/**
 * Get icon for action purpose
 */
export function getActionPurposeIcon(purpose: string | null): string {
  if (!purpose) return 'settings';
  
  const iconMap: Record<string, string> = {
    'Roof Control': 'roofing',
    'Humidifier Control': 'humidity_high',
    'Fan Control': 'air',
    'Heater Control': 'local_fire_department',
    'Irrigation Control': 'water_drop',
    'Ventilator Control': 'air',
    'Water Pump Control': 'water_pump',
    'Light Control': 'light_mode',
  };
  
  return iconMap[purpose] || 'settings';
}

