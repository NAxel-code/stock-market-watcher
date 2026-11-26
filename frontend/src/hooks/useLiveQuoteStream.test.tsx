import React from 'react'
import { render, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useLiveQuoteStream } from './useLiveQuoteStream'
import { useUIStore } from '@/stores/useUIStore'
import type { StockQuote } from '@/types/stock'

function StreamHarness({ tickers }: { tickers: string[] }) {
  useLiveQuoteStream(tickers, true)
  return null
}

class MockEventSource {
  static latest: MockEventSource | null = null
  url: string
  listeners: Record<string, Array<(e: MessageEvent) => void>> = {}
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    MockEventSource.latest = this
  }

  addEventListener(event: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(cb)
  }

  emit(event: string, data: unknown) {
    const evt = { data: JSON.stringify(data) } as MessageEvent
    for (const cb of this.listeners[event] ?? []) {
      cb(evt)
    }
  }

  close() {
    this.closed = true
  }
}

describe('useLiveQuoteStream hook', () => {
  const originalEventSource = globalThis.EventSource

  beforeEach(() => {
    MockEventSource.latest = null
    useUIStore.setState({ streamStatus: 'polling', triggeredAlerts: [] })
  })

  afterEach(() => {
    globalThis.EventSource = originalEventSource
  })

  it('hydrates React Query quote cache and triggered alerts from SSE events', () => {
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource
    const qc = new QueryClient()

    render(
      <QueryClientProvider client={qc}>
        <StreamHarness tickers={['AAPL', 'NVDA']} />
      </QueryClientProvider>
    )

    expect(MockEventSource.latest).not.toBeNull()
    expect(MockEventSource.latest?.url).toContain('/api/v1/stream/quotes')

    act(() => {
      MockEventSource.latest?.onopen?.()
      MockEventSource.latest?.emit('snapshot', {
        as_of: '2026-11-26T14:00:00Z',
        quotes: [
          {
            ticker: 'AAPL',
            company_name: 'Apple Inc.',
            current_price: 235.5,
            previous_close: 230.0,
            change: 5.5,
            change_percent: 2.39,
            currency: 'USD',
            is_stale: false,
          },
        ],
        fx_rates: [
          { pair: 'USD/SGD', from_currency: 'USD', to_currency: 'SGD', rate: 1.342, change: 0.001, change_percent: 0.07 },
        ],
      })
      MockEventSource.latest?.emit('alert', {
        alert_id: 'a-1',
        ticker: 'AAPL',
        condition: 'ABOVE',
        target_price: 235.0,
        current_price: 235.5,
        triggered_at: '2026-11-26T14:00:05Z',
        message: 'AAPL crossed ABOVE 235.0',
      })
    })

    const cached = qc.getQueryData<StockQuote>(['stock', 'quote', 'AAPL'])
    expect(cached?.current_price).toBe(235.5)
    expect(useUIStore.getState().streamStatus).toBe('live')
    expect(useUIStore.getState().fxRates['USD/SGD']).toBe(1.342)
    expect(useUIStore.getState().triggeredAlerts).toHaveLength(1)
    expect(useUIStore.getState().triggeredAlerts[0].ticker).toBe('AAPL')
  })
})
