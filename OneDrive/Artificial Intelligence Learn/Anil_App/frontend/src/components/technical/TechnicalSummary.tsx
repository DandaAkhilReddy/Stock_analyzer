import { BarChart3 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import type { TechnicalSnapshot } from '../../types/analysis';

type RowSignal = 'buy' | 'sell' | 'neutral';

interface IndicatorRow {
  label: string;
  value: number | null | undefined;
  signal: RowSignal | null;
}

interface TechnicalSummaryProps {
  technical: TechnicalSnapshot;
  currentPrice: number;
}

function deriveSignal(value: number | null | undefined, price: number): RowSignal | null {
  if (value === null || value === undefined) return null;
  return price > value ? 'buy' : 'sell';
}

function deriveRsiSignal(rsi: number | null): RowSignal | null {
  if (rsi === null) return null;
  if (rsi > 70) return 'sell';
  if (rsi < 30) return 'buy';
  return 'neutral';
}

function deriveMacdSignal(histogram: number | null): RowSignal | null {
  if (histogram === null) return null;
  return histogram > 0 ? 'buy' : 'sell';
}

const signalLabel: Record<RowSignal, string> = {
  buy: 'Buy',
  sell: 'Sell',
  neutral: 'Neutral',
};

export function TechnicalSummary({ technical, currentPrice }: TechnicalSummaryProps) {
  const rows: IndicatorRow[] = [
    { label: 'SMA 20', value: technical.sma_20, signal: deriveSignal(technical.sma_20, currentPrice) },
    { label: 'SMA 50', value: technical.sma_50, signal: deriveSignal(technical.sma_50, currentPrice) },
    { label: 'SMA 200', value: technical.sma_200, signal: deriveSignal(technical.sma_200, currentPrice) },
    { label: 'EMA 12', value: technical.ema_12, signal: deriveSignal(technical.ema_12, currentPrice) },
    { label: 'EMA 26', value: technical.ema_26, signal: deriveSignal(technical.ema_26, currentPrice) },
    { label: 'RSI (14)', value: technical.rsi_14, signal: deriveRsiSignal(technical.rsi_14) },
    { label: 'MACD', value: technical.macd_histogram, signal: deriveMacdSignal(technical.macd_histogram) },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-gray-400" />
          <h4 className="text-sm font-medium text-gray-400">Technical Summary</h4>
        </div>
        <Badge variant={technical.signal} size="md">
          {technical.signal.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1 border-b border-gray-800/50 last:border-0"
          >
            <span className="text-xs text-gray-400">{row.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-300">
                {row.value !== null && row.value !== undefined
                  ? row.value.toFixed(2)
                  : 'N/A'}
              </span>
              {row.signal !== null && (
                <Badge variant={row.signal} size="sm">
                  {signalLabel[row.signal]}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
