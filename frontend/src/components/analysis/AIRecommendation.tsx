import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import type { StockAnalysisResponse, Recommendation } from '../../types/analysis';

interface RecommendationConfig {
  icon: typeof TrendingUp;
  label: string;
}

const recommendationConfig: Record<Recommendation, RecommendationConfig> = {
  strong_buy: { icon: TrendingUp, label: 'Strong Buy' },
  buy: { icon: TrendingUp, label: 'Buy' },
  hold: { icon: Minus, label: 'Hold' },
  sell: { icon: TrendingDown, label: 'Sell' },
  strong_sell: { icon: TrendingDown, label: 'Strong Sell' },
};

const topStripGradient: Record<Recommendation, string> = {
  strong_buy: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  buy: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  hold: 'bg-gradient-to-r from-amber-500 to-amber-400',
  sell: 'bg-gradient-to-r from-red-500 to-red-400',
  strong_sell: 'bg-gradient-to-r from-red-500 to-red-400',
};

interface AIRecommendationProps {
  analysis: StockAnalysisResponse;
}

export function AIRecommendation({ analysis }: AIRecommendationProps) {
  const config = recommendationConfig[analysis.recommendation];
  const Icon = config.icon;
  const confidencePct = (analysis.confidence_score * 100).toFixed(0);
  const stripGradient = topStripGradient[analysis.recommendation];
  const confidenceWidth = `${analysis.confidence_score * 100}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Outer wrapper to layer the gradient strip on top of the Card */}
      <div className="relative">
        {/* 4px gradient strip — sits above the card, rounded top corners */}
        <div className={`h-1 rounded-t-2xl ${stripGradient}`} />

        <Card className="rounded-t-none">
          <div className="flex items-center gap-2 mb-4">
            {/* Animated pulse wrapper around Brain icon */}
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full p-0.5"
            >
              <Brain size={18} className="text-indigo-600" />
            </motion.span>
            <h3 className="text-sm font-medium text-stone-500">AI Recommendation</h3>
            <span className="text-[10px] text-stone-400 ml-auto">
              Powered by {analysis.model_used}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
            >
              <Badge variant={analysis.recommendation} size="lg">
                <Icon size={16} className="mr-1" />
                <span className="text-2xl font-bold leading-none">{config.label}</span>
              </Badge>
            </motion.div>

            <div>
              <p className="text-xs text-stone-500">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: confidenceWidth }}
                    initial={{ width: 0 }}
                    animate={{ width: confidenceWidth }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-sm font-medium text-stone-900">{confidencePct}%</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">{analysis.summary}</p>

          <motion.p
            className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded mt-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {analysis.disclaimer}
          </motion.p>
        </Card>
      </div>
    </motion.div>
  );
}
