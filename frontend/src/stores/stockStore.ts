import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockAnalysisResponse, AnalysisTab } from '../types/analysis';
import { analyzeStock, analyzeStockStream } from '../services/stockApi';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let activeStreamController: AbortController | null = null;

interface StockState {
  currentTicker: string | null;
  analysis: StockAnalysisResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  refreshError: string | null;
  activeTab: AnalysisTab;
  streamingPhase: string | null;
  streamingProgress: number;
  streamingMessage: string | null;
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
      refreshError: null,
      activeTab: 'invest',
      streamingPhase: null,
      streamingProgress: 0,
      streamingMessage: null,

      fetchAnalysis: async (ticker: string) => {
        if (refreshTimer !== null) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
        if (activeStreamController) {
          activeStreamController.abort();
          activeStreamController = null;
        }

        set({
          currentTicker: ticker,
          isLoading: true,
          error: null,
          refreshError: null,
          analysis: null,
          activeTab: 'invest',
          streamingPhase: null,
          streamingProgress: 0,
          streamingMessage: null,
        });

        try {
          // Try SSE streaming first for real-time progress
          await new Promise<void>((resolve, reject) => {
            activeStreamController = analyzeStockStream(
              ticker,
              (progress) => {
                set({
                  streamingPhase: progress.phase,
                  streamingProgress: progress.progress,
                  streamingMessage: progress.message,
                });
              },
              (data) => {
                set({
                  analysis: data,
                  isLoading: false,
                  currentTicker: data.ticker,
                  lastFetchedAt: Date.now(),
                  streamingPhase: null,
                  streamingProgress: 1,
                  streamingMessage: null,
                });
                activeStreamController = null;
                refreshTimer = setInterval(() => {
                  void get().silentRefresh();
                }, REFRESH_INTERVAL_MS);
                resolve();
              },
              (error) => {
                reject(new Error(error));
              },
            );

            // Timeout after 120s
            setTimeout(() => {
              if (activeStreamController) {
                activeStreamController.abort();
                activeStreamController = null;
              }
              reject(new Error('Analysis timed out. Please try again.'));
            }, 120_000);
          });
        } catch (err) {
          // If streaming fails, fall back to regular POST
          if (get().analysis) return; // Stream already succeeded
          try {
            const analysis = await analyzeStock(ticker);
            set({ analysis, isLoading: false, currentTicker: analysis.ticker, lastFetchedAt: Date.now() });
            refreshTimer = setInterval(() => {
              void get().silentRefresh();
            }, REFRESH_INTERVAL_MS);
          } catch (fallbackErr) {
            const message = fallbackErr instanceof Error ? fallbackErr.message : 'Analysis failed';
            set({ error: message, isLoading: false, streamingPhase: null, streamingMessage: null });
          }
        }
      },

      silentRefresh: async () => {
        const { currentTicker } = get();
        if (!currentTicker) return;
        set({ isRefreshing: true });
        try {
          const analysis = await analyzeStock(currentTicker);
          set({ analysis, currentTicker: analysis.ticker, lastFetchedAt: Date.now(), isRefreshing: false, refreshError: null });
        } catch {
          set({ isRefreshing: false, refreshError: 'Refresh failed — showing last data' });
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
