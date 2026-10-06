import type {
  MarketStatusResponse,
  MarketSummary,
  Period,
  PriceAlert,
  StockHistory,
  StockQuote,
  StockSearchResult,
} from '@/types/stock'

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? error.detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const fetchStockQuote = (ticker: string): Promise<StockQuote> =>
  apiFetch<StockQuote>(`/api/v1/stocks/${encodeURIComponent(ticker)}/quote`)

export const fetchStockHistory = (ticker: string, period: Period): Promise<StockHistory> =>
  apiFetch<StockHistory>(`/api/v1/stocks/${encodeURIComponent(ticker)}/history?period=${period}`)

export const fetchBatchQuotes = (tickers: string[]): Promise<StockQuote[]> =>
  apiFetch<StockQuote[]>(`/api/v1/stocks/batch?tickers=${tickers.join(',')}`)

export const searchTickers = (query: string): Promise<StockSearchResult[]> =>
  apiFetch<StockSearchResult[]>(`/api/v1/stocks/search?q=${encodeURIComponent(query)}`)

export const fetchMarketSummary = (): Promise<MarketSummary> =>
  apiFetch<MarketSummary>('/api/v1/market/summary')

export const fetchMarketStatus = (): Promise<MarketStatusResponse> =>
  apiFetch<MarketStatusResponse>('/api/v1/market/status')

export const fetchDefaultWatchlist = (): Promise<string[]> =>
  apiFetch<string[]>('/api/v1/watchlist/default')

export const validateTicker = (ticker: string): Promise<{ valid: boolean; ticker: string; name: string }> =>
  validateTickerPost(ticker)

export async function validateTickerPost(ticker: string): Promise<{ valid: boolean; ticker: string; name: string }> {
  return apiFetch<{ valid: boolean; ticker: string; name: string }>('/api/v1/watchlist/validate', {
    method: 'POST',
    body: JSON.stringify({ ticker }),
  })
}

// Price Alert APIs
export const fetchAlerts = (): Promise<PriceAlert[]> =>
  apiFetch<PriceAlert[]>('/api/v1/alerts')

export const createAlert = (payload: { ticker: string; target_price: number; condition: 'ABOVE' | 'BELOW' }): Promise<PriceAlert> =>
  apiFetch<PriceAlert>('/api/v1/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteAlert = (id: string): Promise<{ status: string }> =>
  apiFetch<{ status: string }>(`/api/v1/alerts/${id}`, {
    method: 'DELETE',
  })

export const evaluateAlerts = (): Promise<Array<{ alert_id: string; ticker: string; message: string }>> =>
  apiFetch<Array<{ alert_id: string; ticker: string; message: string }>>('/api/v1/alerts/evaluate', {
    method: 'POST',
  })
