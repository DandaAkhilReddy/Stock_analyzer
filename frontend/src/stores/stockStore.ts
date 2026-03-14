import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockAnalysisResponse, AnalysisTab } from '../types/analysis';
import { analyzeStock } from '../services/stockApi';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let refreshTimer: ReturnType<typeof setInterval> | null = null;

interface StockState {
  currentTicker: string | null;
  analysis: StockAnalysisResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  activeTab: AnalysisTab;
  fetchAnalysis: (ticker: string) => Promise<void>;
  silentRefresh: () => Promise<void>;
  setActiveTab: (tab: AnalysisTab) => void;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      currentTicker: null,
      analysis: null,
      isLoading: false,
      isRefreshing: false,
      lastFetchedAt: null,
      error: null,
      activeTab: 'invest',

      fetchAnalysis: async (ticker: string) => {
        if (refreshTimer !== null) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
        set({ currentTicker: ticker, isLoading: true, error: null, analysis: null, activeTab: 'invest' });
        try {
          const analysis = await analyzeStock(ticker);
          set({ analysis, isLoading: false, currentTicker: analysis.ticker, lastFetchedAt: Date.now() });
          refreshTimer = setInterval(() => {
            void get().silentRefresh();
          }, REFRESH_INTERVAL_MS);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Analysis failed';
          set({ error: message, isLoading: false });
        }
      },

      silentRefresh: async () => {
        const { currentTicker } = get();
        if (!currentTicker) return;
        set({ isRefreshing: true });
        try {
          const analysis = await analyzeStock(currentTicker);
          set({ analysis, currentTicker: analysis.ticker, lastFetchedAt: Date.now(), isRefreshing: false });
        } catch {
          set({ isRefreshing: false });
        }
      },

      setActiveTab: (tab: AnalysisTab) => set({ activeTab: tab }),
    }),
    {
      name: 'stock-analyzer-state',
      partialize: (state) => ({
        activeTab: state.activeTab,
      }),
    },
  ),
);
