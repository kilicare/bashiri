/**
 * Splash Screen Configuration
 * Centralized configuration for Bashiri splash screen behavior and styling
 */

export const SPLASH_CONFIG = {
  // Timing configuration
  displayDuration: 13000, // 13 seconds (10 + 3 added)
  exitDuration: 400,
  initializationTimeout: 15000, // 15 second timeout for initialization
  
  // Animation speeds
  baseAnimationDuration: 0.6,
  staggerDelay: 0.1,
  progressAnimationDuration: 1,
  
  // Color palette
  backgroundColor: "#000000",
  primaryGold: "#D4AF37",
  secondaryGold: "#CFAF7B",
  aiGreen: "#00FF87",
  white: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  surface: "rgba(255, 255, 255, 0.03)",
  surfaceBorder: "rgba(255, 255, 255, 0.08)",
  
  // Typography
  brandFontSize: "clamp(2rem, 8vw, 3rem)",
  heroFontSize: "clamp(1.25rem, 4vw, 1.5rem)",
  statsFontSize: "clamp(1rem, 3vw, 1.25rem)",
  
  // Spacing (fluid clamp for responsive adaptation)
  spacingHeroToBrand: "clamp(1.5rem, 3vw, 2.5rem)",
  spacingBrandToStats: "clamp(1rem, 2.5vw, 1.75rem)",
  spacingStatsToLeagues: "clamp(1rem, 2.5vw, 1.75rem)",
  spacingLeaguesToProgress: "clamp(1.5rem, 3vw, 2.5rem)",
  spacingProgressToFooter: "clamp(0.75rem, 2vw, 1.25rem)",
  
  // Branding
  appName: "BASHIRI",
  tagline: "AI-Powered Football Predictions",
  heroTitle: "Your Journey",
  heroSubtitle: "Starts",
  
  // Trust indicators (marketing values - clearly marked as such)
  accuracyPercentage: 85,
  rating: "4.8/5",
  
  // League accuracy data (marketing values - clearly marked as such)
  leagueData: [
    { name: "EPL", flag: "🦁", accuracy: 87 },
    { name: "La Liga", flag: "🇪🇸", accuracy: 85 },
    { name: "Serie A", flag: "🇮🇹", accuracy: 82 },
  ],
  
  // Loading messages
  loadingMessages: [
    "Loading the best predictions for you...",
    "Analyzing team performance...",
    "Preparing your football insights...",
  ],
  
  // Accessibility
  reducedMotionMultiplier: 0.5,
} as const;

export type SplashConfig = typeof SPLASH_CONFIG;