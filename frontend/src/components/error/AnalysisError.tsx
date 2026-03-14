import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Search, TrendingUp } from 'lucide-react';
import { searchStocks } from '../../services/stockApi';
import { useStockStore } from '../../stores/stockStore';
import type { SearchResult } from '../../types/analysis';

interface AnalysisErrorProps {
  ticker: string;
  error: string;
}

const POPULAR_STOCKS: SearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
];

function friendlyMessage(error: string): string {
  if (error.includes('402') || error.includes('subscription') || error.includes('Premium')) {
    return 'This search requires a premium data subscription. Try using the stock ticker symbol directly (e.g., GOOGL instead of Google).';
  }
  if (error.includes('404') || error.includes('not found') || error.includes('NOT_FOUND')) {
    return 'We couldn\'t find that stock. Check the spelling or try a ticker symbol.';
  }
  if (error.includes('502') || error.includes('Bad Gateway') || error.includes('EXTERNAL_API')) {
    return 'Our data provider is temporarily unavailable. Try using the exact ticker symbol or try again shortly.';
  }
  if (error.includes('timeout') || error.includes('TIMEOUT') || error.includes('408')) {
    return 'The analysis took too long. Try again — it usually works on the second attempt.';
  }
  return 'Something went wrong. Try a different search or use a ticker symbol directly.';
}

export function AnalysisError({ ticker, error }: AnalysisErrorProps) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fetchAnalysis = useStockStore((s) => s.fetchAnalysis);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      setIsSearching(true);
      try {
        const results = await searchStocks(ticker);
        if (!cancelled) {
          setSuggestions(results.slice(0, 5));
        }
      } catch {
        // Search failed — show popular stocks instead
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    loadSuggestions();
    return () => { cancelled = true; };
  }, [ticker]);

  const hasSuggestions = suggestions.length > 0;
  const displaySuggestions = hasSuggestions ? suggestions : POPULAR_STOCKS.slice(0, 6);
  const suggestionsLabel = hasSuggestions ? 'Did you mean?' : 'Try one of these popular stocks';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center gap-5 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={32} className="text-red-400" />
        </div>

        <h2 className="text-lg font-semibold text-stone-800">
          Couldn&apos;t analyze &ldquo;{ticker}&rdquo;
        </h2>

        <p className="text-sm text-stone-500 max-w-md mt-2">
          {friendlyMessage(error)}
        </p>
      </motion.div>

      {/* Suggestions */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 justify-center mb-3">
          {isSearching ? (
            <Search size={14} className="text-stone-400 animate-pulse" />
          ) : (
            <TrendingUp size={14} className="text-indigo-500" />
          )}
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            {isSearching ? 'Searching...' : suggestionsLabel}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {displaySuggestions.map((stock, i) => (
            <motion.button
              key={stock.symbol}
              onClick={() => fetchAnalysis(stock.symbol)}
              className="flex flex-col items-start p-3 bg-white border border-stone-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 + i * 0.05 }}
            >
              <span className="text-sm font-bold text-stone-900 group-hover:text-indigo-600 transition-colors">
                {stock.symbol}
              </span>
              <span className="text-[11px] text-stone-400 truncate w-full">
                {stock.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Retry button — smaller, secondary */}
      <motion.button
        onClick={() => fetchAnalysis(ticker)}
        className="text-xs text-stone-400 hover:text-indigo-500 transition-colors underline underline-offset-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Try &ldquo;{ticker}&rdquo; again
      </motion.button>
    </div>
  );
}
