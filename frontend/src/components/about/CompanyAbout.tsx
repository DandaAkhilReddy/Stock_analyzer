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

// Spring presets
const popSpring = { type: 'spring' as const, stiffness: 400, damping: 15 };
const softSpring = { type: 'spring' as const, stiffness: 200, damping: 20 };
const bounceSpring = { type: 'spring' as const, stiffness: 300, damping: 18, mass: 0.8 };

// Shared viewport config — triggers slightly before element is fully visible
const viewport = { once: true, margin: '-50px' } as const;

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
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={viewport}
        transition={{ ...bounceSpring, duration: undefined }}
      >
        <Card>
          <div className="flex flex-col gap-3">
            {/* Company name — slide from left with spring bounce */}
            <motion.h2
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewport}
              transition={{ ...bounceSpring }}
            >
              {analysis.company_name}
            </motion.h2>

            {/* Sector / Industry pills — scale pop-in */}
            {(analysis.sector || analysis.industry) && (
              <div className="flex flex-wrap gap-2">
                {analysis.sector && (
                  <motion.span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={viewport}
                    transition={{ ...popSpring, delay: 0.1 }}
                  >
                    <Briefcase size={12} />
                    {analysis.sector}
                  </motion.span>
                )}
                {analysis.industry && (
                  <motion.span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={viewport}
                    transition={{ ...popSpring, delay: 0.2 }}
                  >
                    <Building2 size={12} />
                    {analysis.industry}
                  </motion.span>
                )}
              </div>
            )}

            {/* Info row — stagger slide from bottom */}
            {infoItems.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {infoItems
                  .filter((i) => i.label !== 'Sector' && i.label !== 'Industry')
                  .map(({ icon: Icon, label, value }, idx) => (
                    <motion.div
                      key={label}
                      className="flex items-center gap-1.5 text-sm text-stone-500"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={viewport}
                      transition={{ ...softSpring, delay: 0.15 + idx * 0.15 }}
                    >
                      <Icon size={14} className="text-stone-400" />
                      <span className="font-medium text-stone-700">{value}</span>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Company Description (collapsible) ── */}
      {descText && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ ...softSpring, delay: 0.05 }}
        >
          <Card>
            <h3 className="text-sm font-medium text-stone-500 mb-3">About</h3>
            <motion.div layout className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={descExpanded ? 'expanded' : 'collapsed'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                  {descExpanded ? 'Show less' : 'Read more'}
                  <motion.span
                    animate={{ rotate: descExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="inline-flex"
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </button>
              )}
            </motion.div>
          </Card>
        </motion.div>
      )}

      {/* ── Key Statistics ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ ...softSpring, delay: 0.05 }}
      >
        <Card>
          <h3 className="text-sm font-medium text-stone-500 mb-4">Key Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value }, i) => (
              <motion.div
                key={label}
                className="relative bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-xl p-3 border border-stone-100 overflow-hidden cursor-default"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewport}
                transition={{ ...popSpring, delay: i * 0.06 }}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow: '0 8px 24px rgba(99,102,241,0.15)',
                  borderColor: 'rgb(165,180,252)',
                }}
              >
                {/* Shimmer overlay on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full"
                  whileHover={{ translateX: '200%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
                <div className="relative z-10">
                  <div className="text-[11px] text-stone-400 uppercase tracking-wider font-medium">
                    {label}
                  </div>
                  <div className="text-base font-bold text-stone-900 mt-1">
                    {value ?? 'N/A'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* ── AI Analysis Summary ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ ...softSpring, delay: 0.05 }}
      >
        <Card gradient>
          <div className="flex items-center gap-2 mb-3">
            {/* Brain icon — infinite pulse */}
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Brain size={16} className="text-white" />
            </motion.div>
            <h3 className="text-sm font-medium text-stone-500">AI Analysis Summary</h3>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{analysis.summary}</p>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-400 uppercase tracking-wider">Confidence</span>
            <div className="flex-1 h-2 bg-stone-100 rounded-full max-w-56 overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: `${(analysis.confidence_score * 100).toFixed(0)}%` }}
                viewport={viewport}
                transition={{
                  type: 'spring',
                  stiffness: 80,
                  damping: 14,
                  mass: 0.8,
                  delay: 0.3,
                }}
              />
            </div>
            <motion.span
              className="text-sm font-bold text-indigo-600"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewport}
              transition={{ ...popSpring, delay: 0.5 }}
            >
              {(analysis.confidence_score * 100).toFixed(0)}%
            </motion.span>
          </div>
        </Card>
      </motion.div>

      {/* ── Bull vs Bear ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bull — slides from LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ ...bounceSpring, delay: 0.05 }}
        >
          <Card className="h-full border-l-4 border-l-emerald-400">
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center"
                initial={{ scale: 0, rotate: -30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={viewport}
                transition={{ ...popSpring, delay: 0.2 }}
              >
                <TrendingUp size={14} className="text-emerald-600" />
              </motion.div>
              <h3 className="text-sm font-semibold text-emerald-700">Bull Case</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{analysis.bull_case}</p>
          </Card>
        </motion.div>

        {/* Bear — slides from RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewport}
          transition={{ ...bounceSpring, delay: 0.1 }}
        >
          <Card className="h-full border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center"
                initial={{ scale: 0, rotate: 30 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={viewport}
                transition={{ ...popSpring, delay: 0.2 }}
              >
                <TrendingDown size={14} className="text-red-600" />
              </motion.div>
              <h3 className="text-sm font-semibold text-red-700">Bear Case</h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{analysis.bear_case}</p>
          </Card>
        </motion.div>
      </div>

      {/* ── Risk Assessment ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ ...softSpring, delay: 0.05 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center"
                initial={{ rotate: -90, opacity: 0 }}
                whileInView={{ rotate: 0, opacity: 1 }}
                viewport={viewport}
                transition={{ ...bounceSpring, delay: 0.1 }}
              >
                <Shield size={14} className="text-stone-500" />
              </motion.div>
              <h3 className="text-sm font-medium text-stone-500">Risk Assessment</h3>
            </div>
            {/* Risk badge — scale pop-in */}
            <motion.span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${risk.bg} ${risk.color}`}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={viewport}
              transition={{ ...popSpring, delay: 0.2 }}
            >
              {risk.label}
            </motion.span>
          </div>
          {analysis.risk_assessment.risk_factors.length > 0 && (
            <div className="space-y-2">
              {analysis.risk_assessment.risk_factors.map((factor, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-stone-600"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewport}
                  transition={{ ...softSpring, delay: 0.15 + i * 0.08 }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 shrink-0"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={viewport}
                    transition={{ ...popSpring, delay: 0.2 + i * 0.08 }}
                  />
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
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {analysis.disclaimer}
      </motion.p>
    </div>
  );
}
