import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  User,
  Calendar,
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Shield,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StockAnalysisResponse } from '../../types/analysis';
import { Card } from '../common/Card';

interface CompanyAboutProps {
  analysis: StockAnalysisResponse;
}

const riskStyles: Record<string, { color: string; bg: string; label: string }> = {
  low: { color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', label: 'Low Risk' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-100 border-amber-200', label: 'Medium Risk' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200', label: 'High Risk' },
  very_high: { color: 'text-red-700', bg: 'bg-red-100 border-red-200', label: 'Very High Risk' },
};

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function CompanyAbout({ analysis }: CompanyAboutProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  const infoItems = [
    { icon: Briefcase, label: 'Sector', value: analysis.sector },
    { icon: Building2, label: 'Industry', value: analysis.industry },
    { icon: MapPin, label: 'Headquarters', value: analysis.headquarters },
    { icon: User, label: 'CEO', value: analysis.ceo },
    { icon: Calendar, label: 'Founded', value: analysis.founded },
    { icon: Users, label: 'Employees', value: analysis.employees },
  ].filter((item) => item.value);

  const stats = [
    { label: 'Market Cap', value: analysis.market_cap },
    { label: 'P/E Ratio', value: analysis.pe_ratio?.toFixed(2) },
    { label: 'EPS', value: analysis.eps ? `$${analysis.eps.toFixed(2)}` : null },
    {
      label: '52W High',
      value: analysis.week_52_high ? `$${analysis.week_52_high.toFixed(2)}` : null,
    },
    {
      label: '52W Low',
      value: analysis.week_52_low ? `$${analysis.week_52_low.toFixed(2)}` : null,
    },
    {
      label: 'Div Yield',
      value: analysis.dividend_yield
        ? `${(analysis.dividend_yield * 100).toFixed(2)}%`
        : null,
    },
    {
      label: 'Volume',
      value: analysis.volume ? analysis.volume.toLocaleString() : null,
    },
  ];

  const riskKey = analysis.risk_assessment.overall_risk;
  const risk = riskStyles[riskKey] ?? {
    color: 'text-stone-600',
    bg: 'bg-stone-100 border-stone-200',
    label: riskKey,
  };

  const descText = analysis.company_description ?? '';
  const isLongDesc = descText.length > 300;

  return (
    <div className="space-y-5">
      {/* ── Hero Header ── */}
      <motion.div {...fade(0)}>
        <Card>
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
              {analysis.company_name}
            </h2>

            {/* Sector / Industry pills */}
            {(analysis.sector || analysis.industry) && (
              <div className="flex flex-wrap gap-2">
                {analysis.sector && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Briefcase size={12} />
                    {analysis.sector}
                  </span>
                )}
                {analysis.industry && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                    <Building2 size={12} />
                    {analysis.industry}
                  </span>
                )}
              </div>
            )}

            {/* Compact info row */}
            {infoItems.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {infoItems
                  .filter((i) => i.label !== 'Sector' && i.label !== 'Industry')
                  .map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-1.5 text-sm text-stone-500">
                      <Icon size={14} className="text-stone-400" />
                      <span className="font-medium text-stone-700">{value}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Company Description (collapsible) ── */}
      {descText && (
        <motion.div {...fade(0.08)}>
          <Card>
            <h3 className="text-sm font-medium text-stone-500 mb-3">About</h3>
            <div className="relative">
              <AnimatePresence initial={false}>
                <motion.div
                  key={descExpanded ? 'expanded' : 'collapsed'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                    {descExpanded || !isLongDesc ? descText : `${descText.slice(0, 300)}...`}
                  </p>
                </motion.div>
              </AnimatePresence>
              {isLongDesc && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {descExpanded ? (
                    <>
                      Show less <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Key Statistics ── */}
      <motion.div {...fade(0.16)}>
        <Card>
          <h3 className="text-sm font-medium text-stone-500 mb-4">Key Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value }, i) => (
              <motion.div
                key={label}
                className="bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-xl p-3 border border-stone-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.2 + i * 0.04 }}
              >
                <div className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">
                  {label}
                </div>
                <div className="text-base font-bold text-stone-900 mt-1">
                  {value ?? 'N/A'}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── AI Analysis Summary ── */}
      <motion.div {...fade(0.24)}>
        <Card gradient>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-medium text-stone-500">AI Analysis Summary</h3>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{analysis.summary}</p>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-400 uppercase tracking-wider">Confidence</span>
            <div className="flex-1 h-2 bg-stone-100 rounded-full max-w-56 overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(analysis.confidence_score * 100).toFixed(0)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {(analysis.confidence_score * 100).toFixed(0)}%
            </span>
          </div>
        </Card>
      </motion.div>

      {/* ── Bull vs Bear ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div {...fade(0.32)}>
          <Card className="h-full border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-emerald-700">Bull Case</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{analysis.bull_case}</p>
          </Card>
        </motion.div>
        <motion.div {...fade(0.38)}>
          <Card className="h-full border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown size={14} className="text-red-600" />
              </div>
              <h3 className="text-sm font-semibold text-red-700">Bear Case</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{analysis.bear_case}</p>
          </Card>
        </motion.div>
      </div>

      {/* ── Risk Assessment ── */}
      <motion.div {...fade(0.44)}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center">
                <Shield size={14} className="text-stone-500" />
              </div>
              <h3 className="text-sm font-medium text-stone-500">Risk Assessment</h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${risk.bg} ${risk.color}`}
            >
              {risk.label}
            </span>
          </div>
          {analysis.risk_assessment.risk_factors.length > 0 && (
            <div className="space-y-2">
              {analysis.risk_assessment.risk_factors.map((factor, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-stone-600"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 shrink-0" />
                  {factor}
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── Disclaimer ── */}
      <motion.p
        className="text-xs text-stone-400 text-center px-4"
        {...fade(0.5)}
      >
        {analysis.disclaimer}
      </motion.p>
    </div>
  );
}
