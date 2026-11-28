'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Cloud, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { createAlert, deleteAlert, evaluateAlerts, fetchBatchQuotes } from '@/lib/api'
import { formatCurrency, formatPercent, getStockCurrency } from '@/lib/formatters'
import { convertCurrency } from '@/lib/currency'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

interface WatchlistStock {
  ticker: string
  name: string
  nativeLast?: number
  nativeCurrency?: string
  last: string
  change1D: string
  isPositive: boolean
  from52WHigh: string
  nextEvent: string
  alerts: string
}

const LISTS_DATA: Record<string, WatchlistStock[]> = {
  'Core (8)': [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      last: '$166.66',
      change1D: '+32.77%',
      isPositive: true,
      from52WHigh: '−31.52%',
      nextEvent: 'Dividend record · 2 Dec',
      alerts: '2 RULES',
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      last: '$499.59',
      change1D: '+3.11%',
      isPositive: true,
      from52WHigh: '−10.65%',
      nextEvent: 'Earnings · late Jan (est.)',
      alerts: '—',
    },
    {
      ticker: 'AMZN',
      name: 'Amazon.com Inc',
      last: '$257.45',
      change1D: '+4.30%',
      isPositive: true,
      from52WHigh: '−10.36%',
      nextEvent: 'Earnings · late Jan (est.)',
      alerts: '—',
    },
    {
      ticker: 'GOOGL',
      name: 'Alphabet Inc',
      last: '$282.46',
      change1D: '+6.47%',
      isPositive: true,
      from52WHigh: '−30.87%',
      nextEvent: 'Earnings · late Jan (est.)',
      alerts: '—',
    },
    {
      ticker: 'META',
      name: 'Meta Platforms Inc',
      last: '$593.61',
      change1D: '+5.84%',
      isPositive: true,
      from52WHigh: '−23.88%',
      nextEvent: 'Earnings · late Jan (est.)',
      alerts: '—',
    },
    {
      ticker: 'AAPL',
      name: 'Apple Inc',
      last: '$348.87',
      change1D: '+1.84%',
      isPositive: true,
      from52WHigh: '−3.32%',
      nextEvent: 'Earnings · late Jan (est.)',
      alerts: '—',
    },
    {
      ticker: 'D05.SI',
      name: 'DBS Group Holdings',
      last: 'S$65.76',
      change1D: '−0.53%',
      isPositive: false,
      from52WHigh: '−16.81%',
      nextEvent: 'Results · Feb (est.)',
      alerts: '1 RULE',
    },
    {
      ticker: 'BBCA.JK',
      name: 'Bank Central Asia',
      last: 'Rp 5,675',
      change1D: '+2.25%',
      isPositive: true,
      from52WHigh: '−33.24%',
      nextEvent: 'BI meeting · Dec (TBC)',
      alerts: '—',
    },
  ],
  'Asia (5)': [
    {
      ticker: 'D05.SI',
      name: 'DBS Group Holdings',
      last: 'S$65.76',
      change1D: '−0.53%',
      isPositive: false,
      from52WHigh: '−16.81%',
      nextEvent: 'Results · Feb (est.)',
      alerts: '1 RULE',
    },
    {
      ticker: 'BBCA.JK',
      name: 'Bank Central Asia',
      last: 'Rp 5,675',
      change1D: '+2.25%',
      isPositive: true,
      from52WHigh: '−33.24%',
      nextEvent: 'BI meeting · Dec (TBC)',
      alerts: '—',
    },
    {
      ticker: 'BBRI.JK',
      name: 'Bank Rakyat Indonesia',
      last: 'Rp 4,520',
      change1D: '+1.80%',
      isPositive: true,
      from52WHigh: '−28.10%',
      nextEvent: 'Earnings · late Jan',
      alerts: '—',
    },
    {
      ticker: 'TLKM.JK',
      name: 'Telkom Indonesia',
      last: 'Rp 2,890',
      change1D: '+0.70%',
      isPositive: true,
      from52WHigh: '−32.40%',
      nextEvent: 'Results · Feb (est.)',
      alerts: '—',
    },
    {
      ticker: 'U11.SI',
      name: 'United Overseas Bank',
      last: 'S$32.40',
      change1D: '−0.31%',
      isPositive: false,
      from52WHigh: '−12.50%',
      nextEvent: 'Results · Feb (est.)',
      alerts: '—',
    },
  ],
  'Ideas (3)': [
    {
      ticker: 'TSLA',
      name: 'Tesla Inc',
      last: '$392.64',
      change1D: '+13.54%',
      isPositive: true,
      from52WHigh: '−21.29%',
      nextEvent: 'Delivery print · early Jan',
      alerts: '—',
    },
    {
      ticker: 'AMD',
      name: 'Advanced Micro Devices',
      last: '$148.20',
      change1D: '+8.72%',
      isPositive: true,
      from52WHigh: '−29.94%',
      nextEvent: 'CES Keynote · 6 Jan',
      alerts: '—',
    },
    {
      ticker: 'PLTR',
      name: 'Palantir Technologies',
      last: '$68.45',
      change1D: '+5.12%',
      isPositive: true,
      from52WHigh: '−8.40%',
      nextEvent: 'AIP Con · Feb',
      alerts: '—',
    },
  ],
}

