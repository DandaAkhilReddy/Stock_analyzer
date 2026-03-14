/**
 * Tests for src/services/stockApi.ts
 *
 * The `./api` module is mocked at the boundary so these tests verify only the
 * contract that stockApi.ts presents: correct URL construction, ticker encoding,
 * return type pass-through, and error propagation — without exercising the
 * real fetch machinery (covered in api.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '../../services/api';
import type { StockAnalysisResponse } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Module mock — must be hoisted above any imports of the mocked module.
// ---------------------------------------------------------------------------

vi.mock('../../services/api', () => ({
  // Re-export ApiError as a real class so error-propagation tests can use
  // `instanceof ApiError` against values constructed in the mock.
  ApiError: class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  },
  post: vi.fn(),
  get: vi.fn(),
}));

// Import after vi.mock so the resolved module is the mocked version.
import { post, get } from '../../services/api';
import { analyzeStock, searchStocks } from '../../services/stockApi';
import type { SearchResult } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Fixture — minimal but type-safe StockAnalysisResponse
// ---------------------------------------------------------------------------

const MOCK_ANALYSIS: StockAnalysisResponse = {
  ticker: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 175.5,
  previous_close: 173.0,
  open: 174.0,
  day_high: 176.5,
  day_low: 173.5,
  volume: 55_000_000,
  market_cap: '2.7T',
  pe_ratio: 28.4,
  eps: 6.18,
  week_52_high: 198.23,
  week_52_low: 124.17,
  dividend_yield: 0.55,
  technical: {
    sma_20: 170.0,
    sma_50: 165.0,
    sma_200: 155.0,
    ema_12: 171.0,
    ema_26: 168.0,
    rsi_14: 58.3,
    macd_line: 1.2,
    macd_signal: 0.9,
    macd_histogram: 0.3,
    bollinger_upper: 180.0,
    bollinger_middle: 170.0,
    bollinger_lower: 160.0,
    support_levels: [165.0, 160.0],
    resistance_levels: [180.0, 185.0],
    signal: 'buy',
  },
  news: [{ title: 'Apple beats earnings', source: 'Reuters', sentiment: 'positive' }],
  quarterly_earnings: [
    {
      quarter: 'Q1 2025',
      revenue: 119_575_000_000,
      net_income: 36_330_000_000,
      eps: 2.4,
      yoy_revenue_growth: 4.0,
    },
  ],
  recommendation: 'buy',
  confidence_score: 0.82,
  summary: 'Apple shows strong fundamentals.',
  bull_case: 'Services revenue continues to grow.',
  bear_case: 'China headwinds and slowing iPhone upgrade cycle.',
  risk_assessment: {
    overall_risk: 'low',
    risk_factors: ['Regulatory scrutiny'],
    risk_score: 2.1,
  },
  price_predictions: {
    one_week: { low: 172.0, mid: 176.0, high: 180.0, confidence: 0.75 },
    one_month: { low: 168.0, mid: 178.0, high: 188.0, confidence: 0.65 },
    three_months: { low: 160.0, mid: 185.0, high: 205.0, confidence: 0.55 },
  },
  analysis_timestamp: '2025-01-15T10:00:00Z',
  model_used: 'gpt-4o',
  disclaimer: 'Not financial advice.',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockPost = vi.mocked(post);
const mockGet = vi.mocked(get);

// ---------------------------------------------------------------------------
// analyzeStock — URL construction
// ---------------------------------------------------------------------------

describe('analyzeStock — URL construction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls post with path /api/analyze/{ticker} for a plain uppercase ticker', async () => {
    mockPost.mockResolvedValue(MOCK_ANALYSIS);

    await analyzeStock('AAPL');

    expect(mockPost).toHaveBeenCalledOnce();
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/AAPL');
  });

  it('calls post with path /api/analyze/{ticker} for a lowercase ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'msft' });

    await analyzeStock('msft');

    expect(mockPost).toHaveBeenCalledWith('/api/analyze/msft');
  });

  it('calls post with no body argument — analyzeStock passes only the path', async () => {
    mockPost.mockResolvedValue(MOCK_ANALYSIS);

    await analyzeStock('AAPL');

    // post is called with exactly one argument (the path); no body is passed
    expect(mockPost.mock.calls[0]).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// analyzeStock — ticker encoding
// ---------------------------------------------------------------------------

describe('analyzeStock — ticker encoding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes plain alphanumeric tickers through without modification', async () => {
    mockPost.mockResolvedValue(MOCK_ANALYSIS);

    await analyzeStock('TSLA');

    expect(mockPost).toHaveBeenCalledWith('/api/analyze/TSLA');
  });

  it('percent-encodes a forward slash in the ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'A/B' });

    await analyzeStock('A/B');

    // encodeURIComponent('A/B') === 'A%2FB'
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/A%2FB');
  });

  it('percent-encodes a space in the ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'BRK B' });

    await analyzeStock('BRK B');

    // encodeURIComponent('BRK B') === 'BRK%20B'
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/BRK%20B');
  });

  it('percent-encodes a plus sign in the ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'A+B' });

    await analyzeStock('A+B');

    // encodeURIComponent('A+B') === 'A%2BB'
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/A%2BB');
  });

  it('percent-encodes an ampersand in the ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'AT&T' });

    await analyzeStock('AT&T');

    // encodeURIComponent('AT&T') === 'AT%26T'
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/AT%26T');
  });

  it('percent-encodes a question mark in the ticker', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'A?B' });

    await analyzeStock('A?B');

    // encodeURIComponent('A?B') === 'A%3FB'
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/A%3FB');
  });

  it('does not double-encode a ticker that is already url-safe', async () => {
    // BRK.B — dot is safe under encodeURIComponent, should remain unchanged
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: 'BRK.B' });

    await analyzeStock('BRK.B');

    expect(mockPost).toHaveBeenCalledWith('/api/analyze/BRK.B');
  });

  it('encodes an empty string ticker to an empty segment', async () => {
    mockPost.mockResolvedValue({ ...MOCK_ANALYSIS, ticker: '' });

    await analyzeStock('');

    // encodeURIComponent('') === ''
    expect(mockPost).toHaveBeenCalledWith('/api/analyze/');
  });
});

// ---------------------------------------------------------------------------
// analyzeStock — return type
// ---------------------------------------------------------------------------

describe('analyzeStock — return type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the StockAnalysisResponse resolved by post', async () => {
    mockPost.mockResolvedValue(MOCK_ANALYSIS);

    const result = await analyzeStock('AAPL');

    expect(result).toEqual(MOCK_ANALYSIS);
  });

  it('returns a response with all nullable fields set to null', async () => {
    const sparseAnalysis: StockAnalysisResponse = {
      ...MOCK_ANALYSIS,
      previous_close: null,
      open: null,
      day_high: null,
      day_low: null,
      volume: null,
      market_cap: null,
      pe_ratio: null,
      eps: null,
      week_52_high: null,
      week_52_low: null,
      dividend_yield: null,
      technical: null,
      news: [],
      quarterly_earnings: [],
    };
    mockPost.mockResolvedValue(sparseAnalysis);

    const result = await analyzeStock('AAPL');

    expect(result).toEqual(sparseAnalysis);
    expect(result.technical).toBeNull();
    expect(result.news).toHaveLength(0);
  });

  it('returns the exact object reference resolved from post without mutation', async () => {
    mockPost.mockResolvedValue(MOCK_ANALYSIS);

    const result = await analyzeStock('AAPL');

    expect(result).toBe(MOCK_ANALYSIS);
  });

  it('returns a different StockAnalysisResponse for a different ticker', async () => {
    const msftAnalysis: StockAnalysisResponse = {
      ...MOCK_ANALYSIS,
      ticker: 'MSFT',
      company_name: 'Microsoft Corporation',
      current_price: 420.0,
      recommendation: 'strong_buy',
    };
    mockPost.mockResolvedValue(msftAnalysis);

    const result = await analyzeStock('MSFT');

    expect(result.ticker).toBe('MSFT');
    expect(result.company_name).toBe('Microsoft Corporation');
    expect(result.recommendation).toBe('strong_buy');
  });
});

// ---------------------------------------------------------------------------
// analyzeStock — error propagation
// ---------------------------------------------------------------------------

describe('analyzeStock — error propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates an ApiError thrown by post', async () => {
    const apiErr = new ApiError(404, 'TICKER_NOT_FOUND', 'Unknown ticker XYZ');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('XYZ')).rejects.toThrow(ApiError);
  });

  it('propagates ApiError status from the api layer', async () => {
    const apiErr = new ApiError(404, 'TICKER_NOT_FOUND', 'Unknown ticker XYZ');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('XYZ')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.status === 404;
    });
  });

  it('propagates ApiError code from the api layer', async () => {
    const apiErr = new ApiError(404, 'TICKER_NOT_FOUND', 'Unknown ticker XYZ');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('XYZ')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.code === 'TICKER_NOT_FOUND';
    });
  });

  it('propagates ApiError message from the api layer', async () => {
    const apiErr = new ApiError(404, 'TICKER_NOT_FOUND', 'Unknown ticker XYZ');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('XYZ')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.message === 'Unknown ticker XYZ';
    });
  });

  it('propagates a 422 VALIDATION_ERROR for a malformed ticker', async () => {
    const apiErr = new ApiError(422, 'VALIDATION_ERROR', 'Ticker must be 1–5 characters');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('TOOLONG_TICKER')).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof ApiError &&
        err.status === 422 &&
        err.code === 'VALIDATION_ERROR'
      );
    });
  });

  it('propagates a 500 SERVER_ERROR from the api layer', async () => {
    const apiErr = new ApiError(500, 'SERVER_ERROR', 'Internal server error');
    mockPost.mockRejectedValue(apiErr);

    await expect(analyzeStock('AAPL')).rejects.toSatisfy((err: unknown) => {
      return err instanceof ApiError && err.status === 500;
    });
  });

  it('propagates a plain Error thrown by post', async () => {
    mockPost.mockRejectedValue(new Error('Network unreachable'));

    await expect(analyzeStock('AAPL')).rejects.toThrow('Network unreachable');
  });

  it('propagates an AbortError when the request times out', async () => {
    const abortErr = new DOMException('The operation was aborted', 'AbortError');
    mockPost.mockRejectedValue(abortErr);

    await expect(analyzeStock('AAPL')).rejects.toSatisfy((err: unknown) => {
      return err instanceof DOMException && err.name === 'AbortError';
    });
  });

  it('does not catch or suppress any error — rejection bubbles unchanged', async () => {
    const sentinel = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Backend is down');
    mockPost.mockRejectedValue(sentinel);

    let caught: unknown;
    try {
      await analyzeStock('AAPL');
    } catch (err) {
      caught = err;
    }

    // Verify it is the exact same object reference — analyzeStock adds no wrapper
    expect(caught).toBe(sentinel);
  });
});

// ---------------------------------------------------------------------------
// searchStocks — URL construction
// ---------------------------------------------------------------------------

const MOCK_RESULTS: SearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'AAPL.MX', name: 'Apple Inc. (Mexico)' },
];

describe('searchStocks — URL construction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls get with path /api/search?q={query} for a plain ticker query', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    await searchStocks('AAPL');

    expect(mockGet).toHaveBeenCalledOnce();
    expect(mockGet).toHaveBeenCalledWith('/api/search?q=AAPL');
  });

  it('encodes a space in the query string', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    await searchStocks('Apple Inc');

    // encodeURIComponent('Apple Inc') === 'Apple%20Inc'
    expect(mockGet).toHaveBeenCalledWith('/api/search?q=Apple%20Inc');
  });

  it('encodes an ampersand in the query string', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    await searchStocks('AT&T');

    // encodeURIComponent('AT&T') === 'AT%26T'
    expect(mockGet).toHaveBeenCalledWith('/api/search?q=AT%26T');
  });

  it('encodes a plus sign in the query string', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    await searchStocks('A+B');

    // encodeURIComponent('A+B') === 'A%2BB'
    expect(mockGet).toHaveBeenCalledWith('/api/search?q=A%2BB');
  });

  it('encodes a forward slash in the query string', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    await searchStocks('BRK/B');

    // encodeURIComponent('BRK/B') === 'BRK%2FB'
    expect(mockGet).toHaveBeenCalledWith('/api/search?q=BRK%2FB');
  });

  it('sends an empty q= parameter when query is an empty string', async () => {
    mockGet.mockResolvedValue([]);

    await searchStocks('');

    expect(mockGet).toHaveBeenCalledWith('/api/search?q=');
  });
});

// ---------------------------------------------------------------------------
// searchStocks — return type
// ---------------------------------------------------------------------------

describe('searchStocks — return type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the SearchResult[] resolved by get', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    const result = await searchStocks('AAPL');

    expect(result).toEqual(MOCK_RESULTS);
  });

  it('returns the exact object reference from get without mutation', async () => {
    mockGet.mockResolvedValue(MOCK_RESULTS);

    const result = await searchStocks('AAPL');

    expect(result).toBe(MOCK_RESULTS);
  });

  it('returns an empty array when get resolves with an empty array', async () => {
    mockGet.mockResolvedValue([]);

    const result = await searchStocks('NOMATCH');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns multiple results preserving order', async () => {
    const ordered: SearchResult[] = [
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'MSFTU', name: 'Microsoft Corp Units' },
    ];
    mockGet.mockResolvedValue(ordered);

    const result = await searchStocks('Microsoft');

    expect(result[0].symbol).toBe('MSFT');
    expect(result[1].symbol).toBe('MSFTU');
  });
});

// ---------------------------------------------------------------------------
// searchStocks — error propagation
// ---------------------------------------------------------------------------

describe('searchStocks — error propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates an ApiError thrown by get', async () => {
    const apiErr = new ApiError(502, 'EXTERNAL_API_ERROR', 'Data provider unavailable');
    mockGet.mockRejectedValue(apiErr);

    await expect(searchStocks('AAPL')).rejects.toThrow(ApiError);
  });

  it('propagates ApiError status and code from the api layer', async () => {
    const apiErr = new ApiError(502, 'EXTERNAL_API_ERROR', 'Data provider unavailable');
    mockGet.mockRejectedValue(apiErr);

    await expect(searchStocks('AAPL')).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof ApiError &&
        err.status === 502 &&
        err.code === 'EXTERNAL_API_ERROR'
      );
    });
  });

  it('propagates a plain Error thrown by get', async () => {
    mockGet.mockRejectedValue(new Error('Network unreachable'));

    await expect(searchStocks('AAPL')).rejects.toThrow('Network unreachable');
  });

  it('does not catch or suppress any error — rejection bubbles unchanged', async () => {
    const sentinel = new ApiError(503, 'SERVICE_UNAVAILABLE', 'Backend is down');
    mockGet.mockRejectedValue(sentinel);

    let caught: unknown;
    try {
      await searchStocks('AAPL');
    } catch (err) {
      caught = err;
    }

    expect(caught).toBe(sentinel);
  });
});
