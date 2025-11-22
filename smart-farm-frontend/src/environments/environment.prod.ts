export const environment = {
  production: true,
  apiUrl: 'https://thorough-optimism-production.up.railway.app/api/v1',
  wsUrl: 'https://thorough-optimism-production.up.railway.app',
  appName: 'Smart Farm Management System',
  version: '1.0.0',
  enableAnalytics: true,
  enableErrorReporting: true,
  logLevel: 'error',
  
  // API Configuration
  apiTimeout: 60000, // 60 seconds for production
  
  // Auth configuration
  auth: {
    loginSuccessDelay: 1500,
    emailValidationDebounce: 300,
    emailValidationDelay: 500,
    maxLoginAttempts: 5,
    loginAttemptWindow: 900000 // 15 minutes in ms
  },
  
  // Asset paths
  assets: {
    loginVideo: 'assets/vids/login.mp4',
    loginVideoFallback: 'assets/images/login-bg.jpg',
    logo: 'assets/images/logos/Feedin_pnglogo.png'
  },
  
  // UI Configuration
  ui: {
    searchDebounceMs: 300,
    refreshAnimationMs: 1000
  },
  
  // OpenWeatherMap Configuration
  openWeather: {
    apiKey: 'YOUR_KEY_HERE' // Replace with your OpenWeatherMap API key
  },
  
  // Notification System Configuration
  notifications: {
    // WebSocket settings
    wsTimeout: 15000, // Longer timeout for production
    wsMaxRetries: 10, // More retries for production
    wsRetryDelay: 2000,
    wsFallbackTimeout: 10000,
    
    // Polling settings
    pollingInterval: 10000, // Less frequent in production
    pollingEnabled: true,
    
    // Cache settings
    maxCacheSize: 100,
    pageSize: 20,
    
    // Auto-refresh
    autoRefreshEnabled: true,
    autoRefreshInterval: 60000, // 1 minute in production
    
    // Cooldown and quiet hours
    cooldownMs: 900000, // 15 minutes
    quietHoursEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 6
  }
};
