/**
 * hooks/useMobileTooltip.ts
 *
 * Hook for mobile-friendly chart tooltips
 */

import { useState } from 'react';

interface TooltipState {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

interface DataPoint {
  value?: number;
  accuracy_percentage?: number;
  [key: string]: unknown;
}

export const useMobileTooltip = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0,
    y: 0,
    content: '',
    visible: false,
  });

  const handleChartClick = (e: React.MouseEvent, dataPoint: DataPoint) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      content: `Value: ${dataPoint.value || dataPoint.accuracy_percentage || 'N/A'}`,
      visible: true,
    });

    // Auto-hide after 3 seconds
    setTimeout(() => setTooltip((prev) => ({ ...prev, visible: false })), 3000);
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  return { tooltip, handleChartClick, hideTooltip };
};
