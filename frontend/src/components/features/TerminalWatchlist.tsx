'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Cloud, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { createAlert, deleteAlert, evaluateAlerts, fetchBatchQuotes } from '@/lib/api'
import { formatCurrency, formatPercent, getStockCurrency } from '@/lib/formatters'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

interface WatchlistStock {
  ticker: string
  name: string
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
  } = useUIStore()

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
    if (!liveBatchQuotes || liveBatchQuotes.length === 0) {
      return fallbackStocks
    }
    return liveBatchQuotes.map((q) => {
      const curr = getStockCurrency(q)
      const activeAlertCount = alerts.filter((a) => a.ticker === q.ticker && a.is_active).length
      const dist52w = q.distance_from_52w_high != null ? `${q.distance_from_52w_high.toFixed(2)}%` : '—'
      return {
        ticker: q.ticker,
        name: q.company_name,
        last: formatCurrency(q.current_price, curr),
        change1D: formatPercent(q.change_percent),
        isPositive: q.change_percent >= 0,
        from52WHigh: dist52w,
        nextEvent: q.sector ? `${q.sector}` : 'Live Telemetry',
        alerts: activeAlertCount > 0 ? `${activeAlertCount} RULE${activeAlertCount > 1 ? 'S' : ''}` : '—',
      }
    })
  }, [liveBatchQuotes, fallbackStocks, alerts])

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
    <div className="space-y-4 font-mono text-[#F0F4F8]">
      {/* Header & List Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#161C26] pb-3">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887] flex items-center gap-2">
            <span>WATCHLISTS / {Object.keys(LISTS_DATA).length} LISTS · {alerts.filter((a) => a.is_active).length} ACTIVE RULES</span>
            <span className="inline-flex items-center gap-1 text-[#00E599]">
              <Cloud className="h-3 w-3" /> Cloud Synced
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8]">
            Watchlists
          </h1>
        </div>

        {/* List Tabs + Actions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#6F7887] mr-1">LIST:</span>
          {Object.keys(LISTS_DATA).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveList(name)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors text-xs font-semibold',
                activeList === name
                  ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30 font-bold'
                  : 'bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8]'
              )}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('stockpulse:open-search'))}
            className="px-2 py-1 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 hover:bg-[#00E599]/25 flex items-center gap-1 font-bold"
          >
            <Plus className="h-3 w-3" /> Add ticker
          </button>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161C26]">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#6F7887]">
              {activeList.toUpperCase()}
            </div>
            <h2 className="text-sm font-bold text-[#F0F4F8]">{activeList}</h2>
          </div>
          <span className="text-[10px] text-[#6F7887]">
            {currentStocks.length} INSTRUMENTS · {streamStatus === 'live' ? 'LIVE SSE STREAM' : 'SYNCED'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                <th className="py-2 font-normal">TICKER</th>
                <th className="py-2 text-right font-normal">LAST</th>
                <th className="py-2 text-right font-normal">1D</th>
                <th className="py-2 text-right font-normal">FROM 52W HIGH</th>
                <th className="py-2 font-normal pl-4">SECTOR / NOTE</th>
                <th className="py-2 text-right font-normal">ALERTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161C26]/60">
              {currentStocks.map((stock) => (
                <tr key={stock.ticker} className="hover:bg-[#121620] transition-colors group">
                  <td className="py-2.5">
                    <Link href={`/stocks/${stock.ticker}`} className="block">
                      <div className="font-bold text-[#F0F4F8] group-hover:text-[#00E599] transition-colors">
                        {stock.ticker}
                      </div>
                      <div className="text-[10px] text-[#6F7887] font-sans truncate max-w-[150px]">
                        {stock.name}
                      </div>
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-medium text-[#F0F4F8]">
                    {stock.last}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn('font-bold', stock.isPositive ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
                      {stock.change1D}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[#8C96A5]">
                    {stock.from52WHigh}
                  </td>
                  <td className="py-2.5 pl-4 text-[#8C96A5]">
                    {stock.nextEvent}
                  </td>
                  <td className="py-2.5 text-right">
                    {stock.alerts !== '—' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00B2FF]/15 text-[#00B2FF] border border-[#00B2FF]/30">
                        {stock.alerts}
                      </span>
                    ) : (
                      <span className="text-[#6F7887]">—</span>
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
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161C26]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                  24/7 SERVER-SIDE MONITOR · RUNS WITH BROWSER CLOSED
                </div>
                <h3 className="text-sm font-bold text-[#F0F4F8]">Alert rules</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEvaluateNow}
                  className="text-[10px] font-mono text-[#00B2FF] hover:underline flex items-center gap-1 font-bold"
                  title="Evaluate all rules immediately against live prices"
                >
                  <Zap className="h-3 w-3" /> CHECK NOW
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRule((prev) => !prev)}
                  className="text-[10px] font-mono text-[#00E599] hover:underline flex items-center gap-1 font-bold"
                >
                  + NEW RULE
                </button>
              </div>
            </div>

            {showNewRule && (
              <form onSubmit={handleCreateRule} className="p-2.5 mb-3 rounded bg-[#07080A] border border-[#00E599]/30 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    value={ruleTicker}
                    onChange={(e) => setRuleTicker(e.target.value)}
                    placeholder="NVDA"
                    className="bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-white uppercase"
                  />
                  <select
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value as 'ABOVE' | 'BELOW')}
                    className="bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-white"
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
                    className="bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRule(false)}
                    className="px-2 py-1 text-[10px] text-[#6F7887] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRule}
                    className="px-3 py-1 rounded bg-[#00E599] text-[#07080A] font-bold text-[10px]"
                  >
                    {submittingRule ? 'Saving...' : 'Save Cloud Alert'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 mt-2">
              {alerts.length === 0 ? (
                <div className="p-3 rounded bg-[#121620] border border-[#161C26] text-xs text-[#6F7887]">
                  No cloud price alerts configured yet. Click <strong className="text-[#00E599]">+ NEW RULE</strong> to monitor any ticker 24/7.
                </div>
              ) : (
                alerts.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2 rounded bg-[#121620] border border-[#161C26] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#F0F4F8]">
                        {rule.ticker} crosses {rule.condition} {rule.target_price}
                      </div>
                      <div className="text-[10px] text-[#6F7887] font-mono">
                        PRICE {rule.condition === 'ABOVE' ? '≥' : '≤'} {rule.target_price}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded font-bold border',
                          !rule.is_active
                            ? 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                            : 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30'
                        )}
                      >
                        {rule.is_active ? 'ACTIVE' : 'TRIGGERED'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-[#6F7887] hover:text-[#FF3B56] transition-colors"
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
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161C26]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                  CLOUD ALERT LOG / LIVE SSE PUSH
                </div>
                <h3 className="text-sm font-bold text-[#F0F4F8]">Triggered</h3>
              </div>
              <span className="text-[10px] text-[#6F7887]">
                {triggeredAlerts.length} EVENT{triggeredAlerts.length === 1 ? '' : 'S'}
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {triggeredAlerts.length === 0 ? (
                <div className="p-3 rounded bg-[#121620] border border-[#161C26] text-xs text-[#6F7887]">
                  No triggered alerts recorded yet. Background worker checks active thresholds every 15s and pushes hits live over SSE.
                </div>
              ) : (
                triggeredAlerts.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-[#121620] border border-[#161C26] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-[#6F7887] shrink-0">
                        {(log.triggered_at || log.created_at).slice(0, 10)}
                      </span>
                      <span className="text-[#F0F4F8] font-medium truncate">
                        {log.message || `${log.ticker} crossed ${log.condition} ${log.target_price}`}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-bold shrink-0">
                      TRIGGERED
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#161C26] mt-3 text-[10px] text-[#6F7887]">
            Watchlist, rules &amp; triggered alerts are persisted server-side and synchronized across devices.
          </div>
        </div>
      </div>
    </div>
  )
}
