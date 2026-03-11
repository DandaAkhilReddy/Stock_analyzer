import { TrendingUp, TrendingDown } from 'lucide-react';
import type { StockAnalysisResponse } from '../../types/analysis';
import { Badge } from '../common/Badge';

const recLabels: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

interface StockHeaderProps {
  analysis: StockAnalysisResponse;
}

export function StockHeader({ analysis }: StockHeaderProps) {
  const change = analysis.previous_close
    ? analysis.current_price - analysis.previous_close
    : null;
  const changePct =
    change !== null && analysis.previous_close
      ? (change / analysis.previous_close) * 100
      : null;
  const isPositive = change !== null && change >= 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-stone-900">{analysis.ticker}</h1>
        <span className="text-stone-500 text-lg">{analysis.company_name}</span>
        <Badge variant={analysis.recommendation} size="sm">
          {recLabels[analysis.recommendation] ?? analysis.recommendation}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-2xl font-bold text-stone-900">
            ${analysis.current_price.toFixed(2)}
          </div>
          {change !== null && changePct !== null && (
            <div
              className={`flex items-center justify-end gap-1 text-sm font-medium ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {isPositive ? '+' : ''}
                {change.toFixed(2)} ({isPositive ? '+' : ''}
                {changePct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        {analysis.market_cap && (
          <div className="text-sm text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            Mkt Cap: {analysis.market_cap}
          </div>
        )}
      </div>
    </div>
  );
}
