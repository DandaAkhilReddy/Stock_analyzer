import { useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockStore } from '../../stores/stockStore';
import { useStockSearch } from '../../hooks/useStockSearch';

export function HeroSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoading = useStockStore((state) => state.isLoading);

  const {
    query,
    setQuery,
    suggestions,
    selectedIndex,
    isOpen,
    isSearching,
    handleKeyDown: handleSuggestionKeyDown,
    selectSuggestion,
    close,
  } = useStockSearch((symbol) => {
    if (!isLoading) {
      useStockStore.getState().fetchAnalysis(symbol);
    }
  });

  const handleSubmit = (): void => {
    const ticker = query.trim().toUpperCase();
    if (!ticker || isLoading) return;
    close();
    useStockStore.getState().fetchAnalysis(ticker);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && selectedIndex < 0) {
      handleSubmit();
      return;
    }
    handleSuggestionKeyDown(e);
    if (e.key === 'Escape' && !isOpen) {
      inputRef.current?.blur();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  return (
    <motion.div
      className="w-full max-w-2xl relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center bg-white/80 backdrop-blur-xl border border-stone-200/60 rounded-2xl px-5 py-4 shadow-2xl shadow-indigo-500/10 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300">
        <Search size={22} className="text-indigo-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search any stock — AAPL, TSLA, MSFT..."
          className="bg-transparent border-none outline-none text-stone-900 placeholder:text-stone-400 ml-3 w-full text-lg"
          autoFocus
        />
        {isLoading || isSearching ? (
          <Loader2 size={20} className="text-indigo-500 animate-spin shrink-0" />
        ) : (
          <kbd className="hidden sm:inline-flex items-center text-xs text-stone-400 border border-stone-200 rounded-md px-2 py-1 font-mono shrink-0">
            Enter ↵
          </kbd>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-xl shadow-2xl shadow-indigo-500/10 overflow-hidden"
        >
          {suggestions.map((item, i) => (
            <button
              key={item.symbol}
              type="button"
              className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                i === selectedIndex
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(i)}
            >
              <span className="truncate text-sm">{item.name}</span>
              <span className="ml-3 font-mono text-xs font-bold text-indigo-500/70 shrink-0">
                {item.symbol}
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
