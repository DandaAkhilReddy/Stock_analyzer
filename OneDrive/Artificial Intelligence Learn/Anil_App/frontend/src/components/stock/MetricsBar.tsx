import { motion } from 'framer-motion';
import type { StockAnalysisResponse } from '../../types/analysis';

interface MetricPillProps {
  label: string;
  value: string;
}

function MetricPill({ label, value }: MetricPillProps) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 min-w-[120px] flex-shrink-0">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

interface MetricsBarProps {
  analysis: StockAnalysisResponse;
}

export function MetricsBar({ analysis }: MetricsBarProps) {
  const metrics: MetricPillProps[] = [
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
      {metrics.map((m) => (
        <MetricPill key={m.label} label={m.label} value={m.value} />
      ))}
    </motion.div>
  );
}
