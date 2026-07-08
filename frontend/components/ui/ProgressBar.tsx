export function ProgressBar({ value, color = "#7C3AED", height = 6 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.06)" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color }}
      />
    </div>
  );
}