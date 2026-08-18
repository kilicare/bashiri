/**
 * components/profile/PredictionDNA.tsx
 *
 * Prediction DNA fingerprint visualization
 * Unique visualization showing user's prediction patterns as a DNA-like structure
 * - Gold nodes = Correct predictions
 * - Red nodes = Incorrect predictions
 * - Helix pattern shows prediction flow over time
 * - Interactive hover shows prediction details
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PredictionDNAProps {
  predictions: Array<{
    date: string;
    correct: boolean;
    confidence: number;
    market: string;
  }>;
}

export const PredictionDNA: React.FC<PredictionDNAProps> = ({ predictions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPrediction, setHoveredPrediction] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    // Draw DNA helix
    const drawDNA = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const amplitude = 40;
      const frequency = 0.05;
      const spacing = 15;

      predictions.forEach((pred, i) => {
        const x = 50 + i * spacing;
        if (x > canvas.width - 50) return;

        // Calculate helix positions
        const angle = i * frequency;
        const y1 = centerY + Math.sin(angle) * amplitude;
        const y2 = centerY + Math.sin(angle + Math.PI) * amplitude;

        // Draw connecting lines (base pairs)
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = pred.correct ? 'rgba(212, 175, 55, 0.3)' : 'rgba(244, 67, 54, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw nodes
        const drawNode = (y: number, isTop: boolean) => {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          if (pred.correct) {
            gradient.addColorStop(0, '#D4AF37');
            gradient.addColorStop(1, '#CFAF7B');
          } else {
            gradient.addColorStop(0, '#F44336');
            gradient.addColorStop(1, '#EF5350');
          }

          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Glow effect
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = pred.correct ? 'rgba(212, 175, 55, 0.3)' : 'rgba(244, 67, 54, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        };

        drawNode(y1, true);
        drawNode(y2, false);
      });
    };

    drawDNA();
  }, [predictions]);

  return (
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-48 bg-gradient-to-br from-white/5 to-transparent rounded-2xl cursor-pointer"
      />
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-white/40">
        <span>Prediction DNA</span>
        <span>{predictions.length} predictions</span>
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between text-[10px] text-white/30">
        <span>● Gold = Correct</span>
        <span>● Red = Incorrect</span>
      </div>
    </motion.div>
  );
};
