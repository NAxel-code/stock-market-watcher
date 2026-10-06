import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchStockQuote,
  fetchStockHistory,
  fetchBatchQuotes,
  searchTickers,
  fetchMarketSummary,
  fetchDefaultWatchlist,
  validateTickerPost,
} from './api'

describe('api client', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('fetchStockQuote returns quote data on success', async () => {
    const mockData = {
      ticker: 'AAPL',
      company_name: 'Apple Inc.',
      current_price: 150.0,
      previous_close: 148.0,
      change: 2.0,
      change_percent: 1.35,
      currency: 'USD',
      is_stale: false,
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    })

    const quote = await fetchStockQuote('AAPL')
    expect(quote).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/stocks/AAPL/quote',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('fetchStockQuote throws error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Stock not found' }),
    })

    await expect(fetchStockQuote('INVALID')).rejects.toThrow('Stock not found')
  })

  it('fetchStockHistory fetches with period query param', async () => {
    const mockHistory = {
      ticker: 'MSFT',
      period: '1m',
      data: [],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHistory,
    })

    const history = await fetchStockHistory('MSFT', '1m')
    expect(history.ticker).toBe('MSFT')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/stocks/MSFT/history?period=1m',
      expect.any(Object)
    )
  })

  it('fetchBatchQuotes encodes comma-separated tickers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    await fetchBatchQuotes(['AAPL', 'MSFT', 'GOOGL'])
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/stocks/batch?tickers=AAPL,MSFT,GOOGL',
      expect.any(Object)
    )
  })

  it('searchTickers calls search endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' }],
    })

    const results = await searchTickers('apple')
    expect(results).toHaveLength(1)
    expect(results[0].ticker).toBe('AAPL')
  })

  it('fetchMarketSummary fetches summary endpoint', async () => {
    const mockSummary = { indices: [], top_gainers: [], top_losers: [] }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSummary,
    })

    const summary = await fetchMarketSummary()
    expect(summary).toEqual(mockSummary)
  })

  it('fetchDefaultWatchlist returns array of tickers', async () => {
    const mockList = ['AAPL', 'MSFT']
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockList,
    })

    const list = await fetchDefaultWatchlist()
    expect(list).toEqual(mockList)
  })

  it('validateTickerPost posts ticker payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, ticker: 'AAPL', name: 'Apple Inc.' }),
    })

    const result = await validateTickerPost('AAPL')
    expect(result.valid).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/watchlist/validate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ticker: 'AAPL' }),
      })
    )
  })
})
