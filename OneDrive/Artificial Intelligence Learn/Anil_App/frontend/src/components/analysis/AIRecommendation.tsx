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

interface AIRecommendationProps {
  analysis: StockAnalysisResponse;
}

export function AIRecommendation({ analysis }: AIRecommendationProps) {
  const config = recommendationConfig[analysis.recommendation];
  const Icon = config.icon;
  const confidencePct = (analysis.confidence_score * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-emerald-400" />
          <h3 className="text-sm font-medium text-gray-400">AI Recommendation</h3>
          <span className="text-[10px] text-gray-600 ml-auto">
            Powered by {analysis.model_used}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Badge variant={analysis.recommendation} size="lg">
            <Icon size={16} className="mr-1" />
            {config.label}
          </Badge>

          <div>
            <p className="text-xs text-gray-500">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${analysis.confidence_score * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-white">{confidencePct}%</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">{analysis.summary}</p>

        <p className="text-xs text-amber-500/80 bg-amber-500/10 px-3 py-2 rounded mt-4">
          {analysis.disclaimer}
        </p>
      </Card>
    </motion.div>
  );
}
