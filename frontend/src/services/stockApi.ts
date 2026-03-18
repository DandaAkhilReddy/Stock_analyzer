import { get, post } from './api';
import { config } from '../config/env';
import type { SearchResult, StockAnalysisResponse } from '../types/analysis';

export function searchStocks(query: string): Promise<SearchResult[]> {
  return get<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`);
}

export function analyzeStock(ticker: string): Promise<StockAnalysisResponse> {
  return post<StockAnalysisResponse>(`/api/analyze/${encodeURIComponent(ticker)}`);
}

interface StreamProgress {
  phase: string;
  progress: number;
  message: string;
  data?: StockAnalysisResponse;
}

export function analyzeStockStream(
  ticker: string,
  onProgress: (progress: StreamProgress) => void,
  onComplete: (data: StockAnalysisResponse) => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();
  const url = `${config.apiUrl}/api/analyze/${encodeURIComponent(ticker)}/stream`;

  fetch(url, { signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: StreamProgress = JSON.parse(line.slice(6));
            if (event.phase === 'complete' && event.data) {
              onComplete(event.data);
            } else if (event.phase === 'error') {
              onError(event.message);
            } else {
              onProgress(event);
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    })
    .catch((err) => {
      if ((err as Error).name !== 'AbortError') {
        onError((err as Error).message ?? 'Stream failed');
      }
    });

  return controller;
}
