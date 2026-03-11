import { Card } from '../common/Card';
import type { StockAnalysisResponse } from '../../types/analysis';

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div>
      <p className="text-xs text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}

interface PriceCardProps {
  analysis: StockAnalysisResponse;
}

export function PriceCard({ analysis }: PriceCardProps) {
  return (
    <Card title="Price Data">
      <div className="grid grid-cols-3 gap-4">
        <StatItem
          label="Open"
          value={analysis.open !== null ? `$${analysis.open.toFixed(2)}` : 'N/A'}
        />
        <StatItem
          label="High"
          value={analysis.day_high !== null ? `$${analysis.day_high.toFixed(2)}` : 'N/A'}
        />
        <StatItem
          label="Low"
          value={analysis.day_low !== null ? `$${analysis.day_low.toFixed(2)}` : 'N/A'}
        />
        <StatItem label="Close" value={`$${analysis.current_price.toFixed(2)}`} />
        <StatItem
          label="Volume"
          value={analysis.volume !== null ? formatNumber(analysis.volume) : 'N/A'}
        />
        <StatItem
          label="Prev Close"
          value={analysis.previous_close !== null ? `$${analysis.previous_close.toFixed(2)}` : 'N/A'}
        />
      </div>
    </Card>
  );
}
