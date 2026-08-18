/**
 * components/AnimatedOdds.tsx
 *
 * Animated odds component with digit-by-digit transition
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { shouldReduceMotion } from '@/utils/animation';

interface AnimatedOddsProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedOdds: React.FC<AnimatedOddsProps> = ({
  value,
  duration = 600,
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;
    if (shouldReduceMotion()) {
      setDisplayValue(value);
      return;
    }

    setIsAnimating(true);

    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      // Easing function for smooth transition
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = displayValue + (value - displayValue) * easeOutQuart;

      setDisplayValue(Math.round(newValue * 100) / 100);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, displayValue, duration]);

  return (
    <motion.span
      key={displayValue}
      initial={{ opacity: 0.5, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0.5, scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {displayValue.toFixed(2)}
    </motion.span>
  );
};
