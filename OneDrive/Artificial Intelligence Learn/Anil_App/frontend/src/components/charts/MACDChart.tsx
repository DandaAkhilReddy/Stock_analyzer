interface MACDChartProps {
  macdLine: number | null;
  signalLine: number | null;
  histogram: number | null;
}

export function MACDChart({ macdLine, signalLine, histogram }: MACDChartProps): React.JSX.Element {
  const histValue = histogram ?? 0;
  const isBullish = histValue >= 0;
  const histColor = isBullish ? '#10b981' : '#ef4444';
  const signal = isBullish ? 'Bullish' : 'Bearish';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-400">MACD (12, 26, 9)</h4>
        <span className="text-xs font-medium" style={{ color: histColor }}>
          {signal}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">MACD Line</p>
          <p className="text-sm font-medium text-blue-400">
            {macdLine !== null ? macdLine.toFixed(2) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Signal</p>
          <p className="text-sm font-medium text-orange-400">
            {signalLine !== null ? signalLine.toFixed(2) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Histogram</p>
          <p className="text-sm font-medium" style={{ color: histColor }}>
            {histogram !== null ? histogram.toFixed(2) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
