/**
 * utils/animation.ts
 *
 * Animation utilities with accessibility support for prefers-reduced-motion
 */

/**
 * Check if user prefers reduced motion
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation duration - returns 0 if prefers-reduced-motion is set
 */
export const getAnimationDuration = (defaultDuration: number): number => {
  return shouldReduceMotion() ? 0 : defaultDuration;
};

/**
 * Get animation easing - returns linear if prefers-reduced-motion is set
 * Returns Recharts-compatible easing string
 */
export const getAnimationEasing = (defaultEasing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' = 'ease-in-out'): 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' => {
  return shouldReduceMotion() ? 'linear' : defaultEasing;
};

/**
 * Get animation config object for Framer Motion
 */
export const getAnimationConfig = (
  duration: number = 0.5,
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' = 'ease-in-out'
) => {
  return {
    duration: getAnimationDuration(duration),
    ease: getAnimationEasing(easing),
  };
};
