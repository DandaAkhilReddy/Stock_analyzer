import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';
import { AgentLoadingAnimation } from '../components/loading/AgentLoadingAnimation';
import { AnalysisError } from '../components/error/AnalysisError';

import { LandingHero } from '../components/landing/LandingHero';
import { StockHeader } from '../components/stock/StockHeader';
import { TabBar } from '../components/navigation/TabBar';
import { PriceChart } from '../components/charts/PriceChart';
import { PriceCard } from '../components/stock/PriceCard';
import { NewsFeed } from '../components/news/NewsFeed';
import { QuarterlyEarnings } from '../components/financials/QuarterlyEarnings';
import { PricePrediction } from '../components/analysis/PricePrediction';
import { TechnicalSummary } from '../components/technical/TechnicalSummary';
import { SupportResistance } from '../components/technical/SupportResistance';
import { CompanyAbout } from '../components/about/CompanyAbout';
import { ResearchSources } from '../components/analysis/ResearchSources';
import { InvestmentOutlook } from '../components/invest/InvestmentOutlook';
import { FinancierInsights } from '../components/invest/FinancierInsights';

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
  const activeTab = useStockStore((s) => s.activeTab);
  const setActiveTab = useStockStore((s) => s.setActiveTab);

  const [hasHydrated, setHasHydrated] = useState(useStockStore.persist.hasHydrated());
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [, setTick] = useState(0);

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
  const messageIndex = Math.floor(loadingSeconds / 5) % agentMessages.length;
  const loadingMessage = agentMessages[messageIndex];

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

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <StockHeader analysis={analysis} />
      {analysis && lastFetchedAt && (
        <div className="flex items-center gap-2 px-1 -mt-1 mb-1">
          {isRefreshing && (
            <motion.div
              className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="text-xs text-stone-400">
            Updated {formatTimeAgo(lastFetchedAt)}
          </span>
        </div>
      )}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'chart' && (
            <PriceChart
              data={analysis.historical_prices}
              currentPrice={analysis.current_price}
            />
          )}

          {activeTab === 'news' && <NewsFeed items={analysis.news} />}

          {activeTab === 'financials' && (
            <div className="space-y-4">
              <QuarterlyEarnings earnings={analysis.quarterly_earnings} />
              <PriceCard analysis={analysis} />
              {analysis.technical && (
                <>
                  <TechnicalSummary
                    technical={analysis.technical}
                    currentPrice={analysis.current_price}
                  />
                  <SupportResistance
                    currentPrice={analysis.current_price}
                    supportLevels={analysis.technical.support_levels}
                    resistanceLevels={analysis.technical.resistance_levels}
                  />
                </>
              )}
              <PricePrediction
                predictions={analysis.price_predictions}
                currentPrice={analysis.current_price}
              />
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <CompanyAbout analysis={analysis} />
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
    </motion.div>
  );
}
