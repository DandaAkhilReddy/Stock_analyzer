import { Loader2, AlertTriangle, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';

import { StockHeader } from '../components/stock/StockHeader';
import { MetricsBar } from '../components/stock/MetricsBar';
import { SignalBanner } from '../components/stock/SignalBanner';
import { TabBar } from '../components/navigation/TabBar';
import { PriceCard } from '../components/stock/PriceCard';
import { KeyStats } from '../components/stock/KeyStats';
import { NewsFeed } from '../components/news/NewsFeed';
import { QuarterlyEarnings } from '../components/financials/QuarterlyEarnings';
import { BullBearCase } from '../components/analysis/BullBearCase';
import { RiskAssessment } from '../components/analysis/RiskAssessment';
import { PricePrediction } from '../components/analysis/PricePrediction';

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
        <BarChart2 size={64} className="text-gray-700 mb-4" />
        <h2 className="text-xl font-semibold text-gray-400 mb-2">Search for a stock to begin</h2>
        <p className="text-sm text-gray-600 max-w-md">
          Enter a ticker symbol (e.g., AAPL, TSLA, MSFT) in the search bar above to get
          AI-powered analysis, technical indicators, price predictions, and the latest news.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={40} className="text-emerald-400 animate-spin" />
        <p className="text-gray-400 text-sm">Analyzing {currentTicker}...</p>
        <p className="text-gray-600 text-xs">AI is crunching the data — this may take a few seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-3">
        <AlertTriangle size={40} className="text-red-400" />
        <h2 className="text-lg font-semibold text-red-400">Error analyzing {currentTicker}</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => useStockStore.getState().fetchAnalysis(currentTicker)}
          className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
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
      <MetricsBar analysis={analysis} />
      <SignalBanner analysis={analysis} />

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
          {activeTab === 'news' && <NewsFeed items={analysis.news} />}

          {activeTab === 'financials' && (
            <div className="space-y-4">
              <QuarterlyEarnings earnings={analysis.quarterly_earnings} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PriceCard analysis={analysis} />
                <KeyStats analysis={analysis} />
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="space-y-4">
              <PricePrediction
                predictions={analysis.price_predictions}
                currentPrice={analysis.current_price}
              />
              <BullBearCase analysis={analysis} />
              <RiskAssessment riskAssessment={analysis.risk_assessment} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
