import { Loader2, AlertTriangle, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';

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

export function StockAnalysis() {
  const currentTicker = useStockStore((s) => s.currentTicker);
  const analysis = useStockStore((s) => s.analysis);
  const isLoading = useStockStore((s) => s.isLoading);
  const error = useStockStore((s) => s.error);
  const activeTab = useStockStore((s) => s.activeTab);
  const setActiveTab = useStockStore((s) => s.setActiveTab);

  if (!currentTicker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart2 size={64} className="text-stone-300 mb-4" />
        <h2 className="text-xl font-semibold text-stone-500 mb-2">
          Search for a stock to begin
        </h2>
        <p className="text-sm text-stone-400 max-w-md">
          Enter a ticker symbol (e.g., AAPL, TSLA, MSFT) in the search bar above to get
          AI-powered analysis, technical indicators, price predictions, and the latest news.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
        <p className="text-stone-500 text-sm">Analyzing {currentTicker}...</p>
        <p className="text-stone-400 text-xs">
          AI is crunching the data — this may take a few seconds
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-3">
        <AlertTriangle size={40} className="text-red-600" />
        <h2 className="text-lg font-semibold text-red-600">
          Error analyzing {currentTicker}
        </h2>
        <p className="text-sm text-stone-500">{error}</p>
        <button
          onClick={() => useStockStore.getState().fetchAnalysis(currentTicker)}
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Persistent Header */}
      <StockHeader analysis={analysis} />

      {/* Tab Navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
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

          {activeTab === 'about' && <CompanyAbout analysis={analysis} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
