import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalysisDeskTab } from './AnalysisDeskTab'
import type { StockDeskResponse } from '@/types/stock'

// Mock useStockDesk hook
vi.mock('@/hooks/useStockDesk', () => ({
  useStockDesk: vi.fn(),
}))

import { useStockDesk } from '@/hooks/useStockDesk'

const mockDeskData: StockDeskResponse = {
  ticker: 'BBRI.JK',
  company_name: 'Bank Rakyat Indonesia',
  current_price: 4920,
  currency: 'IDR',
  as_of_date: '2026-10-20',
  stage: {
    stage_number: 4,
    stage_name: 'Stage 4 - Markdown / Downtrend',
    bias: 'BEARISH',
    confidence_pct: 90,
    description: 'Price is trading below key moving averages with negative trend slope.',
  },
  trade_plan: {
    verdict: 'AVOID',
    current_price: 4920,
    buy_area_min: null,
    buy_area_max: null,
    stop_loss: 4680,
    target_1: 5250,
    target_2: 5600,
    risk_reward_ratio: 'N/A',
    rationale: 'Capital preservation priority: Asset is in Stage 4 Markdown with structural LH-LL lower lows.',
  },
  scenarios: [
    {
      name: 'Bullish Rebound',
      direction: 'UP',
      probability_pct: 15,
      trigger_condition: 'Daily close confirmed above resistance pivot 5250',
      price_target: 5500,
      price_target_pct: 11.79,
      supporting_factors: ['Oversold bounce potential'],
      opposing_factors: ['Bearish MA stack'],
    },
    {
      name: 'Bearish Continuation',
      direction: 'DOWN',
      probability_pct: 65,
      trigger_condition: 'Breakdown and close below support pivot 4800',
      price_target: 4400,
      price_target_pct: -10.57,
      supporting_factors: ['Lower Highs & Lower Lows active downtrend', 'Negative CMF'],
      opposing_factors: ['Deep value buyers at support'],
    },
    {
      name: 'Base Consolidation',
      direction: 'SIDEWAYS',
      probability_pct: 20,
      trigger_condition: 'Rangebound oscillation between support 4800 and resistance 5250',
      price_target: 5025,
      price_target_pct: 2.13,
      supporting_factors: ['Equilibrium between buyers and sellers'],
      opposing_factors: [],
    },
  ],
  market_structure: {
    trend_structure: 'LH-LL',
    trend_description: 'Lower Highs & Lower Lows (Active Downtrend)',
    nearest_support: 4800,
    nearest_resistance: 5250,
    drawdown_300d_pct: -23.4,
    peak_300d_price: 6425,
    ma20: 5010,
    ma50: 5200,
    ma200: 5550,
    ma200_slope_pct: -1.8,
    ma_stack_status: 'BEARISH_ALIGNMENT',
  },
  vsa: {
    up_down_volume_ratio_20d: 0.68,
    participation_status: 'Dominant Selling Pressure',
    is_selling_climax: true,
    is_stopping_volume: false,
    is_absorption: false,
    volume_surge_ratio: 2.3,
  },
  momentum: {
    rsi_14: 34.2,
    rsi_status: 'NEUTRAL',
    macd_line: -45.2,
    macd_signal: -32.1,
    macd_histogram: -13.1,
    macd_bias: 'BEARISH',
    adx_14: 28.5,
    trend_strength: 'STRONG_TREND',
    stoch_k: 22.4,
    stoch_d: 28.1,
    cmf_20: -0.14,
    cmf_status: 'NET_OUTFLOW',
  },
  relative_strength: {
    benchmark_ticker: '^JKSE',
    benchmark_name: 'IHSG',
    stock_1m_return_pct: -6.8,
    benchmark_1m_return_pct: 1.2,
    alpha_pct: -8.0,
    rating: 'UNDERPERFORMING',
  },
  mindset_guardrail: 'Mindset Rule #1: Capital preservation takes precedence over bottom fishing.',
}

describe('AnalysisDeskTab component', () => {
  it('renders loading state when query is loading', () => {
    vi.mocked(useStockDesk).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any)

    render(<AnalysisDeskTab ticker="BBRI.JK" />)
    expect(screen.getByText(/Generating Institutional Technical Desk Analysis/i)).toBeInTheDocument()
  })

  it('renders error state when query fails', () => {
    vi.mocked(useStockDesk).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch'),
    } as any)

    render(<AnalysisDeskTab ticker="BBRI.JK" />)
    expect(screen.getByText(/Unable to load technical desk analysis/i)).toBeInTheDocument()
  })

  it('renders complete institutional desk view on success', () => {
    vi.mocked(useStockDesk).mockReturnValue({
      data: mockDeskData,
      isLoading: false,
      isError: false,
      error: null,
    } as any)

    render(<AnalysisDeskTab ticker="BBRI.JK" />)

    // Stage Header
    expect(screen.getByText('Stage 4 - Markdown / Downtrend')).toBeInTheDocument()
    expect(screen.getByText('90% Confidence')).toBeInTheDocument()

    // Trade Plan
    expect(screen.getByText('AVOID')).toBeInTheDocument()
    expect(screen.getByText(/Capital preservation priority/i)).toBeInTheDocument()

    // 3 Scenarios
    expect(screen.getByText('Bearish Continuation')).toBeInTheDocument()
    expect(screen.getByText('65% Prob')).toBeInTheDocument()
    expect(screen.getByText('Bullish Rebound')).toBeInTheDocument()
    expect(screen.getByText('15% Prob')).toBeInTheDocument()

    // Market Structure & Multi-Pillar Grid
    expect(screen.getByText('LH-LL')).toBeInTheDocument()
    expect(screen.getByText('Dominant Selling Pressure')).toBeInTheDocument()
    expect(screen.getByText('UNDERPERFORMING')).toBeInTheDocument()

    // Mindset Guardrail
    expect(screen.getByText(/Mindset Rule #1: Capital preservation takes precedence/i)).toBeInTheDocument()
  })
})
