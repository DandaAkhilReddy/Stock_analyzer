import { motion } from 'framer-motion';
import type { StockAnalysisResponse } from '../../types/analysis';

const ACCENT_COLORS: readonly string[] = [
  'bg-indigo-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-blue-400',
  'bg-rose-400',
];

interface MetricCardProps {
  label: string;
  value: string;
  accentColor: string;
}

function MetricCard({ label, value, accentColor }: MetricCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-stone-200/60 rounded-xl px-4 py-3 min-w-[120px] flex-shrink-0 hover:shadow-md hover:scale-[1.02] transition-all duration-200 overflow-hidden relative">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentColor}`} />
      <p className="text-[11px] text-stone-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-stone-900">{value}</p>
    </div>
  );
}

interface MetricsBarProps {
  analysis: StockAnalysisResponse;
}

export function MetricsBar({ analysis }: MetricsBarProps) {
  const metrics: Array<{ label: string; value: string }> = [
    {
      label: 'Market Cap',
      value: analysis.market_cap ?? 'N/A',
    },
    {
      label: 'P/E Ratio',
      value: analysis.pe_ratio !== null ? analysis.pe_ratio.toFixed(2) : 'N/A',
    },
    {
      label: 'EPS',
      value: analysis.eps !== null ? `$${analysis.eps.toFixed(2)}` : 'N/A',
    },
    {
      label: '52W High',
      value: analysis.week_52_high !== null ? `$${analysis.week_52_high.toFixed(2)}` : 'N/A',
    },
    {
      label: '52W Low',
      value: analysis.week_52_low !== null ? `$${analysis.week_52_low.toFixed(2)}` : 'N/A',
    },
    {
      label: 'Div Yield',
      value:
        analysis.dividend_yield !== null
          ? `${(analysis.dividend_yield * 100).toFixed(2)}%`
          : 'N/A',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-6 md:overflow-visible"
    >
      {metrics.map((m, i) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={m.value}
          accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length] as string}
        />
      ))}
    </motion.div>
  );
}
