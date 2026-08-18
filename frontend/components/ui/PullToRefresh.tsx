"use client";

import { useState, useRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { RotateCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        const resistance = 0.4;
        const newPullDistance = Math.min(diff * resistance, threshold * 1.5);
        setPullDistance(newPullDistance);
        setIsPulling(newPullDistance > 10);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center pt-4"
        animate={{ opacity: isPulling || pullDistance > 10 ? 1 : 0 }}
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
        >
          <RotateCw 
            size={24} 
            style={{ 
              color: "var(--brand-primary)",
              opacity: isPulling || isRefreshing ? 1 : 0.5
            }} 
          />
        </motion.div>
      </motion.div>
      
      {children}
    </div>
  );
}
