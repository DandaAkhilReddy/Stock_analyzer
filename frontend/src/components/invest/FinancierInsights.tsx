import { motion } from 'framer-motion';
import { TrendingUp, Target, Shield, Lightbulb, BookOpen, Users } from 'lucide-react';
import { Card } from '../common/Card';
import type { FinancierAnalysis, FinancierPerspective, FinancierVerdict } from '../../types/analysis';

interface FinancierInsightsProps {
  analysis: FinancierAnalysis;
  ticker: string;
}

const verdictStyles: Record<FinancierVerdict, { bg: string; text: string; label: string }> = {
  buy: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700', label: 'BUY' },
  hold: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-700', label: 'HOLD' },
  sell: { bg: 'bg-red-100 border-red-200', text: 'text-red-700', label: 'SELL' },
};

const financierIcons: Record<string, typeof TrendingUp> = {
  'Warren Buffett': TrendingUp,
  'Peter Lynch': Target,
  'Benjamin Graham': Shield,
  'Ray Dalio': Lightbulb,
  'Cathie Wood': BookOpen,
};

function ConsensusBar({ perspectives }: { perspectives: FinancierPerspective[] }) {
  const total = perspectives.length;
  if (total === 0) return null;
  const buyCount = perspectives.filter((p) => p.verdict === 'buy').length;
  const holdCount = perspectives.filter((p) => p.verdict === 'hold').length;
  const sellCount = perspectives.filter((p) => p.verdict === 'sell').length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-stone-100">
        {buyCount > 0 && (
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${(buyCount / total) * 100}%` }}
          />
        )}
        {holdCount > 0 && (
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${(holdCount / total) * 100}%` }}
          />
        )}
        {sellCount > 0 && (
          <div
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${(sellCount / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex gap-3 text-xs text-stone-500 shrink-0">
        {buyCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{buyCount} Buy</span>}
        {holdCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{holdCount} Hold</span>}
        {sellCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{sellCount} Sell</span>}
      </div>
    </div>
  );
}

function PerspectiveCard({ perspective, delay }: { perspective: FinancierPerspective; delay: number }) {
  const style = verdictStyles[perspective.verdict] ?? verdictStyles.hold;
  const Icon = financierIcons[perspective.name] ?? Users;

  return (
    <motion.div
      className="bg-stone-50 border border-stone-100 rounded-xl p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800">{perspective.name}</p>
            <p className="text-[11px] text-stone-400">{perspective.framework}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>

      <p className="text-sm text-stone-600 leading-relaxed mb-3">
        {perspective.reasoning}
      </p>

      {perspective.key_metrics_evaluated.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {perspective.key_metrics_evaluated.map((metric) => (
            <span
              key={metric}
              className="text-[10px] font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full"
            >
              {metric}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function FinancierInsights({ analysis, ticker }: FinancierInsightsProps) {
  if (analysis.perspectives.length === 0) return null;

  const consensusStyle = verdictStyles[analysis.consensus_verdict] ?? verdictStyles.hold;

  return (
    <div className="space-y-4">
      {/* Header + Consensus Bar */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-indigo-500" />
          <h4 className="text-sm font-medium text-stone-500">Legendary Investor Analysis</h4>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${consensusStyle.bg} ${consensusStyle.text}`}>
            Consensus: {consensusStyle.label}
          </span>
        </div>
        <ConsensusBar perspectives={analysis.perspectives} />
      </Card>

      {/* Perspective Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {analysis.perspectives.map((p, i) => (
          <PerspectiveCard key={p.name} perspective={p} delay={i * 0.08} />
        ))}
      </div>

      {/* Consensus Summary */}
      {analysis.consensus_reasoning && (
        <Card>
          <div className="text-center py-2">
            <p className="text-sm text-stone-600">
              <span className="font-bold text-stone-900">{ticker}</span> —{' '}
              {analysis.consensus_reasoning}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
