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
