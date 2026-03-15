interface RadialGaugeProps {
  value: number; // 0–100
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function RadialGauge({
  value,
  color = '#6366f1',
  size = 48,
  strokeWidth = 4,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semi-circle
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {/* Background arc */}
        <path
          d={describeArc(size / 2, size / 2, radius)}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={describeArc(size / 2, size / 2, radius)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="text-[10px] font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
}
