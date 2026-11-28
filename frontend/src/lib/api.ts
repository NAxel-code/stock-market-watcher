import type {
  AuthTokenResponse,
  AuthUserProfile,
  CloudPaperState,
  FXRatesResponse,
  MarketStatusResponse,
  MarketSummary,
  MarketsOverviewResponse,
  Period,
  PortfolioAnalysisResponse,
  PortfolioHoldingItem,
  PriceAlert,
  StockDeskResponse,
  StockHistory,
  StockQuote,
  StockSearchResult,
  WatchlistCorrelationResponse,
  WatchlistStateResponse,
} from '@/types/stock'

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:8000'

export const AUTH_TOKEN_KEY = 'stockpulse_auth_token'
export const WORKSPACE_ID_KEY = 'stockpulse_workspace_id'

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window === 'undefined') return headers

  try {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const wsId = window.localStorage.getItem(WORKSPACE_ID_KEY)
    if (wsId) {
      headers['X-Workspace-ID'] = wsId
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
  return headers
}

export function ensureClientWorkspaceId(): string {
  if (typeof window === 'undefined') return 'default'
  try {
    let existing = window.localStorage.getItem(WORKSPACE_ID_KEY)
    if (!existing) {
      existing = `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      window.localStorage.setItem(WORKSPACE_ID_KEY, existing)
    }
    return existing
  } catch {
    return 'default'
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const baseHeaders = getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    headers: options?.headers ? { ...baseHeaders, ...options.headers } : baseHeaders,
    next: { revalidate: 0 },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error ?? error.detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getStreamQuotesUrl(tickers: string[]): string {
  const params = new URLSearchParams()
  if (tickers.length > 0) {
    params.set('tickers', tickers.join(','))
  }
  if (typeof window !== 'undefined') {
    try {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
      const wsId = window.localStorage.getItem(WORKSPACE_ID_KEY)
      if (token) params.set('token', token)
      if (wsId) params.set('workspace_id', wsId)
    } catch {
      // Ignore storage errors
    }
  }
  return `${API_URL}/api/v1/stream/quotes?${params.toString()}`
}

export const fetchStockQuote = (ticker: string): Promise<StockQuote> =>
  apiFetch<StockQuote>(`/api/v1/stocks/${encodeURIComponent(ticker)}/quote`)

export const fetchStockHistory = (ticker: string, period: Period): Promise<StockHistory> =>
  apiFetch<StockHistory>(`/api/v1/stocks/${encodeURIComponent(ticker)}/history?period=${period}`)

export const fetchStockDesk = (ticker: string): Promise<StockDeskResponse> =>
  apiFetch<StockDeskResponse>(`/api/v1/stocks/${encodeURIComponent(ticker)}/desk`)

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

export const fetchCloudWatchlist = (): Promise<WatchlistStateResponse> =>
  apiFetch<WatchlistStateResponse>('/api/v1/watchlist')

export const addCloudWatchlistTicker = (ticker: string): Promise<WatchlistStateResponse> =>
  apiFetch<WatchlistStateResponse>('/api/v1/watchlist/items', {
    method: 'POST',
    body: JSON.stringify({ ticker }),
  })

export const removeCloudWatchlistTicker = (ticker: string): Promise<WatchlistStateResponse> =>
  apiFetch<WatchlistStateResponse>(`/api/v1/watchlist/items/${encodeURIComponent(ticker)}`, {
    method: 'DELETE',
  })

export const syncCloudWatchlist = (tickers: string[]): Promise<WatchlistStateResponse> =>
  apiFetch<WatchlistStateResponse>('/api/v1/watchlist/sync', {
    method: 'POST',
    body: JSON.stringify({ tickers }),
  })

export const validateTicker = (ticker: string): Promise<{ valid: boolean; ticker: string; name: string }> =>
  validateTickerPost(ticker)

export async function validateTickerPost(ticker: string): Promise<{ valid: boolean; ticker: string; name: string }> {
  return apiFetch<{ valid: boolean; ticker: string; name: string }>('/api/v1/watchlist/validate', {
    method: 'POST',
    body: JSON.stringify({ ticker }),
  })
}

// Auth APIs
export const registerAccount = (payload: {
  email: string
  password: string
  display_name?: string
  workspace_id?: string
}): Promise<AuthTokenResponse> =>
  apiFetch<AuthTokenResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const loginAccount = (payload: {
  email: string
  password: string
  workspace_id?: string
}): Promise<AuthTokenResponse> =>
  apiFetch<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchCurrentUser = (): Promise<AuthUserProfile> =>
  apiFetch<AuthUserProfile>('/api/v1/auth/me')

// Price Alert APIs
export const fetchAlerts = (): Promise<PriceAlert[]> =>
  apiFetch<PriceAlert[]>('/api/v1/alerts')

export const fetchTriggeredAlerts = (): Promise<PriceAlert[]> =>
  apiFetch<PriceAlert[]>('/api/v1/alerts/triggered')

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

export const fetchWatchlistCorrelation = (
  tickers: string[] = []
): Promise<WatchlistCorrelationResponse> =>
  apiFetch<WatchlistCorrelationResponse>('/api/v1/watchlist/correlation', {
    method: 'POST',
    body: JSON.stringify({ tickers }),
  })

export const fetchFXRates = (): Promise<FXRatesResponse> =>
  apiFetch<FXRatesResponse>('/api/v1/market/fx')

export const fetchMarketsOverview = (): Promise<MarketsOverviewResponse> =>
  apiFetch<MarketsOverviewResponse>('/api/v1/market/overview')

export const fetchDefaultPortfolio = (): Promise<PortfolioHoldingItem[]> =>
  apiFetch<PortfolioHoldingItem[]>('/api/v1/portfolio/default')

export const fetchPersistedHoldings = (): Promise<PortfolioHoldingItem[]> =>
  apiFetch<PortfolioHoldingItem[]>('/api/v1/portfolio/holdings')

export const upsertPersistedHolding = (holding: PortfolioHoldingItem): Promise<PortfolioHoldingItem> =>
  apiFetch<PortfolioHoldingItem>('/api/v1/portfolio/holdings', {
    method: 'POST',
    body: JSON.stringify(holding),
  })

export const replacePersistedHoldings = (holdings: PortfolioHoldingItem[]): Promise<PortfolioHoldingItem[]> =>
  apiFetch<PortfolioHoldingItem[]>('/api/v1/portfolio/holdings', {
    method: 'PUT',
    body: JSON.stringify({ holdings }),
  })

export const deletePersistedHolding = (holdingId: string): Promise<{ status: string }> =>
  apiFetch<{ status: string }>(`/api/v1/portfolio/holdings/${encodeURIComponent(holdingId)}`, {
    method: 'DELETE',
  })

export const resetPersistedHoldings = (): Promise<PortfolioHoldingItem[]> =>
  apiFetch<PortfolioHoldingItem[]>('/api/v1/portfolio/holdings/reset', {
    method: 'POST',
  })

export const fetchPortfolioAnalysis = (baseCurrency: string = 'SGD'): Promise<PortfolioAnalysisResponse> =>
  apiFetch<PortfolioAnalysisResponse>(`/api/v1/portfolio/analyze?base_currency=${encodeURIComponent(baseCurrency)}`)

export const analyzeCustomPortfolio = (
  holdings: PortfolioHoldingItem[],
  baseCurrency: string = 'SGD'
): Promise<PortfolioAnalysisResponse> =>
  apiFetch<PortfolioAnalysisResponse>('/api/v1/portfolio/analyze', {
    method: 'POST',
    body: JSON.stringify({ holdings, base_currency: baseCurrency }),
  })

// Cloud Paper Trading State APIs
export const fetchPersistedPaperState = (): Promise<CloudPaperState> =>
  apiFetch<CloudPaperState>('/api/v1/paper/state')

export const savePersistedPaperState = (state: CloudPaperState): Promise<CloudPaperState> =>
  apiFetch<CloudPaperState>('/api/v1/paper/state', {
    method: 'PUT',
    body: JSON.stringify(state),
  })

export const resetPersistedPaperState = (): Promise<CloudPaperState> =>
  apiFetch<CloudPaperState>('/api/v1/paper/reset', {
    method: 'POST',
  })
