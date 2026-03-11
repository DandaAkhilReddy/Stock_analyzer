import { Card } from '../common/Card';
import type { StockAnalysisResponse } from '../../types/analysis';

interface KeyStatsProps {
  analysis: StockAnalysisResponse;
}

export function KeyStats({ analysis }: KeyStatsProps) {
  const stats: Array<{ label: string; value: string }> = [
    {
      label: '52W High',
      value: analysis.week_52_high !== null ? `$${analysis.week_52_high.toFixed(2)}` : 'N/A',
    },
    {
      label: '52W Low',
      value: analysis.week_52_low !== null ? `$${analysis.week_52_low.toFixed(2)}` : 'N/A',
    },
    {
      label: 'Market Cap',
      value: analysis.market_cap !== null ? analysis.market_cap : 'N/A',
    },
    {
      label: 'P/E Ratio',
      value: analysis.pe_ratio !== null ? analysis.pe_ratio.toFixed(2) : 'N/A',
    },
    {
      label: 'EPS',
      value: analysis.eps !== null ? `$${analysis.eps.toFixed(2)}` : 'N/A',
    },
    {
      label: 'Div Yield',
      value:
        analysis.dividend_yield !== null
          ? `${(analysis.dividend_yield * 100).toFixed(2)}%`
          : 'N/A',
    },
  ];

  return (
    <Card title="Key Statistics">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-medium text-white mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
