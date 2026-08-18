/**
 * hooks/useCountUp.ts
 *
 * Hook for count-up animation on numbers
 */

import { useEffect, useState, useRef } from 'react';
import { shouldReduceMotion } from '@/utils/animation';

export const useCountUp = (
  endValue: number,
  duration: number = 1000,
  shouldReduce: boolean = false
) => {
  const [count, setCount] = useState(0);
  const shouldReduceRef = useRef(shouldReduce);

  useEffect(() => {
    shouldReduceRef.current = shouldReduce;
  }, [shouldReduce]);

  useEffect(() => {
    if (shouldReduceRef.current) {
      setCount(endValue);
      return;
    }

    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      setCount(Math.round(endValue * progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [endValue, duration]);

  return count;
};
