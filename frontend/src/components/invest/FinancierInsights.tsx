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
  'Value Analysis': TrendingUp,
  'Growth Analysis': Target,
  'Safety Analysis': Shield,
  'Macro Analysis': Lightbulb,
  'Innovation Analysis': BookOpen,
};

const financierGradients: Record<string, string> = {
  'Value Analysis': 'from-emerald-500 to-emerald-600',
  'Growth Analysis': 'from-blue-500 to-cyan-500',
  'Safety Analysis': 'from-slate-500 to-zinc-600',
  'Macro Analysis': 'from-violet-500 to-purple-600',
  'Innovation Analysis': 'from-rose-500 to-pink-500',
};

const tagContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const tagItemVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};

function ConsensusBar({ perspectives }: { perspectives: FinancierPerspective[] }) {
  const total = perspectives.length;
  if (total === 0) return null;
  const buyCount = perspectives.filter((p) => p.verdict === 'buy').length;
  const holdCount = perspectives.filter((p) => p.verdict === 'hold').length;
  const sellCount = perspectives.filter((p) => p.verdict === 'sell').length;

  const segments = [
    { count: buyCount, color: 'bg-emerald-500' },
    { count: holdCount, color: 'bg-amber-400' },
    { count: sellCount, color: 'bg-red-500' },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-stone-100">
        {segments.map(({ count, color }, index) =>
          count > 0 ? (
            <motion.div
              key={color}
              className={color}
              initial={{ width: 0 }}
              animate={{ width: `${(count / total) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.2 * index, ease: 'easeOut' }}
            />
          ) : null
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

function PerspectiveCard({ perspective, index }: { perspective: FinancierPerspective; index: number }) {
  const style = verdictStyles[perspective.verdict] ?? verdictStyles.hold;
  const Icon = financierIcons[perspective.name] ?? Users;
  const gradient = financierGradients[perspective.name] ?? 'from-indigo-500 to-violet-500';
  const slideX = index % 2 === 0 ? -20 : 20;

  return (
    <motion.div
      className="bg-stone-50 border border-stone-100 rounded-xl p-4"
      initial={{ opacity: 0, x: slideX }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
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
        <motion.div
          className="flex flex-wrap gap-1.5"
          variants={tagContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {perspective.key_metrics_evaluated.map((metric) => (
            <motion.span
              key={metric}
              className="text-[10px] font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full"
              variants={tagItemVariants}
            >
              {metric}
            </motion.span>
          ))}
        </motion.div>
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
          <h4 className="text-sm font-medium text-stone-500">Investment Framework Analysis</h4>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${consensusStyle.bg} ${consensusStyle.text}`}>
            Consensus: {consensusStyle.label}
          </span>
        </div>
        <ConsensusBar perspectives={analysis.perspectives} />
      </Card>

      {/* Perspective Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {analysis.perspectives.map((p, i) => (
          <PerspectiveCard key={p.name} perspective={p} index={i} />
        ))}
      </div>

      {/* Consensus Summary */}
      {analysis.consensus_reasoning && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <div className="text-center py-2">
              <p className="text-sm text-stone-600">
                <span className="font-bold text-stone-900">{ticker}</span> —{' '}
                {analysis.consensus_reasoning}
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
