"use client";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { ReactNode } from "react";

interface BookButtonProps {
  onClick: () => void;
  children: ReactNode;
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

export function BookButton({ 
  onClick, 
  children, 
  icon: Icon, 
  className = "", 
  loading = false,
  disabled = false
}: BookButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const handleClick = () => {
    if (loading || disabled) return;
    setIsOpening(true);
    setTimeout(() => {
      setIsOpening(false);
      onClick();
    }, 600);
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: loading || disabled ? 1 : 1.02 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.98 }}
      className={`relative group w-full h-10 sm:h-12 z-10 ${className}`}
      style={{
        perspective: "1000px",
      }}
      disabled={loading || disabled}
    >
      {/* Book Container */}
      <motion.div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        animate={{
          rotateY: isHovered && !loading && !disabled ? -15 : 0,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          background: "linear-gradient(135deg, #0D4F3E 0%, #1A7A5C 25%, #2E8B6E 50%, #4CAF50 75%, #66BB6A 100%)",
          boxShadow: "0 10px 40px rgba(46, 125, 50, 0.4), 0 0 80px rgba(76, 175, 80, 0.2)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 z-0"
          animate={{
            background: (isHovered && !loading && !disabled) 
              ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          }}
          transition={{ duration: 0.6 }}
          style={{
            backgroundSize: "200% 100%",
          }}
        />

        {/* Book Spine */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-2 bg-gradient-to-b from-[#0D4F3E] via-[#2E8B6E] via-[#4CAF50] to-[#0D4F3E] -translate-x-1/2 z-20"
          style={{
            boxShadow: "0 0 20px rgba(76, 175, 80, 0.5), 0 0 40px rgba(102, 187, 106, 0.3)",
          }}
        />

        {/* Book Cover - Left Page */}
        <motion.div
          className="absolute inset-0 rounded-l-2xl"
          animate={{
            rotateY: isOpening ? -80 : (isHovered && !loading && !disabled ? -45 : 0),
            translateX: isOpening ? -30 : (isHovered && !loading && !disabled ? -12 : 0),
          }}
          transition={{ duration: isOpening ? 0.6 : 0.4, ease: "easeInOut" }}
          style={{
            transformOrigin: "left center",
            width: "50%",
            height: "100%",
            borderRadius: "16px 0 0 16px",
            zIndex: 10,
            background: "linear-gradient(135deg, #0D4F3E 0%, #1A7A5C 30%, #2E8B6E 60%, #4CAF50 100%)",
          }}
        >
          {/* Page Lines */}
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-1 opacity-15">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full"
                style={{ 
                  width: `${60 - i * 8}%`,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                }}
              />
            ))}
          </div>
          {/* Inner Page Shadow */}
          <div 
            className="absolute inset-0 rounded-l-2xl"
            style={{
              background: "linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* Book Cover - Right Page */}
        <motion.div
          className="relative rounded-r-2xl"
          animate={{
            rotateY: isOpening ? 30 : (isHovered && !loading && !disabled ? 15 : 0),
            translateX: isOpening ? 20 : (isHovered && !loading && !disabled ? 12 : 0),
          }}
          transition={{ duration: isOpening ? 0.6 : 0.4, ease: "easeInOut" }}
          style={{
            transformOrigin: "right center",
            width: "50%",
            height: "100%",
            borderRadius: "0 16px 16px 0",
            zIndex: 5,
            background: "linear-gradient(135deg, #4CAF50 0%, #2E8B6E 30%, #1A7A5C 60%, #0D4F3E 100%)",
          }}
        >
          {/* Page Lines */}
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-1 opacity-15">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full"
                style={{ 
                  width: `${60 - i * 8}%`,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                }}
              />
            ))}
          </div>
          {/* Inner Page Shadow */}
          <div 
            className="absolute inset-0 rounded-r-2xl"
            style={{
              background: "linear-gradient(-90deg, rgba(0,0,0,0.15) 0%, transparent 100%)",
            }}
          />
        </motion.div>

        {/* Content Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center gap-3 rounded-2xl z-30"
          animate={{
            opacity: isOpening ? 0 : (isHovered && !loading && !disabled ? 0.95 : 1),
            scale: isOpening ? 0.8 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)",
            backdropFilter: "blur(4px)",
          }}
        >
          {loading ? (
            <Loader2 size={18} className="text-white animate-spin" style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
            }} />
          ) : (
            <>
              {Icon && (
                <Icon
                  size={18}
                  className="text-white"
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                  }}
                />
              )}
              <span className="text-white font-bold text-sm sm:text-base tracking-wide" style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
              }}>
                {children}
              </span>
            </>
          )}
        </motion.div>

        {/* Opening Animation - Pages Inside */}
        <AnimatePresence>
          {isOpening && !loading && !disabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center z-40"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <ChevronRight size={32} className="text-white" style={{
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl z-0"
          animate={{
            opacity: isOpening ? 1 : (isHovered && !loading && !disabled ? 1 : 0.5),
            scale: isOpening ? 1.3 : (isHovered && !loading && !disabled ? 1.15 : 1),
          }}
          transition={{ duration: isOpening ? 0.6 : 0.4 }}
          style={{
            background: "radial-gradient(circle, rgba(76, 175, 80, 0.7) 0%, rgba(102, 187, 106, 0.4) 30%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />

        {/* Particles */}
        {(isHovered || isOpening) && !loading && !disabled && (
          <>
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full z-40"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 140}%`,
                  y: `${50 + (Math.random() - 0.5) * 140}%`,
                  scale: [0, 2, 0],
                  opacity: [1, 0.85, 0],
                }}
                transition={{
                  duration: isOpening ? 0.9 : 1.2,
                  delay: i * 0.06,
                  ease: "easeOut",
                }}
                style={{
                  width: `${3 + Math.random() * 3}px`,
                  height: `${3 + Math.random() * 3}px`,
                  background: i % 3 === 0 ? "#FFFFFF" : (i % 3 === 1 ? "#4CAF50" : "#66BB6A"),
                  boxShadow: `0 0 ${10 + Math.random() * 10}px ${i % 3 === 0 ? "#FFFFFF" : (i % 3 === 1 ? "#4CAF50" : "#66BB6A")}`,
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.button>
  );
}