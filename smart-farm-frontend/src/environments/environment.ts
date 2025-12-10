export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  appName: 'Smart Farm Management System',
  version: '1.0.0',
  enableAnalytics: false,
  enableErrorReporting: false,
  logLevel: 'debug',
  
  // API Configuration
  apiTimeout: 30000, // 30 seconds
  
  // Auth configuration
  auth: {
    loginSuccessDelay: 1500,
    emailValidationDebounce: 300,
    emailValidationDelay: 500,
    maxLoginAttempts: 999999, // Temporarily disabled for testing
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
  }
};
