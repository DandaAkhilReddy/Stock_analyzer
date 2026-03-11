interface RSIChartProps {
  rsiValue: number | null;
}

export function RSIChart({ rsiValue }: RSIChartProps): React.JSX.Element | null {
  if (rsiValue === null) return null;

  const overbought = rsiValue > 70;
  const oversold = rsiValue < 30;
  const color = overbought ? '#ef4444' : oversold ? '#10b981' : '#f59e0b';
  const label = overbought ? 'Overbought' : oversold ? 'Oversold' : 'Neutral';

  // Clamp to [0, 100] defensively before using as a percentage
  const positionPct = Math.min(100, Math.max(0, rsiValue));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-400">RSI (14)</h4>
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
        {/* Oversold zone (0–30) */}
        <div className="absolute inset-y-0 left-0 w-[30%] bg-green-500/10" />
        {/* Overbought zone (70–100) */}
        <div className="absolute inset-y-0 right-0 w-[30%] bg-red-500/10" />
        {/* RSI position marker */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-300"
          style={{ left: `${positionPct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between mt-1 text-[10px] text-gray-600">
        <span>0</span>
        <span>30</span>
        <span>50</span>
        <span>70</span>
        <span>100</span>
      </div>

      <div className="text-center mt-1">
        <span className="text-lg font-bold" style={{ color }}>
          {rsiValue.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
