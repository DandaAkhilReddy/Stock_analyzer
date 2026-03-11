import { Layers } from 'lucide-react';
import { Card } from '../common/Card';

interface SupportResistanceProps {
  currentPrice: number;
  supportLevels: number[];
  resistanceLevels: number[];
}

export function SupportResistance({ currentPrice, supportLevels, resistanceLevels }: SupportResistanceProps) {
  if (supportLevels.length === 0 && resistanceLevels.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-stone-500" />
        <h4 className="text-sm font-medium text-stone-500">Support &amp; Resistance</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-emerald-600 mb-2 font-medium">Support Levels</p>
          {supportLevels.length > 0 ? (
            supportLevels.map((level, i) => {
              const distPct = (((currentPrice - level) / currentPrice) * 100).toFixed(1);
              return (
                <div key={i} className="flex justify-between py-1 text-xs">
                  <span className="text-stone-400">S{i + 1}</span>
                  <span className="text-emerald-600 font-mono">${level.toFixed(2)}</span>
                  <span className="text-stone-400">{distPct}% below</span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-stone-400">No support levels found</p>
          )}
        </div>

        <div>
          <p className="text-xs text-red-500 mb-2 font-medium">Resistance Levels</p>
          {resistanceLevels.length > 0 ? (
            resistanceLevels.map((level, i) => {
              const distPct = (((level - currentPrice) / currentPrice) * 100).toFixed(1);
              return (
                <div key={i} className="flex justify-between py-1 text-xs">
                  <span className="text-stone-400">R{i + 1}</span>
                  <span className="text-red-500 font-mono">${level.toFixed(2)}</span>
                  <span className="text-stone-400">{distPct}% above</span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-stone-400">No resistance levels found</p>
          )}
        </div>
      </div>
    </Card>
  );
}
