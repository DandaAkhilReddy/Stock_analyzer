import { Target } from 'lucide-react';
import { Card } from '../common/Card';
import type { PriceForecast, PricePredictions } from '../../types/analysis';

interface ForecastCardProps {
  label: string;
  forecast: PriceForecast;
  currentPrice: number;
}

function ForecastCard({ label, forecast, currentPrice }: ForecastCardProps) {
  const midChange = ((forecast.mid - currentPrice) / currentPrice) * 100;
  const isUp = midChange >= 0;
  const colorClass = isUp ? 'text-emerald-400' : 'text-red-400';
  const changeLabel = `(${isUp ? '+' : ''}${midChange.toFixed(1)}%)`;

  const range = forecast.high - forecast.low;
  // Guard against degenerate case where high === low
  const midPct = range > 0 ? ((forecast.mid - forecast.low) / range) * 100 : 50;

  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-2">{label}</p>

      <div className="text-center mb-2">
        <span className={`text-lg font-bold ${colorClass}`}>
          ${forecast.mid.toFixed(2)}
        </span>
        <span className={`text-xs ml-1 ${colorClass}`}>{changeLabel}</span>
      </div>

      <div className="flex justify-between text-[10px] text-gray-500">
        <span>Low: ${forecast.low.toFixed(2)}</span>
        <span>High: ${forecast.high.toFixed(2)}</span>
      </div>

      {/* Range bar: full bar represents [low, high]; mid marker shows target */}
      <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-emerald-500/30 rounded-full" />
        <div
          className="absolute top-0 bottom-0 w-1 bg-white rounded-full -translate-x-1/2"
          style={{ left: `${midPct}%` }}
        />
      </div>

      <p className="text-[10px] text-gray-600 text-center mt-1">
        Confidence: {(forecast.confidence * 100).toFixed(0)}%
      </p>
    </div>
  );
}

interface PricePredictionProps {
  predictions: PricePredictions;
  currentPrice: number;
}

export function PricePrediction({ predictions, currentPrice }: PricePredictionProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Target size={16} className="text-gray-400" />
        <h4 className="text-sm font-medium text-gray-400">Price Predictions</h4>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ForecastCard
          label="1 Week"
          forecast={predictions.one_week}
          currentPrice={currentPrice}
        />
        <ForecastCard
          label="1 Month"
          forecast={predictions.one_month}
          currentPrice={currentPrice}
        />
        <ForecastCard
          label="3 Months"
          forecast={predictions.three_months}
          currentPrice={currentPrice}
        />
      </div>
    </Card>
  );
}
