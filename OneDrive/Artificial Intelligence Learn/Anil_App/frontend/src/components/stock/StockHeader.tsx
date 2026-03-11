import { TrendingDown, TrendingUp } from 'lucide-react';
import type { StockAnalysisResponse } from '../../types/analysis';

interface StockHeaderProps {
  analysis: StockAnalysisResponse;
}

export function StockHeader({ analysis }: StockHeaderProps) {
  const previousClose = analysis.previous_close ?? analysis.current_price;
  const change = analysis.current_price - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
  const isUp = change >= 0;

  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-white">{analysis.ticker}</h2>
        </div>
        <p className="text-gray-400 text-sm mt-1">{analysis.company_name}</p>
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold text-white">
          ${analysis.current_price.toFixed(2)}
          <span className="text-xs text-amber-400 ml-2">(AI Estimated)</span>
        </div>
        <div
          className={`flex items-center gap-1 justify-end text-sm font-medium ${
            isUp ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>
            {isUp ? '+' : ''}
            {change.toFixed(2)}
          </span>
          <span>
            ({isUp ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
