import { TrendingUp } from 'lucide-react';
import { StockSearchBar } from '../search/StockSearchBar';

export function Header() {
  return (
    <header className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp className="text-indigo-600" size={28} />
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">Stock Analyzer</h1>
            <p className="text-xs text-stone-400">AI-Powered Analysis</p>
          </div>
        </div>
        <div className="flex-1 max-w-xl">
          <StockSearchBar />
        </div>
      </div>
    </header>
  );
}
