import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';
import { AgentLoadingAnimation } from '../components/loading/AgentLoadingAnimation';
import { AnalysisError } from '../components/error/AnalysisError';

import { LandingHero } from '../components/landing/LandingHero';
import { StockHeader } from '../components/stock/StockHeader';
import { TabBar } from '../components/navigation/TabBar';
import type { AnalysisTab } from '../types/analysis';

// Lazy-loaded tab content — only fetched when the user navigates to the tab
const PriceChart = lazy(() => import('../components/charts/PriceChart').then(m => ({ default: m.PriceChart })));
const NewsFeed = lazy(() => import('../components/news/NewsFeed').then(m => ({ default: m.NewsFeed })));
const QuarterlyEarnings = lazy(() => import('../components/financials/QuarterlyEarnings').then(m => ({ default: m.QuarterlyEarnings })));
const CompanyAbout = lazy(() => import('../components/about/CompanyAbout').then(m => ({ default: m.CompanyAbout })));
const ResearchSources = lazy(() => import('../components/analysis/ResearchSources').then(m => ({ default: m.ResearchSources })));
const InvestmentOutlook = lazy(() => import('../components/invest/InvestmentOutlook').then(m => ({ default: m.InvestmentOutlook })));
const FinancierInsights = lazy(() => import('../components/invest/FinancierInsights').then(m => ({ default: m.FinancierInsights })));

const TAB_ORDER: Record<AnalysisTab, number> = {
  chart: 0,
  news: 1,
  about: 2,
  invest: 3,
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function StockAnalysis() {
  const currentTicker = useStockStore((s) => s.currentTicker);
  const analysis = useStockStore((s) => s.analysis);
  const isLoading = useStockStore((s) => s.isLoading);
  const isRefreshing = useStockStore((s) => s.isRefreshing);
  const lastFetchedAt = useStockStore((s) => s.lastFetchedAt);
  const error = useStockStore((s) => s.error);
  const refreshError = useStockStore((s) => s.refreshError);
  const activeTab = useStockStore((s) => s.activeTab);
  const setActiveTab = useStockStore((s) => s.setActiveTab);
  const streamingMessage = useStockStore((s) => s.streamingMessage);

  const [hasHydrated, setHasHydrated] = useState(useStockStore.persist.hasHydrated());
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [, setTick] = useState(0);

  const prevTabRef = useRef<AnalysisTab>(activeTab);
  const direction = TAB_ORDER[activeTab] > TAB_ORDER[prevTabRef.current] ? 1 : -1;

  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const unsub = useStockStore.persist.onFinishHydration(() => setHasHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingSeconds(0);
      return;
    }
    const interval = setInterval(() => setLoadingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Auto-cancel before the hard 120s frontend abort
  useEffect(() => {
    if (loadingSeconds >= 110 && isLoading) {
      useStockStore.setState({
        isLoading: false,
        error: 'Analysis timed out. Please try again.',
      });
    }
  }, [loadingSeconds, isLoading]);

  // Wait for persist middleware to rehydrate before deciding what to show
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentTicker) {
    return <LandingHero />;
  }

  const agentMessages = [
    'Your AI agent is analyzing market data...',
    'Scanning SEC filings and earnings reports...',
    'AI agents are debating bull vs bear cases...',
    'Crunching technical indicators and chart patterns...',
    'Your AI agent is reading analyst reports...',
    'Cross-referencing news sentiment across sources...',
    'Building price prediction models...',
    'AI agents are stress-testing risk scenarios...',
    'Evaluating competitive landscape and moat strength...',
    'Running Monte Carlo simulations on price targets...',
    'Your AI agent is consulting Wall Street consensus...',
    'Analyzing insider trading patterns and institutional flows...',
    'Almost done — assembling the final report...',
  ];
  let loadingMessage: string;
  if (streamingMessage) {
    loadingMessage = streamingMessage;
  } else if (loadingSeconds >= 90) {
    loadingMessage = 'Almost at the limit — will cancel soon if no response...';
  } else if (loadingSeconds >= 30) {
    loadingMessage = 'Taking longer than usual — hang tight...';
  } else {
    const messageIndex = Math.floor(loadingSeconds / 5) % agentMessages.length;
    loadingMessage = agentMessages[messageIndex];
  }

  if (isLoading) {
    return (
      <AgentLoadingAnimation
        ticker={currentTicker}
        message={loadingMessage}
        elapsedSeconds={loadingSeconds}
      />
    );
  }

  if (error) {
    return <AnalysisError ticker={currentTicker} error={error} />;
  }

  if (!analysis) return <LandingHero />;

  const slideX = direction * 40;

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <StockHeader analysis={analysis} />
      {analysis && lastFetchedAt && (
        <div className="flex items-center gap-2 px-1 -mt-1 mb-1">
          {isRefreshing && (
            <motion.div
              className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full shadow-[0_0_6px_2px_rgba(99,102,241,0.35)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="text-xs text-stone-400">
            Updated {formatTimeAgo(lastFetchedAt)}
          </span>
          {refreshError && lastFetchedAt && Date.now() - lastFetchedAt > 15 * 60 * 1000 && (
            <span className="text-xs text-amber-500 font-medium">
              Data may be stale
            </span>
          )}
        </div>
      )}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={activeTab}
          custom={direction}
          initial={{ opacity: 0, x: slideX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -slideX }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'chart' && (
            <PriceChart
              data={analysis.historical_prices}
              currentPrice={analysis.current_price}
            />
          )}

          {activeTab === 'news' && <NewsFeed items={analysis.news} />}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <CompanyAbout analysis={analysis} />
              <QuarterlyEarnings earnings={analysis.quarterly_earnings} />
              <ResearchSources
                researchContext={analysis.research_context ?? ''}
                researchSources={analysis.research_sources ?? []}
              />
            </div>
          )}

          {activeTab === 'invest' && (
            <div className="space-y-4">
              {analysis.long_term_outlook && (
                <InvestmentOutlook
                  outlook={analysis.long_term_outlook}
                  currentPrice={analysis.current_price}
                  ticker={analysis.ticker}
                />
              )}
              {analysis.financier_analysis && (
                <FinancierInsights
                  analysis={analysis.financier_analysis}
                  ticker={analysis.ticker}
                />
              )}
              {!analysis.long_term_outlook && !analysis.financier_analysis && (
                <div className="text-center py-12 text-stone-400">
                  <p className="text-sm">Long-term outlook data not available for this stock.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      </Suspense>
    </motion.div>
  );
}
