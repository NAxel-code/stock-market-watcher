export interface StockQuote {
  ticker: string
  company_name: string
  current_price: number
  previous_close: number
  change: number
  change_percent: number
  market_cap?: number
  volume?: number
  day_high?: number
  day_low?: number
  fifty_two_week_high?: number
  fifty_two_week_low?: number
  currency: string
  is_stale: boolean
  // IDX & Bloomberg domain enhancements
  is_idx?: boolean
  ara_price?: number
  arb_price?: number
  tick_size?: number
  lot_size?: number
  fifty_two_week_position?: number
  // CoinGecko domain enhancements
  sector?: string
  industry?: string
  distance_from_52w_high?: number
  distance_from_52w_low?: number
  sparkline_7d?: number[]
}

export interface HistoryPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockHistory {
  ticker: string
  period: string
  data: HistoryPoint[]
}

export interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
  type: string
}

export interface MarketIndex {
  name: string
  ticker: string
  current_price: number
  change: number
  change_percent: number
  is_stale: boolean
}

export interface TopMover {
  ticker: string
  company_name: string
  current_price: number
  change_percent: number
  currency?: string
}

export interface MarketSummary {
  indices: MarketIndex[]
  top_gainers: TopMover[]
  top_losers: TopMover[]
}

export interface MarketSessionInfo {
  market: string
  is_open: boolean
  session_name: string
  current_time_local: string
  timezone: string
}

export interface MarketStatusResponse {
  idx: MarketSessionInfo
  us: MarketSessionInfo
}

export interface PriceAlert {
  id: string
  ticker: string
  target_price: number
  condition: 'ABOVE' | 'BELOW'
  is_active: boolean
  created_at: string
}

export type Period = '1d' | '1w' | '1m' | '3m' | '1y'
export type ChartType = 'area' | 'candle'

// --- Stock Desk Institutional Technical Analysis Types ---

export interface StageInfo {
  stage_number: 1 | 2 | 3 | 4
  stage_name: string
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  confidence_pct: number
  description: string
}

export interface TradePlan {
  verdict: 'AVOID' | 'BUY ON BREAKOUT' | 'BUY ON WEAKNESS' | 'TAKE PROFIT' | 'HOLD'
  current_price: number
  buy_area_min?: number | null
  buy_area_max?: number | null
  stop_loss?: number | null
  target_1?: number | null
  target_2?: number | null
  risk_reward_ratio: string
  rationale: string
}

export interface ScenarioProjection {
  name: string
  direction: 'UP' | 'DOWN' | 'SIDEWAYS'
  probability_pct: number
  trigger_condition: string
  price_target?: number | null
  price_target_pct?: number | null
  supporting_factors: string[]
  opposing_factors: string[]
}

export interface MarketStructure {
  trend_structure: 'LH-LL' | 'HH-HL' | 'NEUTRAL'
  trend_description: string
  nearest_support: number
  nearest_resistance: number
  drawdown_300d_pct: number
  peak_300d_price: number
  ma20: number
  ma50: number
  ma200?: number | null
  ma200_slope_pct?: number | null
  ma_stack_status: 'BEARISH_ALIGNMENT' | 'BULLISH_ALIGNMENT' | 'MIXED'
}

export interface VsaMetrics {
  up_down_volume_ratio_20d: number
  participation_status: string
  is_selling_climax: boolean
  is_stopping_volume: boolean
  is_absorption: boolean
  volume_surge_ratio: number
}

export interface MomentumMetrics {
  rsi_14: number
  rsi_status: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'
  macd_line: number
  macd_signal: number
  macd_histogram: number
  macd_bias: 'BULLISH' | 'BEARISH'
  adx_14: number
  trend_strength: 'STRONG_TREND' | 'MODERATE_TREND' | 'WEAK_RANGE'
  stoch_k: number
  stoch_d: number
  cmf_20: number
  cmf_status: 'NET_INFLOW' | 'NET_OUTFLOW' | 'NEUTRAL'
}

export interface RelativeStrengthMetrics {
  benchmark_ticker: string
  benchmark_name: string
  stock_1m_return_pct: number
  benchmark_1m_return_pct: number
  alpha_pct: number
  rating: 'OUTPERFORMING' | 'IN_LINE' | 'UNDERPERFORMING'
}

export interface StockDeskResponse {
  ticker: string
  company_name: string
  current_price: number
  currency: string
  as_of_date: string
  stage: StageInfo
  trade_plan: TradePlan
  scenarios: ScenarioProjection[]
  market_structure: MarketStructure
  vsa: VsaMetrics
  momentum: MomentumMetrics
  relative_strength: RelativeStrengthMetrics
  mindset_guardrail: string
}

