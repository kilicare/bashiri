"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { SPLASH_CONFIG } from "@/lib/constants/splashConfig";

interface InteractiveSplashProps {
  children: React.ReactNode;
}

export function InteractiveSplash({ children }: InteractiveSplashProps) {
  const [isMobile, setIsMobile] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(springY, [-400, 400], [4, -4]);
  const rotateY = useTransform(springX, [-400, 400], [-4, 4]);

  useEffect(() => {
    setIsMounted(true);
    // Check if mobile using media query for better reliability
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setIsMobile(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile || !isMounted) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      style={{
        rotateX: (isMobile || !isMounted) ? 0 : rotateX,
        rotateY: (isMobile || !isMounted) ? 0 : rotateY,
      }}
    >
      {/* Interactive Glow Effect */}
      {!isMobile && isMounted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${SPLASH_CONFIG.primaryGold}10, transparent 70%)`,
          }}
        />
      )}
      
      {children}
    </motion.div>
  );
}