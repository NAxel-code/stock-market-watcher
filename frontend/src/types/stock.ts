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
