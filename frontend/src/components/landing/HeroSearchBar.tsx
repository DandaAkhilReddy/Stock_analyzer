import { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockStore } from '../../stores/stockStore';

export function HeroSearchBar(): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = useStockStore((state) => state.isLoading);

  const handleSubmit = (): void => {
    const ticker = query.trim().toUpperCase();
    if (!ticker || isLoading) return;
    useStockStore.getState().fetchAnalysis(ticker);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl"
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
        {isLoading ? (
          <Loader2 size={20} className="text-indigo-500 animate-spin shrink-0" />
        ) : (
          <kbd className="hidden sm:inline-flex items-center text-xs text-stone-400 border border-stone-200 rounded-md px-2 py-1 font-mono shrink-0">
            Enter ↵
          </kbd>
        )}
      </div>
    </motion.div>
  );
}
