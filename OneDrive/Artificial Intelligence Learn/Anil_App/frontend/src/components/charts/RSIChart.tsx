interface RSIChartProps {
  rsiValue: number | null;
}

export function RSIChart({ rsiValue }: RSIChartProps): React.JSX.Element | null {
  if (rsiValue === null) return null;

  const overbought = rsiValue > 70;
  const oversold = rsiValue < 30;
  const color = overbought ? '#dc2626' : oversold ? '#059669' : '#d97706';
  const label = overbought ? 'Overbought' : oversold ? 'Oversold' : 'Neutral';

  // Clamp to [0, 100] defensively before using as a percentage
  const positionPct = Math.min(100, Math.max(0, rsiValue));

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-stone-500">RSI (14)</h4>
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
        {/* Oversold zone (0–30) */}
        <div className="absolute inset-y-0 left-0 w-[30%] bg-emerald-500/15" />
        {/* Overbought zone (70–100) */}
        <div className="absolute inset-y-0 right-0 w-[30%] bg-red-500/15" />
        {/* RSI position marker */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-300"
          style={{ left: `${positionPct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between mt-1 text-[10px] text-stone-400">
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
