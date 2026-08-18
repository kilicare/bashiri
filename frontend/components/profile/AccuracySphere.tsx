/**
 * components/profile/AccuracySphere.tsx
 *
 * 3D interactive accuracy sphere visualization
 * Shows user's prediction accuracy as a glowing 3D sphere
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AccuracySphereProps {
  accuracy: number;
  size?: number;
}

export const AccuracySphere: React.FC<AccuracySphereProps> = ({ accuracy, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    let animationFrame: number;
    let time = 0;

    const draw = () => {
      time += 0.01;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = (size / 2) * 0.8;

      // Create gradient based on accuracy
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      // Color based on accuracy
      let color1, color2;
      if (accuracy >= 80) {
        color1 = '#D4AF37'; // Gold
        color2 = '#CFAF7B';
      } else if (accuracy >= 60) {
        color1 = '#4CAF50'; // Green
        color2 = '#81C784';
      } else if (accuracy >= 40) {
        color1 = '#FF9800'; // Orange
        color2 = '#FFB74D';
      } else {
        color1 = '#F44336'; // Red
        color2 = '#EF5350';
      }

      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.5, color2);
      gradient.addColorStop(1, 'transparent');

      // Draw main sphere with pulse effect
      const pulse = 1 + Math.sin(time * 2) * 0.05;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw accuracy percentage in center
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.25}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${accuracy}%`, centerX, centerY);

      // Draw orbiting particles
      for (let i = 0; i < 8; i++) {
        const angle = (time + i * (Math.PI / 4)) % (Math.PI * 2);
        const orbitRadius = radius * 0.6;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius * 0.5; // Flattened for 3D effect

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color1;
        ctx.fill();
      }

      // Draw outer glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = `${color1}33`;
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [accuracy, size]);

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer"
      />
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <p className="text-xs font-medium text-white/60">Accuracy Sphere</p>
      </div>
    </motion.div>
  );
};
