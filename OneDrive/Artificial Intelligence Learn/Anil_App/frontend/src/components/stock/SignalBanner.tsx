import { motion } from 'framer-motion';
import { Brain, Activity, Shield } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { StockAnalysisResponse, Recommendation, RiskLevel } from '../../types/analysis';

const recommendationLabels: Record<Recommendation, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

const riskColors: Record<RiskLevel, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  very_high: 'text-red-600',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very High',
};

interface SignalBannerProps {
  analysis: StockAnalysisResponse;
}

export function SignalBanner({ analysis }: SignalBannerProps) {
  const confidencePct = (analysis.confidence_score * 100).toFixed(0);
  const riskLevel = analysis.risk_assessment.overall_risk;
  const technicalSignal = analysis.technical?.signal;
  const rsi = analysis.technical?.rsi_14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-4 mb-3">
        {/* Recommendation */}
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-indigo-600" />
          <Badge variant={analysis.recommendation} size="md">
            {recommendationLabels[analysis.recommendation]}
          </Badge>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${analysis.confidence_score * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-stone-600">{confidencePct}%</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-stone-200 hidden sm:block" />

        {/* Technical Signal */}
        {technicalSignal && (
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-stone-400" />
            <span className="text-xs text-stone-400">Tech:</span>
            <Badge variant={technicalSignal} size="sm">
              {technicalSignal.replace('_', ' ')}
            </Badge>
            {rsi !== null && rsi !== undefined && (
              <span className="text-xs text-stone-500">
                RSI: <span className="font-medium text-stone-900">{rsi.toFixed(0)}</span>
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-5 bg-stone-200 hidden sm:block" />

        {/* Risk */}
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-stone-400" />
          <span className="text-xs text-stone-400">Risk:</span>
          <span className={`text-xs font-semibold ${riskColors[riskLevel]}`}>
            {riskLabels[riskLevel]}
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-stone-600 leading-relaxed mb-3">{analysis.summary}</p>

      {/* Disclaimer */}
      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
        {analysis.disclaimer}
      </p>
    </motion.div>
  );
}
