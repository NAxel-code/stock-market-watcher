'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ensureClientWorkspaceId, getStreamQuotesUrl } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import type { FXRateItem, StockQuote, TriggeredAlertEvent } from '@/types/stock'

interface StreamQuotesPayload {
  as_of: string
  quotes: StockQuote[]
  fx_rates?: FXRateItem[]
}

/**
 * Connects to the backend real-time SSE quote hub (`EventSource`) and hydrates
 * React Query caches & UI store state without redundant HTTP polling loops.
 */
export function useLiveQuoteStream(tickers: string[], enabled: boolean = true): void {
  const queryClient = useQueryClient()
  const setStreamStatus = useUIStore((s) => s.setStreamStatus)
  const setLastStreamTickAt = useUIStore((s) => s.setLastStreamTickAt)
  const setFXRates = useUIStore((s) => s.setFXRates)
  const addTriggeredAlert = useUIStore((s) => s.addTriggeredAlert)

  // Stable key so we only reconnect when the sorted ticker set actually changes
  const tickerKey = Array.from(new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean)))
    .slice(0, 40)
    .sort()
    .join(',')

  useEffect(() => {
    if (!enabled || !tickerKey || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setStreamStatus('polling')
      return
    }

    ensureClientWorkspaceId()
    const tickerList = tickerKey.split(',')
    const streamUrl = getStreamQuotesUrl(tickerList)
    setStreamStatus('connecting')

    let es: EventSource | null = null
    try {
      es = new EventSource(streamUrl)
    } catch {
      setStreamStatus('polling')
      return
    }

    const applyPayload = (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as StreamQuotesPayload
        if (Array.isArray(parsed.quotes)) {
          for (const q of parsed.quotes) {
            queryClient.setQueryData(['stock', 'quote', q.ticker], q)
          }
          // Update any matching batch quote cache entries
          queryClient.setQueriesData<StockQuote[]>(
            { queryKey: ['quotes', 'batch'] },
            (existing) => {
              if (!Array.isArray(existing)) return existing
              const incomingMap = new Map(parsed.quotes.map((q) => [q.ticker, q]))
              return existing.map((item) => incomingMap.get(item.ticker) ?? item)
            }
          )
        }

        if (Array.isArray(parsed.fx_rates) && parsed.fx_rates.length > 0) {
          queryClient.setQueryData(['market', 'fx'], {
            rates: parsed.fx_rates,
            as_of: parsed.as_of,
          })
          const rateMap: Record<string, number> = {}
          for (const r of parsed.fx_rates) {
            rateMap[r.pair] = r.rate
          }
          setFXRates(rateMap)
        }

        setStreamStatus('live')
        setLastStreamTickAt(parsed.as_of || new Date().toISOString())
      } catch {
        // Ignore malformed SSE payload
      }
    }

    es.onopen = () => {
      setStreamStatus('live')
    }

    es.addEventListener('snapshot', (e: MessageEvent) => {
      applyPayload(e.data)
    })

    es.addEventListener('tick', (e: MessageEvent) => {
      applyPayload(e.data)
    })

    es.addEventListener('heartbeat', (e: MessageEvent) => {
      setStreamStatus('live')
      try {
        const hb = JSON.parse(e.data) as { as_of?: string }
        if (hb.as_of) setLastStreamTickAt(hb.as_of)
      } catch {
        // Ignore
      }
    })

    es.addEventListener('alert', (e: MessageEvent) => {
      try {
        const alertEvt = JSON.parse(e.data) as TriggeredAlertEvent
        toast.warning(`Price Alert: ${alertEvt.message}`, {
          duration: 8000,
        })
        addTriggeredAlert({
          id: alertEvt.alert_id,
          ticker: alertEvt.ticker,
          target_price: alertEvt.target_price,
          condition: alertEvt.condition,
          is_active: false,
          created_at: alertEvt.triggered_at,
          triggered_at: alertEvt.triggered_at,
          triggered_price: alertEvt.current_price,
          message: alertEvt.message,
        })
      } catch {
        // Ignore malformed alert payload
      }
    })

    es.onerror = () => {
      // Browser EventSource auto-reconnects; indicate temporary polling fallback
      setStreamStatus('polling')
    }

    return () => {
      es?.close()
    }
  }, [tickerKey, enabled, queryClient, setStreamStatus, setLastStreamTickAt, setFXRates, addTriggeredAlert])
}
