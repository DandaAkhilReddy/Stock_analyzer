import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import type { StockAnalysisResponse } from '../../types/analysis';

interface BullBearCaseProps {
  analysis: StockAnalysisResponse;
}

const springEase = [0.16, 1, 0.3, 1] as const;

export function BullBearCase({ analysis }: BullBearCaseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: springEase }}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-emerald-600" />
            <h4 className="text-sm font-medium text-emerald-600">Bull Case</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{analysis.bull_case}</p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: springEase }}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-red-500" />
            <h4 className="text-sm font-medium text-red-500">Bear Case</h4>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{analysis.bear_case}</p>
        </Card>
      </motion.div>
    </div>
  );
}
