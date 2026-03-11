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
      <div className="flex items-center bg-stone-100 border border-stone-300 rounded-lg px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-colors">
        <Search size={18} className="text-stone-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker or company name (e.g., AAPL, Microsoft, Tesla)"
          className="bg-transparent border-none outline-none text-stone-900 placeholder:text-stone-400 ml-2 w-full text-sm"
        />
        {isLoading ? (
          <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
        ) : (
          <button
            onClick={handleSubmit}
            className="text-stone-400 hover:text-indigo-600 transition-colors shrink-0"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
