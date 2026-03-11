import { post } from './api';
import type { StockAnalysisResponse } from '../types/analysis';

export function analyzeStock(ticker: string): Promise<StockAnalysisResponse> {
  return post<StockAnalysisResponse>(`/api/analyze/${encodeURIComponent(ticker)}`);
}
