/**
 * Tests for SignalBanner and CompanyAbout components.
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via src/test/setup.ts.
 *
 * framer-motion is stubbed so motion.div renders as a plain <div> and the
 * motion-value hooks return deterministic values, keeping tests fast.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module stubs — must appear before any component imports
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => {
  const makeEl = (tag: string) => {
    const Component = ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
      const El = tag as React.ElementType;
      // Strip framer-motion-specific props that aren't valid DOM attributes
      const {
        initial, animate, exit, transition, whileHover, whileInView, whileTap,
        viewport, variants, layout, ...domProps
      } = rest as Record<string, unknown>;
      return <El {...domProps}>{children}</El>;
    };
    Component.displayName = `motion.${tag}`;
    return Component;
  };
  return {
    motion: {
      div: makeEl('div'),
      p: makeEl('p'),
      h2: makeEl('h2'),
      span: makeEl('span'),
      button: makeEl('button'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: (v: unknown) => v,
    useTransform: () => 0,
  };
});

// ---------------------------------------------------------------------------
// Components under test
// ---------------------------------------------------------------------------

import { SignalBanner } from '../../components/stock/SignalBanner';
import { CompanyAbout } from '../../components/about/CompanyAbout';
import type { StockAnalysisResponse, RiskLevel, Recommendation } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Shared base fixture — all fields populated
// ---------------------------------------------------------------------------

const baseAnalysis: StockAnalysisResponse = {
  ticker: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 185.5,
  previous_close: 184.2,
  open: 184.8,
  day_high: 186.1,
  day_low: 184.0,
  volume: 45_000_000,
  market_cap: '2.8T',
  pe_ratio: 28.5,
  eps: 6.51,
  week_52_high: 199.62,
  week_52_low: 164.08,
  dividend_yield: 0.0054,
  technical: {
    sma_20: 183.5,
    sma_50: 180.2,
    sma_200: 175.0,
    ema_12: 184.0,
    ema_26: 182.5,
    rsi_14: 62.3,
    macd_line: 1.5,
    macd_signal: 1.2,
    macd_histogram: 0.3,
    bollinger_upper: 190.0,
    bollinger_middle: 183.5,
    bollinger_lower: 177.0,
    support_levels: [180.0],
    resistance_levels: [190.0],
    signal: 'buy',
  },
  news: [],
  quarterly_earnings: [],
  historical_prices: [],
  company_description: 'Apple designs and sells consumer electronics, software, and services.',
  sector: 'Technology',
  industry: 'Consumer Electronics',
  headquarters: 'Cupertino, CA',
  ceo: 'Tim Cook',
  founded: '1976',
  employees: '164,000',
  recommendation: 'buy',
  confidence_score: 0.78,
  summary: 'Apple shows strong momentum across all segments.',
  bull_case: 'Strong ecosystem lock-in and growing services revenue.',
  bear_case: 'Regulatory pressure and China market uncertainty.',
  risk_assessment: {
    overall_risk: 'medium',
    risk_factors: ['Regulatory pressure', 'Supply chain constraints'],
    risk_score: 0.45,
  },
  price_predictions: {
    one_week: { low: 183.0, mid: 186.0, high: 189.0, confidence: 0.75 },
    one_month: { low: 180.0, mid: 190.0, high: 200.0, confidence: 0.65 },
    three_months: { low: 175.0, mid: 195.0, high: 215.0, confidence: 0.55 },
  },
  long_term_outlook: null,
  research_context: '',
  research_sources: [],
  analysis_timestamp: '2025-01-01T00:00:00Z',
  model_used: 'kimi-k2.5',
  disclaimer: 'Not financial advice. For informational purposes only.',
};

// ===========================================================================
// SignalBanner
// ===========================================================================

describe('SignalBanner', () => {
  // -------------------------------------------------------------------------
  // Recommendation label mapping — all five variants
  // -------------------------------------------------------------------------

  describe('recommendation label rendering', () => {
    it('renders "Buy" badge for buy recommendation', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(screen.getByText('Buy')).toBeInTheDocument();
    });

    it('renders "Strong Buy" badge for strong_buy recommendation', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        recommendation: 'strong_buy' as Recommendation,
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Strong Buy')).toBeInTheDocument();
    });

    it('renders "Hold" badge for hold recommendation', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        recommendation: 'hold' as Recommendation,
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Hold')).toBeInTheDocument();
    });

    it('renders "Sell" badge for sell recommendation', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        recommendation: 'sell' as Recommendation,
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Sell')).toBeInTheDocument();
    });

    it('renders "Strong Sell" badge for strong_sell recommendation', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        recommendation: 'strong_sell' as Recommendation,
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Strong Sell')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Confidence score display
  // -------------------------------------------------------------------------

  describe('confidence score', () => {
    it('renders confidence as an integer percentage (0.78 → "78%")', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('renders "0%" for confidence_score of 0', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, confidence_score: 0 };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders "100%" for confidence_score of 1', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, confidence_score: 1 };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders "50%" for confidence_score of 0.5', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, confidence_score: 0.5 };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Risk level label mapping — all four variants
  // -------------------------------------------------------------------------

  describe('risk level rendering', () => {
    it('renders "Low" for low overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: { ...baseAnalysis.risk_assessment, overall_risk: 'low' as RiskLevel },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('renders "Medium" for medium overall_risk', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('renders "High" for high overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: { ...baseAnalysis.risk_assessment, overall_risk: 'high' as RiskLevel },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders "Very High" for very_high overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: {
          ...baseAnalysis.risk_assessment,
          overall_risk: 'very_high' as RiskLevel,
        },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Very High')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Summary and disclaimer
  // -------------------------------------------------------------------------

  describe('summary and disclaimer', () => {
    it('renders the analysis summary text', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(
        screen.getByText('Apple shows strong momentum across all segments.'),
      ).toBeInTheDocument();
    });

    it('renders the disclaimer text', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(
        screen.getByText('Not financial advice. For informational purposes only.'),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Technical signal section — present when technical is non-null
  // -------------------------------------------------------------------------

  describe('technical signal section', () => {
    it('renders the "Tech:" label when technical data is present', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      expect(screen.getByText('Tech:')).toBeInTheDocument();
    });

    it('renders the RSI value when rsi_14 is present (62.3 → "62")', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      // The component renders RSI as: RSI: <span>62</span>
      expect(screen.getByText('62')).toBeInTheDocument();
    });

    it('renders the RSI label alongside the value', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      // Component renders the static "RSI:" text node
      expect(screen.getByText(/RSI:/)).toBeInTheDocument();
    });

    it('renders the technical signal badge text', () => {
      render(<SignalBanner analysis={baseAnalysis} />);
      // signal = 'buy'; replace('_', ' ') → 'buy'
      const badges = screen.getAllByText('buy');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "strong buy" badge text for strong_buy technical signal', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        technical: { ...baseAnalysis.technical!, signal: 'strong_buy' },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('strong buy')).toBeInTheDocument();
    });

    it('renders "strong sell" badge text for strong_sell technical signal', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        technical: { ...baseAnalysis.technical!, signal: 'strong_sell' },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('strong sell')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Technical section absent when technical is null
  // -------------------------------------------------------------------------

  describe('technical section when technical is null', () => {
    it('does not render the "Tech:" label', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.queryByText('Tech:')).not.toBeInTheDocument();
    });

    it('does not render any "RSI:" text', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.queryByText(/RSI:/)).not.toBeInTheDocument();
    });

    it('still renders the recommendation badge', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Buy')).toBeInTheDocument();
    });

    it('still renders the confidence percentage', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('still renders the risk level', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('still renders the summary and disclaimer', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, technical: null };
      render(<SignalBanner analysis={analysis} />);
      expect(
        screen.getByText('Apple shows strong momentum across all segments.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Not financial advice. For informational purposes only.'),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // RSI null inside a non-null technical object
  // -------------------------------------------------------------------------

  describe('RSI null within non-null technical', () => {
    it('does not render "RSI:" when rsi_14 is null', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        technical: { ...baseAnalysis.technical!, rsi_14: null },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.queryByText(/RSI:/)).not.toBeInTheDocument();
    });

    it('still renders the technical signal badge when rsi_14 is null', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        technical: { ...baseAnalysis.technical!, rsi_14: null },
      };
      render(<SignalBanner analysis={analysis} />);
      expect(screen.getByText('Tech:')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// CompanyAbout
// ===========================================================================

describe('CompanyAbout', () => {
  // -------------------------------------------------------------------------
  // Hero header — company name, sector/industry pills, info row
  // -------------------------------------------------------------------------

  describe('hero header', () => {
    it('renders the company name as a heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    it('renders sector as a pill badge', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('renders industry as a pill badge', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Consumer Electronics')).toBeInTheDocument();
    });

    it('renders CEO value in the info row', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Tim Cook')).toBeInTheDocument();
    });

    it('renders headquarters value in the info row', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Cupertino, CA')).toBeInTheDocument();
    });

    it('renders founded year in the info row', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('1976')).toBeInTheDocument();
    });

    it('renders employees in the info row', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('164,000')).toBeInTheDocument();
    });

    it('omits sector pill when sector is empty', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, sector: '' };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    });

    it('omits industry pill when industry is empty', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, industry: '' };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.queryByText('Consumer Electronics')).not.toBeInTheDocument();
    });

    it('omits a specific info item when its field is empty', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, ceo: '' };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.queryByText('Tim Cook')).not.toBeInTheDocument();
    });

    it('does not render info row when all non-pill info fields are empty', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        headquarters: '',
        ceo: '',
        founded: '',
        employees: '',
      };
      render(<CompanyAbout analysis={analysis} />);
      // Sector/Industry pills still appear, but no info row values
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.queryByText('Tim Cook')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Company description — collapsible
  // -------------------------------------------------------------------------

  describe('company description', () => {
    it('renders the "About" section heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('renders the company_description text (short desc shown fully)', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(
        screen.getByText(
          'Apple designs and sells consumer electronics, software, and services.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render the description card when company_description is empty string', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, company_description: '' };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.queryByText('About')).not.toBeInTheDocument();
    });

    it('does not show "Read more" button for short descriptions', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.queryByText('Read more')).not.toBeInTheDocument();
    });

    it('shows "Read more" button for long descriptions (>300 chars)', () => {
      const longDesc = 'A'.repeat(350);
      const analysis: StockAnalysisResponse = { ...baseAnalysis, company_description: longDesc };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('Read more')).toBeInTheDocument();
    });

    it('truncates long descriptions to 300 chars by default', () => {
      const longDesc = 'A'.repeat(350);
      const analysis: StockAnalysisResponse = { ...baseAnalysis, company_description: longDesc };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText(`${'A'.repeat(300)}...`)).toBeInTheDocument();
    });

    it('expands to full text when "Read more" is clicked', () => {
      const longDesc = 'B'.repeat(350);
      const analysis: StockAnalysisResponse = { ...baseAnalysis, company_description: longDesc };
      render(<CompanyAbout analysis={analysis} />);
      fireEvent.click(screen.getByText('Read more'));
      expect(screen.getByText(longDesc)).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    it('collapses back when "Show less" is clicked', () => {
      const longDesc = 'C'.repeat(350);
      const analysis: StockAnalysisResponse = { ...baseAnalysis, company_description: longDesc };
      render(<CompanyAbout analysis={analysis} />);
      fireEvent.click(screen.getByText('Read more'));
      fireEvent.click(screen.getByText('Show less'));
      expect(screen.getByText(`${'C'.repeat(300)}...`)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Key Statistics card
  // -------------------------------------------------------------------------

  describe('Key Statistics card', () => {
    it('renders the "Key Statistics" heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Key Statistics')).toBeInTheDocument();
    });

    it('renders Market Cap value from the API string', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      // market_cap is a pre-formatted string from the API
      expect(screen.getAllByText('2.8T').length).toBeGreaterThanOrEqual(1);
    });

    it('renders P/E Ratio formatted to two decimal places', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getAllByText('28.50').length).toBeGreaterThanOrEqual(1);
    });

    it('renders EPS prefixed with "$"', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getAllByText('$6.51').length).toBeGreaterThanOrEqual(1);
    });

    it('renders 52W High prefixed with "$"', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getAllByText('$199.62').length).toBeGreaterThanOrEqual(1);
    });

    it('renders 52W Low prefixed with "$"', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getAllByText('$164.08').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Div Yield as a percentage (0.0054 → "0.54%")', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getAllByText('0.54%').length).toBeGreaterThanOrEqual(1);
    });

    it('renders Volume as a locale-formatted number', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      // 45_000_000 → "45,000,000"
      expect(screen.getByText('45,000,000')).toBeInTheDocument();
    });

    it('renders "N/A" when market_cap is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, market_cap: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when pe_ratio is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, pe_ratio: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when eps is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, eps: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when week_52_high is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, week_52_high: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when week_52_low is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, week_52_low: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when dividend_yield is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, dividend_yield: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "N/A" when volume is null', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, volume: null };
      render(<CompanyAbout analysis={analysis} />);
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // AI Analysis Summary card
  // -------------------------------------------------------------------------

  describe('AI Analysis Summary card', () => {
    it('renders the "AI Analysis Summary" heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('AI Analysis Summary')).toBeInTheDocument();
    });

    it('renders the summary text', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(
        screen.getByText('Apple shows strong momentum across all segments.'),
      ).toBeInTheDocument();
    });

    it('renders the "Confidence" label', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    it('renders the confidence percentage (0.78 → "78%")', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('renders "0%" for confidence_score of 0', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, confidence_score: 0 };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders "100%" for confidence_score of 1', () => {
      const analysis: StockAnalysisResponse = { ...baseAnalysis, confidence_score: 1 };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Bull Case / Bear Case cards
  // -------------------------------------------------------------------------

  describe('Bull Case and Bear Case cards', () => {
    it('renders "Bull Case" heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Bull Case')).toBeInTheDocument();
    });

    it('renders the bull_case text', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(
        screen.getByText('Strong ecosystem lock-in and growing services revenue.'),
      ).toBeInTheDocument();
    });

    it('renders "Bear Case" heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Bear Case')).toBeInTheDocument();
    });

    it('renders the bear_case text', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(
        screen.getByText('Regulatory pressure and China market uncertainty.'),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Risk Assessment card
  // -------------------------------------------------------------------------

  describe('Risk Assessment card', () => {
    it('renders the "Risk Assessment" heading', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('renders "Medium Risk" label for medium overall_risk', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('renders "Low Risk" label for low overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: { ...baseAnalysis.risk_assessment, overall_risk: 'low' as RiskLevel },
      };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
    });

    it('renders "High Risk" label for high overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: { ...baseAnalysis.risk_assessment, overall_risk: 'high' as RiskLevel },
      };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });

    it('renders "Very High Risk" label for very_high overall_risk', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: {
          ...baseAnalysis.risk_assessment,
          overall_risk: 'very_high' as RiskLevel,
        },
      };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('Very High Risk')).toBeInTheDocument();
    });

    it('falls back to the raw value when overall_risk is not in the label map', () => {
      const analysis = {
        ...baseAnalysis,
        risk_assessment: {
          ...baseAnalysis.risk_assessment,
          overall_risk: 'unknown_level' as RiskLevel,
        },
      };
      render(<CompanyAbout analysis={analysis} />);
      expect(screen.getByText('unknown_level')).toBeInTheDocument();
    });

    it('renders each risk_factor as a list item', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(screen.getByText('Regulatory pressure')).toBeInTheDocument();
      expect(screen.getByText('Supply chain constraints')).toBeInTheDocument();
    });

    it('renders no list items when risk_factors is empty', () => {
      const analysis: StockAnalysisResponse = {
        ...baseAnalysis,
        risk_assessment: { ...baseAnalysis.risk_assessment, risk_factors: [] },
      };
      render(<CompanyAbout analysis={analysis} />);
      // Heading still present, but no bullet items
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Regulatory pressure')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Disclaimer
  // -------------------------------------------------------------------------

  describe('disclaimer', () => {
    it('renders the disclaimer text at the bottom', () => {
      render(<CompanyAbout analysis={baseAnalysis} />);
      expect(
        screen.getByText('Not financial advice. For informational purposes only.'),
      ).toBeInTheDocument();
    });
  });
});
