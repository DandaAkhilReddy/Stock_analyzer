import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StockAnalysisResponse } from '../../types/analysis';
import { Badge } from '../common/Badge';
import { AnimatedCounter } from '../common/AnimatedCounter';

const recLabels: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

interface StockHeaderProps {
  analysis: StockAnalysisResponse;
}

export function StockHeader({ analysis }: StockHeaderProps) {
  const change = analysis.previous_close
    ? analysis.current_price - analysis.previous_close
    : null;
  const changePct =
    change !== null && analysis.previous_close
      ? (change / analysis.previous_close) * 100
      : null;
  const isPositive = change !== null && change >= 0;

  const avatarLetter = (analysis.company_name ?? analysis.ticker).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
      <div className="flex items-center gap-3 flex-wrap">
        <motion.div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-white font-bold text-lg leading-none">{avatarLetter}</span>
        </motion.div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-stone-900">{analysis.ticker}</h1>
            <motion.div
              className="text-stone-500 text-lg inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {analysis.company_name}
            </motion.div>
          </div>
          <Badge variant={analysis.recommendation} size="sm">
            {recLabels[analysis.recommendation] ?? analysis.recommendation}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-3xl font-bold text-stone-900">
            <AnimatedCounter
              value={analysis.current_price}
              prefix="$"
              decimals={2}
              className="text-3xl font-bold text-stone-900"
            />
          </div>
          {change !== null && changePct !== null && (
            <div className="flex items-center justify-end mt-1">
              <motion.div
                className={`rounded-full px-3 py-1 text-sm font-semibold inline-flex items-center gap-1 border ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
              >
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? '+' : ''}
                {change.toFixed(2)} ({isPositive ? '+' : ''}
                {changePct.toFixed(2)}%)
              </motion.div>
            </div>
          )}
        </div>
        {analysis.market_cap && (
          <div className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            Mkt Cap: {analysis.market_cap}
          </div>
        )}
      </div>
    </div>
  );
}
