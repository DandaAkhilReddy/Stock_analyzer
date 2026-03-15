import { useEffect, useRef } from 'react';
import { Search, Loader2, Zap, Brain, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStockStore } from '../../stores/stockStore';
import { useStockSearch } from '../../hooks/useStockSearch';

interface FeaturePill {
  icon: React.ReactNode;
  label: string;
}

const FEATURE_PILLS: FeaturePill[] = [
  { icon: <Zap size={12} />, label: 'Real-Time Data' },
  { icon: <Brain size={12} />, label: 'AI Insights' },
  { icon: <BarChart3 size={12} />, label: 'Technical Analysis' },
];

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
      {/* Animated gradient border wrapper */}
      <div className="glow-border-lg">
        <div className="flex items-center bg-white/90 backdrop-blur-2xl rounded-2xl px-5 py-4 shadow-2xl shadow-indigo-500/10 shimmer-sweep focus-within:shadow-xl focus-within:shadow-indigo-500/20 transition-all duration-300">
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
      </div>

      {isOpen && suggestions.length > 0 && (
        <motion.div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full glass-strong rounded-xl shadow-2xl shadow-indigo-500/10 overflow-hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {suggestions.map((item, i) => (
            <motion.button
              key={item.symbol}
              type="button"
              className={`w-full text-left px-5 py-3 flex items-center justify-between transition-colors ${
                i === selectedIndex
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'hover:bg-stone-50 text-stone-700'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(i)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <span className="truncate text-sm">{item.name}</span>
              <span className="ml-3 font-mono text-xs font-bold text-indigo-500/70 shrink-0">
                {item.symbol}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {FEATURE_PILLS.map((pill, i) => (
          <motion.div
            key={pill.label}
            className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-stone-500 hover:scale-105 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200 cursor-default"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-indigo-400">{pill.icon}</span>
            {pill.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
