import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';

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

export function StockAnalysis() {
  const currentTicker = useStockStore((s) => s.currentTicker);
  const analysis = useStockStore((s) => s.analysis);
  const isLoading = useStockStore((s) => s.isLoading);
  const error = useStockStore((s) => s.error);
  const activeTab = useStockStore((s) => s.activeTab);
  const setActiveTab = useStockStore((s) => s.setActiveTab);

  const [loadingSeconds, setLoadingSeconds] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingSeconds(0);
      return;
    }
    const interval = setInterval(() => setLoadingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!currentTicker) {
    return <LandingHero />;
  }

  const loadingMessage =
    loadingSeconds < 10
      ? 'AI is crunching the data'
      : loadingSeconds < 30
        ? 'Still working... generating detailed analysis'
        : 'Almost there... large responses take a bit longer';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] gap-4">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute w-16 h-16 rounded-full border-2 border-indigo-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-stone-600 text-sm font-medium">Analyzing {currentTicker}...</p>
          <p className="text-stone-400 text-xs mt-1">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-72px)] text-center gap-3">
        <AlertTriangle size={40} className="text-red-500" />
        <h2 className="text-lg font-semibold text-red-600">
          Error analyzing {currentTicker}
        </h2>
        <p className="text-sm text-stone-500 max-w-md">{error}</p>
        <button
          onClick={() => useStockStore.getState().fetchAnalysis(currentTicker)}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <StockHeader analysis={analysis} />
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
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
