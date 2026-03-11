import { useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useStockStore } from '../../stores/stockStore';

export function StockSearchBar() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = useStockStore((s) => s.isLoading);

  const handleSubmit = (): void => {
    const ticker = query.trim().toUpperCase();
    if (ticker.length > 0 && !isLoading) {
      useStockStore.getState().fetchAnalysis(ticker);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus-within:border-emerald-500 transition-colors">
        <Search size={18} className="text-gray-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker or company name (e.g., AAPL, Microsoft, Tesla)"
          className="bg-transparent border-none outline-none text-white placeholder-gray-500 ml-2 w-full text-sm"
        />
        {isLoading ? (
          <Loader2 size={16} className="text-emerald-500 animate-spin shrink-0" />
        ) : (
          <button
            onClick={handleSubmit}
            className="text-gray-500 hover:text-emerald-400 transition-colors shrink-0"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
