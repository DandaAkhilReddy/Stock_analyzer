/**
 * Tests for analysis components:
 *   AIRecommendation, BullBearCase, PricePrediction, RiskAssessment
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via src/test/setup.ts.
 *
 * framer-motion is stubbed out so motion.div renders as a plain <div>, keeping
 * tests fast and deterministic.
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module stubs
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// ---------------------------------------------------------------------------
// Components under test
// ---------------------------------------------------------------------------

import { AIRecommendation } from '../../components/analysis/AIRecommendation';
import { BullBearCase } from '../../components/analysis/BullBearCase';
import { PricePrediction } from '../../components/analysis/PricePrediction';
import { RiskAssessment } from '../../components/analysis/RiskAssessment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type {
  StockAnalysisResponse,
  PricePredictions,
  RiskAssessment as RiskAssessmentType,
} from '../../types/analysis';

// ---------------------------------------------------------------------------
// Shared fixture — matches every field of StockAnalysisResponse exactly
// ---------------------------------------------------------------------------

const basePricePredictions: PricePredictions = {
  one_week: { low: 183.0, mid: 186.0, high: 189.0, confidence: 0.75 },
  one_month: { low: 180.0, mid: 190.0, high: 200.0, confidence: 0.65 },
  three_months: { low: 175.0, mid: 195.0, high: 215.0, confidence: 0.55 },
};

const baseRiskAssessment: RiskAssessmentType = {
  overall_risk: 'medium',
  risk_factors: ['Regulatory pressure', 'Supply chain constraints'],
  risk_score: 0.45,
};

const mockAnalysis: StockAnalysisResponse = {
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
  recommendation: 'buy',
  confidence_score: 0.78,
  summary: 'Apple shows strong momentum across all segments.',
  bull_case: 'Strong ecosystem lock-in and services revenue growth.',
  bear_case: 'Regulatory pressure and China market uncertainty.',
  risk_assessment: baseRiskAssessment,
  price_predictions: basePricePredictions,
  analysis_timestamp: '2025-01-01T00:00:00Z',
  model_used: 'kimi-k2.5',
  disclaimer: 'Not financial advice. For informational purposes only.',
};

// ===========================================================================
// AIRecommendation
// ===========================================================================

describe('AIRecommendation', () => {
  // -------------------------------------------------------------------------
  // Badge label per recommendation type
  // -------------------------------------------------------------------------

  describe('recommendation badge label', () => {
    it('renders "Strong Buy" badge for strong_buy', () => {
      render(
        <AIRecommendation analysis={{ ...mockAnalysis, recommendation: 'strong_buy' }} />,
      );
      expect(screen.getByText('Strong Buy')).toBeInTheDocument();
    });

    it('renders "Buy" badge for buy', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, recommendation: 'buy' }} />);
      expect(screen.getByText('Buy')).toBeInTheDocument();
    });

    it('renders "Hold" badge for hold', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, recommendation: 'hold' }} />);
      expect(screen.getByText('Hold')).toBeInTheDocument();
    });

    it('renders "Sell" badge for sell', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, recommendation: 'sell' }} />);
      expect(screen.getByText('Sell')).toBeInTheDocument();
    });

    it('renders "Strong Sell" badge for strong_sell', () => {
      render(
        <AIRecommendation analysis={{ ...mockAnalysis, recommendation: 'strong_sell' }} />,
      );
      expect(screen.getByText('Strong Sell')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Badge variant class — each recommendation drives a distinct colour token
  // -------------------------------------------------------------------------

  describe('badge variant styles', () => {
    const cases: Array<[StockAnalysisResponse['recommendation'], string]> = [
      ['strong_buy', 'text-emerald-700'],
      ['buy', 'text-emerald-600'],
      ['hold', 'text-amber-700'],
      ['sell', 'text-orange-600'],
      ['strong_sell', 'text-red-600'],
    ];

    it.each(cases)(
      'applies correct colour class for %s recommendation',
      (recommendation, expectedClass) => {
        const { container } = render(
          <AIRecommendation analysis={{ ...mockAnalysis, recommendation }} />,
        );
        // Badge renders as a <span>; find the one that carries the variant class.
        const badge = container.querySelector(`span.${expectedClass.replace('-', '\\-')}`);
        expect(badge).toBeInTheDocument();
      },
    );
  });

  // -------------------------------------------------------------------------
  // Confidence bar
  // -------------------------------------------------------------------------

  describe('confidence bar', () => {
    it('renders the "Confidence" label', () => {
      render(<AIRecommendation analysis={mockAnalysis} />);
      expect(screen.getByText('Confidence')).toBeInTheDocument();
    });

    it('renders confidence as an integer percentage string (78%)', () => {
      render(<AIRecommendation analysis={mockAnalysis} />);
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('renders "0%" for a confidence_score of 0', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, confidence_score: 0 }} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders "100%" for a confidence_score of 1', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, confidence_score: 1 }} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('sets the progress bar width style to match confidence_score * 100', () => {
      const { container } = render(
        <AIRecommendation analysis={{ ...mockAnalysis, confidence_score: 0.62 }} />,
      );
      // The inner fill div has an inline style `width: "62%"`
      const fill = container.querySelector<HTMLElement>('[style*="width: 62%"]');
      expect(fill).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Summary text
  // -------------------------------------------------------------------------

  describe('summary', () => {
    it('renders the summary paragraph', () => {
      render(<AIRecommendation analysis={mockAnalysis} />);
      expect(
        screen.getByText('Apple shows strong momentum across all segments.'),
      ).toBeInTheDocument();
    });

    it('renders an empty string summary without crashing', () => {
      render(<AIRecommendation analysis={{ ...mockAnalysis, summary: '' }} />);
      // No error thrown; heading section still present
      expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Disclaimer
  // -------------------------------------------------------------------------

  describe('disclaimer', () => {
    it('renders the disclaimer text', () => {
      render(<AIRecommendation analysis={mockAnalysis} />);
      expect(
        screen.getByText('Not financial advice. For informational purposes only.'),
      ).toBeInTheDocument();
    });

    it('renders a different disclaimer string correctly', () => {
      const disclaimer = 'Consult a licensed financial advisor.';
      render(<AIRecommendation analysis={{ ...mockAnalysis, disclaimer }} />);
      expect(screen.getByText(disclaimer)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Model name
  // -------------------------------------------------------------------------

  describe('model attribution', () => {
    it('renders "Powered by kimi-k2.5" from model_used', () => {
      render(<AIRecommendation analysis={mockAnalysis} />);
      expect(screen.getByText(/Powered by kimi-k2\.5/)).toBeInTheDocument();
    });

    it('updates model name when model_used changes', () => {
      render(
        <AIRecommendation analysis={{ ...mockAnalysis, model_used: 'gpt-4o' }} />,
      );
      expect(screen.getByText(/Powered by gpt-4o/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------

  it('renders the "AI Recommendation" section heading', () => {
    render(<AIRecommendation analysis={mockAnalysis} />);
    expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
  });
});

// ===========================================================================
// BullBearCase
// ===========================================================================

describe('BullBearCase', () => {
  // -------------------------------------------------------------------------
  // Section headers
  // -------------------------------------------------------------------------

  it('renders the "Bull Case" heading', () => {
    render(<BullBearCase analysis={mockAnalysis} />);
    expect(screen.getByText('Bull Case')).toBeInTheDocument();
  });

  it('renders the "Bear Case" heading', () => {
    render(<BullBearCase analysis={mockAnalysis} />);
    expect(screen.getByText('Bear Case')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Content text
  // -------------------------------------------------------------------------

  it('renders bull_case text from the analysis prop', () => {
    render(<BullBearCase analysis={mockAnalysis} />);
    expect(
      screen.getByText('Strong ecosystem lock-in and services revenue growth.'),
    ).toBeInTheDocument();
  });

  it('renders bear_case text from the analysis prop', () => {
    render(<BullBearCase analysis={mockAnalysis} />);
    expect(
      screen.getByText('Regulatory pressure and China market uncertainty.'),
    ).toBeInTheDocument();
  });

  it('renders both cards even when bull_case and bear_case are empty strings', () => {
    render(<BullBearCase analysis={{ ...mockAnalysis, bull_case: '', bear_case: '' }} />);
    // Both section headings must still appear
    expect(screen.getByText('Bull Case')).toBeInTheDocument();
    expect(screen.getByText('Bear Case')).toBeInTheDocument();
  });

  it('renders updated bull and bear case text when props change', () => {
    render(
      <BullBearCase
        analysis={{
          ...mockAnalysis,
          bull_case: 'AI tailwind drives record margins.',
          bear_case: 'Valuation stretched beyond fundamentals.',
        }}
      />,
    );
    expect(screen.getByText('AI tailwind drives record margins.')).toBeInTheDocument();
    expect(
      screen.getByText('Valuation stretched beyond fundamentals.'),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Layout — both cards are siblings in the same container
  // -------------------------------------------------------------------------

  it('renders exactly two card containers (one for bull, one for bear)', () => {
    const { container } = render(<BullBearCase analysis={mockAnalysis} />);
    // The outer wrapper is a grid div; its immediate children are the two Card divs.
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.children).toHaveLength(2);
  });
});

// ===========================================================================
// PricePrediction
// ===========================================================================

describe('PricePrediction', () => {
  const currentPrice = 185.5;

  // -------------------------------------------------------------------------
  // Three forecast cards rendered
  // -------------------------------------------------------------------------

  it('renders the "1 Week" forecast label', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    expect(screen.getByText('1 Week')).toBeInTheDocument();
  });

  it('renders the "1 Month" forecast label', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    expect(screen.getByText('1 Month')).toBeInTheDocument();
  });

  it('renders the "3 Months" forecast label', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    expect(screen.getByText('3 Months')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Mid prices displayed with two decimal places
  // -------------------------------------------------------------------------

  it('renders the 1-week mid price formatted to 2 decimal places', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // one_week.mid = 186.0 → "$186.00"
    expect(screen.getByText('$186.00')).toBeInTheDocument();
  });

  it('renders the 1-month mid price formatted to 2 decimal places', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // one_month.mid = 190.0 → "$190.00"
    expect(screen.getByText('$190.00')).toBeInTheDocument();
  });

  it('renders the 3-month mid price formatted to 2 decimal places', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // three_months.mid = 195.0 → "$195.00"
    expect(screen.getByText('$195.00')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Low / High labels
  // -------------------------------------------------------------------------

  it('renders low and high labels for the 1-week forecast', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    expect(screen.getByText('Low: $183.00')).toBeInTheDocument();
    expect(screen.getByText('High: $189.00')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // % change calculation
  // -------------------------------------------------------------------------

  it('shows a positive percentage change when mid > currentPrice', () => {
    // one_week mid=186 vs currentPrice=185.5 → ((186-185.5)/185.5)*100 ≈ +0.3%
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // The sign must be "+" for an upward forecast
    expect(screen.getByText(/\+0\.\d%/)).toBeInTheDocument();
  });

  it('shows a negative percentage change when mid < currentPrice', () => {
    const downPredictions: PricePredictions = {
      ...basePricePredictions,
      one_week: { low: 175.0, mid: 180.0, high: 185.0, confidence: 0.7 },
    };
    render(
      <PricePrediction predictions={downPredictions} currentPrice={currentPrice} />,
    );
    // (180 - 185.5) / 185.5 * 100 ≈ -2.97% — no leading "+"
    const pctTexts = screen.getAllByText(/\(-\d+\.\d%\)/);
    expect(pctTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "(+0.0%)" when mid equals currentPrice exactly', () => {
    const flatPredictions: PricePredictions = {
      ...basePricePredictions,
      one_week: { low: 180.0, mid: 185.5, high: 191.0, confidence: 0.8 },
    };
    render(
      <PricePrediction predictions={flatPredictions} currentPrice={currentPrice} />,
    );
    // midChange = 0 → isUp=true → "(+0.0%)"
    expect(screen.getByText('(+0.0%)')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Confidence labels
  // -------------------------------------------------------------------------

  it('renders confidence percentage for the 1-week forecast', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // confidence: 0.75 → "75%"
    expect(screen.getByText('Confidence: 75%')).toBeInTheDocument();
  });

  it('renders confidence percentage for the 1-month forecast', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // confidence: 0.65 → "65%"
    expect(screen.getByText('Confidence: 65%')).toBeInTheDocument();
  });

  it('renders confidence percentage for the 3-month forecast', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    // confidence: 0.55 → "55%"
    expect(screen.getByText('Confidence: 55%')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Edge case: high === low (degenerate range)
  // -------------------------------------------------------------------------

  it('renders without crashing when high equals low (degenerate range)', () => {
    const degeneratePredictions: PricePredictions = {
      ...basePricePredictions,
      one_week: { low: 186.0, mid: 186.0, high: 186.0, confidence: 0.9 },
    };
    render(
      <PricePrediction
        predictions={degeneratePredictions}
        currentPrice={currentPrice}
      />,
    );
    // Should render without NaN or crash; mid marker falls back to 50%
    expect(screen.getByText('$186.00')).toBeInTheDocument();
  });

  it('positions the mid marker at 50% when high equals low', () => {
    const degeneratePredictions: PricePredictions = {
      ...basePricePredictions,
      one_week: { low: 186.0, mid: 186.0, high: 186.0, confidence: 0.9 },
    };
    const { container } = render(
      <PricePrediction
        predictions={degeneratePredictions}
        currentPrice={currentPrice}
      />,
    );
    // The mid marker div has style `left: "50%"` in the degenerate case
    const marker = container.querySelector<HTMLElement>('[style*="left: 50%"]');
    expect(marker).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Section heading
  // -------------------------------------------------------------------------

  it('renders the "Price Predictions" section heading', () => {
    render(
      <PricePrediction predictions={basePricePredictions} currentPrice={currentPrice} />,
    );
    expect(screen.getByText('Price Predictions')).toBeInTheDocument();
  });
});

// ===========================================================================
// RiskAssessment
// ===========================================================================

describe('RiskAssessment', () => {
  // -------------------------------------------------------------------------
  // Section heading
  // -------------------------------------------------------------------------

  it('renders the "Risk Assessment" section heading', () => {
    render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Risk level label per overall_risk value
  // -------------------------------------------------------------------------

  describe('risk level label', () => {
    it('renders "Low Risk" for overall_risk "low"', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'low' }}
        />,
      );
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
    });

    it('renders "Medium Risk" for overall_risk "medium"', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });

    it('renders "High Risk" for overall_risk "high"', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'high' }}
        />,
      );
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });

    it('renders "Very High Risk" for overall_risk "very_high"', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'very_high' }}
        />,
      );
      expect(screen.getByText('Very High Risk')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Risk score display
  // -------------------------------------------------------------------------

  describe('risk score', () => {
    it('renders risk_score as an integer percentage inside the SVG gauge (45)', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      // risk_score: 0.45 → toFixed(0) → "45"
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders "0" when risk_score is 0', () => {
      render(
        <RiskAssessment riskAssessment={{ ...baseRiskAssessment, risk_score: 0 }} />,
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders "100" when risk_score is 1', () => {
      render(
        <RiskAssessment riskAssessment={{ ...baseRiskAssessment, risk_score: 1 }} />,
      );
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('sets strokeDasharray to match risk_score * 100', () => {
      const { container } = render(
        <RiskAssessment riskAssessment={{ ...baseRiskAssessment, risk_score: 0.72 }} />,
      );
      // The coloured circle has strokeDasharray="72, 100"
      const circles = container.querySelectorAll('circle');
      const filled = Array.from(circles).find(
        (c) => c.getAttribute('stroke-dasharray') !== null,
      );
      expect(filled).toBeInTheDocument();
      expect(filled!.getAttribute('stroke-dasharray')).toBe('72, 100');
    });
  });

  // -------------------------------------------------------------------------
  // Risk factors list
  // -------------------------------------------------------------------------

  describe('risk factors list', () => {
    it('renders the "Risk Factors" header when factors are present', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      expect(screen.getByText('Risk Factors')).toBeInTheDocument();
    });

    it('renders each risk factor as a list item', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      expect(screen.getByText('Regulatory pressure')).toBeInTheDocument();
      expect(screen.getByText('Supply chain constraints')).toBeInTheDocument();
    });

    it('renders all three factors when three are provided', () => {
      const threeFactors: RiskAssessmentType = {
        ...baseRiskAssessment,
        risk_factors: ['Factor A', 'Factor B', 'Factor C'],
      };
      render(<RiskAssessment riskAssessment={threeFactors} />);
      expect(screen.getByText('Factor A')).toBeInTheDocument();
      expect(screen.getByText('Factor B')).toBeInTheDocument();
      expect(screen.getByText('Factor C')).toBeInTheDocument();
    });

    it('renders the correct number of list items', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('does not render the "Risk Factors" section when the list is empty', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, risk_factors: [] }}
        />,
      );
      expect(screen.queryByText('Risk Factors')).not.toBeInTheDocument();
    });

    it('does not render any list items when risk_factors is empty', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, risk_factors: [] }}
        />,
      );
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('renders a single factor correctly', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, risk_factors: ['Only factor'] }}
        />,
      );
      expect(screen.getByText('Only factor')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Colour driven by risk level (inline style on text)
  // -------------------------------------------------------------------------

  describe('risk colour applied via inline style', () => {
    it('applies emerald colour (#059669) for "low" risk label', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'low' }}
        />,
      );
      const label = screen.getByText('Low Risk');
      expect(label).toHaveStyle({ color: '#059669' });
    });

    it('applies amber colour (#d97706) for "medium" risk label', () => {
      render(<RiskAssessment riskAssessment={baseRiskAssessment} />);
      const label = screen.getByText('Medium Risk');
      expect(label).toHaveStyle({ color: '#d97706' });
    });

    it('applies orange colour (#ea580c) for "high" risk label', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'high' }}
        />,
      );
      const label = screen.getByText('High Risk');
      expect(label).toHaveStyle({ color: '#ea580c' });
    });

    it('applies red colour (#dc2626) for "very_high" risk label', () => {
      render(
        <RiskAssessment
          riskAssessment={{ ...baseRiskAssessment, overall_risk: 'very_high' }}
        />,
      );
      const label = screen.getByText('Very High Risk');
      expect(label).toHaveStyle({ color: '#dc2626' });
    });
  });
});
