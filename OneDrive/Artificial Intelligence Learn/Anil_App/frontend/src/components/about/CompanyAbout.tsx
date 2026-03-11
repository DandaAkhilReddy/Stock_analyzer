import { Building2, MapPin, User, Calendar, Users, Briefcase } from 'lucide-react';
import type { StockAnalysisResponse } from '../../types/analysis';
import { Card } from '../common/Card';

interface CompanyAboutProps {
  analysis: StockAnalysisResponse;
}

const riskColors: Record<string, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  very_high: 'text-red-600',
};

const riskLabels: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
};

export function CompanyAbout({ analysis }: CompanyAboutProps) {
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

  return (
    <div className="space-y-6">
      {/* Company Description */}
      {analysis.company_description && (
        <Card>
          <h3 className="text-lg font-semibold text-stone-900 mb-3">
            About {analysis.company_name}
          </h3>
          <p className="text-stone-600 leading-relaxed whitespace-pre-line">
            {analysis.company_description}
          </p>
        </Card>
      )}

      {/* Company Info Grid */}
      {infoItems.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Company Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon size={16} className="text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-stone-400 uppercase tracking-wide">
                    {label}
                  </div>
                  <div className="text-sm font-medium text-stone-900">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Stats */}
      <Card>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Key Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="bg-stone-50 rounded-lg p-3">
              <div className="text-xs text-stone-400 uppercase tracking-wide">{label}</div>
              <div className="text-sm font-semibold text-stone-900 mt-1">
                {value ?? 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-stone-900 mb-3">AI Analysis Summary</h3>
        <p className="text-stone-600 leading-relaxed">{analysis.summary}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm text-stone-400">Confidence:</span>
          <div className="flex-1 h-2 bg-stone-100 rounded-full max-w-48">
            <div
              className="h-2 bg-indigo-500 rounded-full"
              style={{ width: `${(analysis.confidence_score * 100).toFixed(0)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-stone-700">
            {(analysis.confidence_score * 100).toFixed(0)}%
          </span>
        </div>
      </Card>

      {/* Bull vs Bear */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold text-emerald-700 mb-3">Bull Case</h3>
          <p className="text-stone-600 leading-relaxed">{analysis.bull_case}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-red-700 mb-3">Bear Case</h3>
          <p className="text-stone-600 leading-relaxed">{analysis.bear_case}</p>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-stone-900">Risk Assessment</h3>
          <span
            className={`text-sm font-semibold ${
              riskColors[analysis.risk_assessment.overall_risk] ?? 'text-stone-500'
            }`}
          >
            {riskLabels[analysis.risk_assessment.overall_risk] ??
              analysis.risk_assessment.overall_risk}
          </span>
        </div>
        {analysis.risk_assessment.risk_factors.length > 0 && (
          <ul className="space-y-2">
            {analysis.risk_assessment.risk_factors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                <span className="text-stone-400 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-stone-400 text-center px-4">{analysis.disclaimer}</p>
    </div>
  );
}
