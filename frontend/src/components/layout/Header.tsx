import { TrendingUp } from 'lucide-react';
import { StockSearchBar } from '../search/StockSearchBar';
import { useStockStore } from '../../stores/stockStore';

export function Header() {
  const currentTicker = useStockStore((s) => s.currentTicker);
  const isLanding = !currentTicker;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isLanding
          ? 'bg-transparent border-b border-transparent'
          : 'bg-white/80 backdrop-blur-xl border-b border-stone-200 shadow-sm'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp className="text-indigo-600" size={28} />
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">Stock Analyzer</h1>
            <p className="text-xs text-stone-400">AI-Powered Analysis</p>
          </div>
        </div>
        {!isLanding && (
          <div className="flex-1 max-w-xl">
            <StockSearchBar />
          </div>
        )}
      </div>
    </header>
  );
}
