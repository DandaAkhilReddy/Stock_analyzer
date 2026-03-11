import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import type { QuarterlyEarning } from '../../types/analysis';

function formatMoney(value: number | null): string {
  if (value === null) return 'N/A';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}T`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}B`;
  return `$${value.toFixed(1)}M`;
}

interface QuarterlyEarningsProps {
  earnings: QuarterlyEarning[];
}

export function QuarterlyEarnings({ earnings }: QuarterlyEarningsProps) {
  if (earnings.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-stone-500" />
          <h4 className="text-sm font-medium text-stone-500">Quarterly Earnings</h4>
        </div>
        <p className="text-sm text-stone-400 text-center py-6">No quarterly data available</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-stone-500" />
        <h4 className="text-sm font-medium text-stone-500">Quarterly Earnings</h4>
        <span className="text-xs text-stone-400 ml-auto">{earnings.length} quarters</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-stone-500 uppercase tracking-wider bg-stone-50">
              <th className="text-left pb-3 font-medium">Quarter</th>
              <th className="text-right pb-3 font-medium">Revenue</th>
              <th className="text-right pb-3 font-medium">Net Income</th>
              <th className="text-right pb-3 font-medium">EPS</th>
              <th className="text-right pb-3 font-medium">YoY Growth</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((q, i) => {
              const yoy = q.yoy_revenue_growth;
              const yoyPositive = yoy !== null && yoy >= 0;

              return (
                <motion.tr
                  key={q.quarter}
                  className={`border-t border-stone-100 ${i % 2 === 0 ? 'bg-stone-50' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <td className="py-2.5 text-stone-900 font-medium">{q.quarter}</td>
                  <td className="py-2.5 text-right text-stone-600">{formatMoney(q.revenue)}</td>
                  <td className="py-2.5 text-right text-stone-600">{formatMoney(q.net_income)}</td>
                  <td className="py-2.5 text-right text-stone-600">
                    {q.eps !== null ? `$${q.eps.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-2.5 text-right">
                    {yoy !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 ${yoyPositive ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {yoyPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {yoyPositive ? '+' : ''}
                        {(yoy * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-stone-400">N/A</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {earnings.map((q, i) => {
          const yoy = q.yoy_revenue_growth;
          const yoyPositive = yoy !== null && yoy >= 0;

          return (
            <motion.div
              key={q.quarter}
              className="bg-stone-50 rounded-xl p-3 border border-stone-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-900">{q.quarter}</span>
                {yoy !== null && (
                  <span
                    className={`text-xs flex items-center gap-0.5 ${yoyPositive ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {yoyPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {yoyPositive ? '+' : ''}
                    {(yoy * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-stone-400">Revenue</p>
                  <p className="text-stone-600">{formatMoney(q.revenue)}</p>
                </div>
                <div>
                  <p className="text-stone-400">Net Income</p>
                  <p className="text-stone-600">{formatMoney(q.net_income)}</p>
                </div>
                <div>
                  <p className="text-stone-400">EPS</p>
                  <p className="text-stone-600">{q.eps !== null ? `$${q.eps.toFixed(2)}` : 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
