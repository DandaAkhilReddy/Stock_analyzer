import { Shield } from 'lucide-react';
import { Card } from '../common/Card';
import type { RiskAssessment as RiskAssessmentType, RiskLevel } from '../../types/analysis';

const riskColors: Record<RiskLevel, string> = {
  low: '#059669',
  medium: '#d97706',
  high: '#ea580c',
  very_high: '#dc2626',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
};

// SVG circle circumference for r=15.9: 2 * PI * 15.9 ≈ 99.9
// strokeDasharray uses "score 100" where 100 represents the full circle
// This matches the viewBox coordinate space used below.

interface RiskAssessmentProps {
  riskAssessment: RiskAssessmentType;
}

export function RiskAssessment({ riskAssessment }: RiskAssessmentProps) {
  const color = riskColors[riskAssessment.overall_risk];
  const riskPct = (riskAssessment.risk_score * 100).toFixed(0);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-stone-500" />
        <h4 className="text-sm font-medium text-stone-500">Risk Assessment</h4>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${riskAssessment.risk_score * 100}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color }}>
              {riskPct}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium" style={{ color }}>
            {riskLabels[riskAssessment.overall_risk]}
          </p>
        </div>
      </div>

      {riskAssessment.risk_factors.length > 0 && (
        <div>
          <p className="text-xs text-stone-500 mb-2">Risk Factors</p>
          <ul className="space-y-1">
            {riskAssessment.risk_factors.map((factor, i) => (
              <li key={i} className="text-xs text-stone-500 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5">*</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
