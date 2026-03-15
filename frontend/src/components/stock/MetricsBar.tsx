import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { StockAnalysisResponse } from '../../types/analysis';
import { AnimatedCounter } from '../common/AnimatedCounter';

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
  numericValue: number | null;
  prefix: string;
  suffix: string;
  decimals: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function MetricCard({ label, value, accentColor, numericValue, prefix, suffix, decimals }: MetricCardProps) {
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/70 backdrop-blur-sm border border-stone-200/60 rounded-xl px-4 py-3 min-w-[120px] flex-shrink-0 overflow-hidden relative cursor-default"
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(99,102,241,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className={`absolute top-0 left-0 h-0.5 ${accentColor} transition-all duration-700`}
        style={{ right: barReady ? '0' : '100%' }}
      />
      <p className="text-[11px] text-stone-500 uppercase tracking-wider mb-1">{label}</p>
      {numericValue !== null ? (
        <AnimatedCounter
          value={numericValue}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          className="text-sm font-bold text-stone-900 block"
        />
      ) : (
        <p className="text-sm font-bold text-stone-900">{value}</p>
      )}
    </motion.div>
  );
}

interface MetricsBarProps {
  analysis: StockAnalysisResponse;
}

interface MetricDef {
  label: string;
  value: string;
  numericValue: number | null;
  prefix: string;
  suffix: string;
  decimals: number;
}

export function MetricsBar({ analysis }: MetricsBarProps) {
  const metrics: MetricDef[] = [
    {
      label: 'Market Cap',
      value: analysis.market_cap ?? 'N/A',
      numericValue: null,
      prefix: '',
      suffix: '',
      decimals: 0,
    },
    {
      label: 'P/E Ratio',
      value: analysis.pe_ratio !== null ? analysis.pe_ratio.toFixed(2) : 'N/A',
      numericValue: analysis.pe_ratio,
      prefix: '',
      suffix: '',
      decimals: 2,
    },
    {
      label: 'EPS',
      value: analysis.eps !== null ? `$${analysis.eps.toFixed(2)}` : 'N/A',
      numericValue: analysis.eps,
      prefix: '$',
      suffix: '',
      decimals: 2,
    },
    {
      label: '52W High',
      value: analysis.week_52_high !== null ? `$${analysis.week_52_high.toFixed(2)}` : 'N/A',
      numericValue: analysis.week_52_high,
      prefix: '$',
      suffix: '',
      decimals: 2,
    },
    {
      label: '52W Low',
      value: analysis.week_52_low !== null ? `$${analysis.week_52_low.toFixed(2)}` : 'N/A',
      numericValue: analysis.week_52_low,
      prefix: '$',
      suffix: '',
      decimals: 2,
    },
    {
      label: 'Div Yield',
      value:
        analysis.dividend_yield !== null
          ? `${(analysis.dividend_yield * 100).toFixed(2)}%`
          : 'N/A',
      numericValue: analysis.dividend_yield !== null ? analysis.dividend_yield * 100 : null,
      prefix: '',
      suffix: '%',
      decimals: 2,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide md:grid md:grid-cols-6 md:overflow-visible"
    >
      {metrics.map((m, i) => (
        <MetricCard
          key={m.label}
          label={m.label}
          value={m.value}
          accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length] as string}
          numericValue={m.numericValue}
          prefix={m.prefix}
          suffix={m.suffix}
          decimals={m.decimals}
        />
      ))}
    </motion.div>
  );
}