export function TerminalWatchlist() {
  const [activeList, setActiveList] = useState<string>('Core (8)')
  const [showNewRule, setShowNewRule] = useState(false)
  const [ruleTicker, setRuleTicker] = useState('NVDA')
  const [ruleCondition, setRuleCondition] = useState<'ABOVE' | 'BELOW'>('BELOW')
  const [ruleTarget, setRuleTarget] = useState('150')
  const [submittingRule, setSubmittingRule] = useState(false)

  const {
    watchlist,
    alerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    syncAlertsWithCloud,
    streamStatus,
    displayCurrency,
    fxRates,
    language,
  } = useUIStore()
  const isId = language === 'id'

  const fallbackStocks = LISTS_DATA[activeList] || LISTS_DATA['Core (8)']
  const activeTickers = useMemo(() => {
    if (activeList === 'Core (8)' && watchlist.length > 0) {
      return watchlist.slice(0, 12)
    }
    return fallbackStocks.map((s) => s.ticker)
  }, [activeList, watchlist, fallbackStocks])

  const { data: liveBatchQuotes } = useQuery({
    queryKey: ['quotes', 'batch', 'watchlist-terminal', activeTickers.join(',')],
    queryFn: () => fetchBatchQuotes(activeTickers),
    staleTime: 30_000,
    refetchInterval: streamStatus === 'live' ? false : 60_000,
  })

  const currentStocks = useMemo<WatchlistStock[]>(() => {
    const parseFallback = (s: WatchlistStock): { amount: number; curr: string } | null => {
      if (s.last.startsWith('Rp')) {
        return { amount: parseFloat(s.last.replace(/[^0-9.]/g, '')), curr: 'IDR' }
      }
      if (s.last.startsWith('S$')) {
        return { amount: parseFloat(s.last.replace(/[^0-9.]/g, '')), curr: 'SGD' }
      }
      const num = parseFloat(s.last.replace(/[^0-9.]/g, ''))
      return isNaN(num) ? null : { amount: num, curr: 'USD' }
    }

    const convertPriceStr = (amount: number, fromCurr: string) => {
      const targetCurr = displayCurrency === 'NATIVE' ? fromCurr : displayCurrency
      const converted =
        targetCurr === fromCurr
          ? amount
          : convertCurrency(amount, fromCurr, targetCurr, fxRates)
      return formatCurrency(converted !== null ? converted : amount, converted !== null ? targetCurr : fromCurr)
    }

    if (!liveBatchQuotes || liveBatchQuotes.length === 0) {
      return fallbackStocks.map((s) => {
        const parsed = parseFallback(s)
        return parsed ? { ...s, last: convertPriceStr(parsed.amount, parsed.curr) } : s
      })
    }
    return liveBatchQuotes.map((q) => {
      const curr = getStockCurrency(q)
      const activeAlertCount = alerts.filter((a) => a.ticker === q.ticker && a.is_active).length
      const dist52w = q.distance_from_52w_high != null ? `${q.distance_from_52w_high.toFixed(2)}%` : '—'
      return {
        ticker: q.ticker,
        name: q.company_name,
        last: convertPriceStr(q.current_price, curr),
        change1D: formatPercent(q.change_percent),
        isPositive: q.change_percent >= 0,
        from52WHigh: dist52w,
        nextEvent: q.sector ? `${q.sector}` : (isId ? 'Telemetri Live' : 'Live Telemetry'),
        alerts: activeAlertCount > 0 ? `${activeAlertCount} ${isId ? 'ATURAN' : `RULE${activeAlertCount > 1 ? 'S' : ''}`}` : '—',
      }
    })
  }, [liveBatchQuotes, fallbackStocks, alerts, displayCurrency, fxRates, isId])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetNum = parseFloat(ruleTarget)
    if (!ruleTicker.trim() || isNaN(targetNum) || targetNum <= 0) return

    setSubmittingRule(true)
    try {
      const created = await createAlert({
        ticker: ruleTicker.trim().toUpperCase(),
        condition: ruleCondition,
        target_price: targetNum,
      })
      addAlert(created)
      toast.success(`24/7 Cloud Alert created: ${created.ticker} ${created.condition} ${created.target_price}`)
      setShowNewRule(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create alert rule')
    } finally {
      setSubmittingRule(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteAlert(id)
      removeAlert(id)
      toast.info('Alert rule deleted')
    } catch {
      removeAlert(id)
    }
  }

  const handleEvaluateNow = async () => {
    try {
      const hits = await evaluateAlerts()
      await syncAlertsWithCloud()
      if (hits.length > 0) {
        toast.warning(`${hits.length} price alert(s) triggered!`)
      } else {
        toast.success('Evaluated active alerts against live quotes — no thresholds crossed yet.')
      }
    } catch {
      toast.error('Failed to evaluate alerts')
    }
  }

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5]">
      {/* Header & List Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222226] pb-3">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a] flex items-center gap-2">
            <span>
              {isId
                ? `DAFTAR PANTAU / ${Object.keys(LISTS_DATA).length} DAFTAR · ${alerts.filter((a) => a.is_active).length} ATURAN AKTIF`
                : `WATCHLISTS / ${Object.keys(LISTS_DATA).length} LISTS · ${alerts.filter((a) => a.is_active).length} ACTIVE RULES`}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Cloud className="h-3 w-3" /> {isId ? 'Tersinkron Cloud' : 'Cloud Synced'}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5]">
            {isId ? 'Daftar Pantau' : 'Watchlists'}
          </h1>
        </div>

        {/* List Tabs + Actions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#71717a] mr-1">{isId ? 'DAFTAR:' : 'LIST:'}</span>
          {Object.keys(LISTS_DATA).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveList(name)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors text-xs font-semibold',
                activeList === name
                  ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                  : 'bg-[#0f0f12] text-[#a1a1aa] border border-[#222226] hover:text-[#f4f4f5]'
              )}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('stockpulse:open-search'))}
            className="px-2.5 py-1 rounded bg-[#f4f4f5] text-[#09090b] hover:bg-white transition-colors flex items-center gap-1 font-bold"
          >
            <Plus className="h-3 w-3" /> {isId ? 'Tambah emiten' : 'Add ticker'}
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#71717a]">
              {activeList.toUpperCase()}
            </div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">{activeList}</h2>
          </div>
          <span className="text-[10px] text-[#71717a]">
            {currentStocks.length} {isId ? 'INSTRUMEN' : 'INSTRUMENTS'} · {streamStatus === 'live' ? (isId ? 'STREAM SSE LIVE' : 'LIVE SSE STREAM') : (isId ? 'TERSINKRON' : 'SYNCED')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">{isId ? 'EMITEN' : 'TICKER'}</th>
                <th className="py-2 text-right font-normal">{isId ? 'HARGA' : 'LAST'}</th>
                <th className="py-2 text-right font-normal">{isId ? '1H' : '1D'}</th>
                <th className="py-2 text-right font-normal">{isId ? 'DARI 52M TERTINGGI' : 'FROM 52W HIGH'}</th>
                <th className="py-2 font-normal pl-4">{isId ? 'SEKTOR / CATATAN' : 'SECTOR / NOTE'}</th>
                <th className="py-2 text-right font-normal">{isId ? 'PERINGATAN' : 'ALERTS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {currentStocks.map((stock) => (
                <tr key={stock.ticker} className="hover:bg-[#141418] transition-colors group">
                  <td className="py-2.5">
                    <Link href={`/stocks/${stock.ticker}`} className="block">
                      <div className="font-bold text-[#f4f4f5] group-hover:text-white transition-colors">
                        {stock.ticker}
                      </div>
                      <div className="text-[10px] text-[#71717a] font-sans truncate max-w-[150px]">
                        {stock.name}
                      </div>
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-medium text-[#f4f4f5]">
                    {stock.last}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn('font-bold', stock.isPositive ? 'text-emerald-400' : 'text-red-400')}>
                      {stock.change1D}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[#a1a1aa]">
                    {stock.from52WHigh}
                  </td>
                  <td className="py-2.5 pl-4 text-[#a1a1aa]">
                    {stock.nextEvent}
                  </td>
                  <td className="py-2.5 text-right">
                    {stock.alerts !== '—' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#18181b] text-[#f4f4f5] border border-[#27272a]">
                        {stock.alerts}
                      </span>
                    ) : (
                      <span className="text-[#71717a]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Bottom: Persistent 24/7 Alert Rules & Triggered Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Alert Rules */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222226]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                  {isId ? 'MONITOR SERVER 24/7 · AKTIF MESKI BROWSER TUTUP' : '24/7 SERVER-SIDE MONITOR · RUNS WITH BROWSER CLOSED'}
                </div>
                <h3 className="text-sm font-bold text-[#f4f4f5]">{isId ? 'Aturan peringatan' : 'Alert rules'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEvaluateNow}
                  className="text-[10px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] flex items-center gap-1 font-bold transition-colors"
                  title="Evaluate all rules immediately against live prices"
                >
                  <Zap className="h-3 w-3" /> {isId ? 'CEK SEKARANG' : 'CHECK NOW'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRule((prev) => !prev)}
                  className="text-[10px] font-mono text-[#f4f4f5] hover:underline flex items-center gap-1 font-bold"
                >
                  {isId ? '+ ATURAN BARU' : '+ NEW RULE'}
                </button>
              </div>
            </div>

            {showNewRule && (
              <form onSubmit={handleCreateRule} className="p-2.5 mb-3 rounded bg-[#09090b] border border-[#27272a] space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    value={ruleTicker}
                    onChange={(e) => setRuleTicker(e.target.value)}
                    placeholder="NVDA"
                    className="bg-[#141418] border border-[#222226] rounded px-2 py-1 text-white uppercase"
                  />
                  <select
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value as 'ABOVE' | 'BELOW')}
                    className="bg-[#141418] border border-[#222226] rounded px-2 py-1 text-white"
                  >
                    <option value="ABOVE">ABOVE</option>
                    <option value="BELOW">BELOW</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    required
                    value={ruleTarget}
                    onChange={(e) => setRuleTarget(e.target.value)}
                    placeholder="150.00"
                    className="bg-[#141418] border border-[#222226] rounded px-2 py-1 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRule(false)}
                    className="px-2 py-1 text-[10px] text-[#71717a] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRule}
                    className="px-3 py-1 rounded bg-[#f4f4f5] text-[#09090b] hover:bg-white font-bold text-[10px]"
                  >
                    {submittingRule ? 'Saving...' : 'Save Cloud Alert'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 mt-2">
              {alerts.length === 0 ? (
                <div className="p-3 rounded bg-[#141418] border border-[#222226] text-xs text-[#71717a]">
                  No cloud price alerts configured yet. Click <strong className="text-[#f4f4f5]">+ NEW RULE</strong> to monitor any ticker 24/7.
                </div>
              ) : (
                alerts.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2 rounded bg-[#141418] border border-[#222226] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#f4f4f5]">
                        {rule.ticker} crosses {rule.condition} {rule.target_price}
                      </div>
                      <div className="text-[10px] text-[#71717a] font-mono">
                        PRICE {rule.condition === 'ABOVE' ? '≥' : '≤'} {rule.target_price}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded font-bold border',
                          !rule.is_active
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        )}
                      >
                        {rule.is_active ? 'ACTIVE' : 'TRIGGERED'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-[#71717a] hover:text-red-400 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Triggered Log */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222226]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                  CLOUD ALERT LOG / LIVE SSE PUSH
                </div>
                <h3 className="text-sm font-bold text-[#f4f4f5]">Triggered</h3>
              </div>
              <span className="text-[10px] text-[#71717a]">
                {triggeredAlerts.length} EVENT{triggeredAlerts.length === 1 ? '' : 'S'}
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {triggeredAlerts.length === 0 ? (
                <div className="p-3 rounded bg-[#141418] border border-[#222226] text-xs text-[#71717a]">
                  No triggered alerts recorded yet. Background worker checks active thresholds every 15s and pushes hits live over SSE.
                </div>
              ) : (
                triggeredAlerts.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-[#141418] border border-[#222226] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-[#71717a] shrink-0">
                        {(log.triggered_at || log.created_at).slice(0, 10)}
                      </span>
                      <span className="text-[#f4f4f5] font-medium truncate">
                        {log.message || `${log.ticker} crossed ${log.condition} ${log.target_price}`}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                      TRIGGERED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#222226] mt-3 text-[10px] text-[#71717a]">
            Watchlist, rules &amp; triggered alerts are persisted server-side and synchronized across devices.
          </div>
        </div>
      </div>
    </div>
  )
}
