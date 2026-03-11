import { TrendingUp } from 'lucide-react';
import { StockSearchBar } from '../search/StockSearchBar';

export function Header() {
  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp className="text-emerald-400" size={28} />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Stock Analyzer</h1>
            <p className="text-xs text-gray-500">AI-Powered Analysis</p>
          </div>
        </div>
        <div className="flex-1 max-w-xl">
          <StockSearchBar />
        </div>
      </div>
    </header>
  );
}
