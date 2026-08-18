/**
 * Splash Screen Configuration
 * Centralized configuration for Bashiri splash screen behavior and styling
 */

export const SPLASH_CONFIG = {
  // Timing configuration
  displayDuration: 15000, // 15 seconds for full animation viewing
  exitDuration: 400,
  logoAnimationDuration: 2000,
  
  // Particle configuration
  particleCount: 12,
  
  // Progress bar configuration
  progressBarHeight: 3,
  progressBarWidth: 128,
  
  // Color palette
  backgroundColor: "#000000",
  primaryGold: "#D4AF37",
  secondaryGold: "#CFAF7B",
  aiGreen: "#00FF87",
  white: "#FFFFFF",
  
  // Animation speeds
  baseAnimationDuration: 1,
  glowAnimationDuration: 4,
  particleAnimationDuration: 5,
  
  // Accessibility
  reducedMotionMultiplier: 0.5,
  
  // Branding
  appName: "BASHIRI",
  tagline: "AI-Powered Football Predictions",
  
  // Trust indicators
  accuracyPercentage: 85,
  userCount: "50,000+",
  rating: "4.8/5"
} as const;

export type SplashConfig = typeof SPLASH_CONFIG;