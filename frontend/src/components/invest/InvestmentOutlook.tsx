import { motion } from 'framer-motion';
import { TrendingUp, Zap, AlertTriangle, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';
import { RadialGauge } from '../common/RadialGauge';
import { AnimatedCounter } from '../common/AnimatedCounter';
import type { LongTermOutlook, PriceForecast } from '../../types/analysis';

interface InvestmentOutlookProps {
  outlook: LongTermOutlook;
  currentPrice: number;
  ticker: string;
}

const verdictLabel: Record<string, string> = {
  strong_buy: 'STRONG BUY',
  buy: 'BUY',
  hold: 'HOLD',
  sell: 'SELL',
  strong_sell: 'STRONG SELL',
};

const verdictColor: Record<string, string> = {
  strong_buy: 'from-emerald-500 to-emerald-600',
  buy: 'from-emerald-400 to-emerald-500',
  hold: 'from-amber-400 to-amber-500',
  sell: 'from-red-400 to-red-500',
  strong_sell: 'from-red-500 to-red-600',
};

const verdictBg: Record<string, string> = {
  strong_buy: 'bg-emerald-50 border-emerald-200',
  buy: 'bg-emerald-50 border-emerald-200',
  hold: 'bg-amber-50 border-amber-200',
  sell: 'bg-red-50 border-red-200',
  strong_sell: 'bg-red-50 border-red-200',
};

function formatCurrency(value: number): string {
  if (value >= 10000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function investmentGrowth(currentPrice: number, futurePrice: number, investment: number): string {
  const shares = investment / currentPrice;
  const futureValue = shares * futurePrice;
  if (futureValue >= 1_000_000) return `$${(futureValue / 1_000_000).toFixed(2)}M`;
  if (futureValue >= 10_000) return `$${(futureValue / 1_000).toFixed(1)}K`;
  return `$${futureValue.toFixed(0)}`;
}

interface HorizonCardProps {
  label: string;
  forecast: PriceForecast;
  currentPrice: number;
  delay: number;
}

function HorizonCard({ label, forecast, currentPrice, delay }: HorizonCardProps) {
  const change = ((forecast.mid - currentPrice) / currentPrice) * 100;
  const isUp = change >= 0;
  const color = isUp ? 'text-emerald-600' : 'text-red-600';
  const bgBar = isUp ? 'bg-emerald-500' : 'bg-red-500';
  const borderAccent = isUp ? 'border-l-emerald-500' : 'border-l-red-500';
  const invested = 10_000;
  const futureVal = investmentGrowth(currentPrice, forecast.mid, invested);
  const barWidth = Math.min(Math.max(change + 50, 5), 100);
  const confidenceValue = Math.round(forecast.confidence * 100);

  return (
    <motion.div
      className={`bg-stone-50 border border-stone-100 border-l-4 ${borderAccent} rounded-xl p-4`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{label}</p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${color}`}>
          {formatCurrency(forecast.mid)}
        </span>
        <span className={`text-sm font-medium ${color}`}>
          {isUp ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-stone-400">
        <span>Low: {formatCurrency(forecast.low)}</span>
        <span>High: {formatCurrency(forecast.high)}</span>
      </div>

      <div className="mt-1.5 h-2 bg-stone-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bgBar}`}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.3 }}
        />
      </div>

      <motion.div
        className="mt-3 flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.5 }}
      >
        <DollarSign size={14} className="text-indigo-500 shrink-0" />
        <p className="text-sm text-indigo-700">
          <span className="font-bold text-lg">
            <AnimatedCounter value={10000} prefix="$" suffix="" decimals={0} duration={1000} />
            {' '}today
          </span>
          <span className="mx-1">→</span>
          <span className="font-bold text-lg">{futureVal}</span>
        </p>
      </motion.div>

      <div className="mt-3 flex justify-center">
        <RadialGauge value={confidenceValue} size={40} strokeWidth={3} />
      </div>
    </motion.div>
  );
}

export function InvestmentOutlook({ outlook, currentPrice, ticker }: InvestmentOutlookProps) {
  const gradient = verdictColor[outlook.verdict] ?? verdictColor.hold;
  const bg = verdictBg[outlook.verdict] ?? verdictBg.hold;
  const label = verdictLabel[outlook.verdict] ?? 'HOLD';

  return (
    <div className="space-y-4">
      {/* Verdict Banner */}
      <Card>
        <div className={`relative rounded-xl border p-5 text-center overflow-hidden ${bg}`}>
          {/* Vibrant gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-15 pointer-events-none`}
          />
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 backdrop-blur-[1px] bg-white/30 pointer-events-none rounded-xl" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span
                className={`inline-block text-white text-sm font-bold px-4 py-1.5 rounded-full bg-gradient-to-r shadow-md ${gradient}`}
              >
                {label} FOR LONG TERM
              </span>
            </motion.div>
            <p className="mt-3 text-sm text-stone-700 leading-relaxed max-w-xl mx-auto">
              {outlook.verdict_rationale}
            </p>
            {outlook.compound_annual_return > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-lg font-bold text-emerald-600">
                  ~{outlook.compound_annual_return.toFixed(1)}% CAGR
                </span>
                <span className="text-xs text-stone-500">estimated annual return</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Price Trajectory */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-stone-500" />
            <h4 className="text-sm font-medium text-stone-500">Price Trajectory</h4>
            <span className="text-xs text-stone-400 ml-auto">from ${currentPrice.toFixed(2)} today</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <HorizonCard label="1 Year" forecast={outlook.one_year} currentPrice={currentPrice} delay={0} />
            <HorizonCard label="5 Years" forecast={outlook.five_year} currentPrice={currentPrice} delay={0.1} />
            <HorizonCard label="10 Years" forecast={outlook.ten_year} currentPrice={currentPrice} delay={0.2} />
          </div>
        </Card>
      </motion.div>

      {/* Catalysts + Risks side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {outlook.catalysts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-emerald-500" />
                <h4 className="text-sm font-medium text-stone-500">Growth Catalysts</h4>
              </div>
              <ul className="space-y-2">
                {outlook.catalysts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <Zap size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {outlook.long_term_risks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-400" />
                <h4 className="text-sm font-medium text-stone-500">Long-Term Risks</h4>
              </div>
              <ul className="space-y-2">
                {outlook.long_term_risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Bottom Line */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <div className="text-center py-2">
            <p className="text-sm text-stone-600">
              Based on our analysis, <span className="font-bold text-stone-900">{ticker}</span> is a{' '}
              <span className={`font-bold ${
                outlook.verdict.includes('buy') ? 'text-emerald-600' :
                outlook.verdict.includes('sell') ? 'text-red-600' : 'text-amber-600'
              }`}>
                {label}
              </span>{' '}
              for long-term investors.
            </p>
            <p className="text-xs text-stone-400 mt-2">
              Long-term investing historically outperforms short-term trading. Time in the market beats timing the market.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
