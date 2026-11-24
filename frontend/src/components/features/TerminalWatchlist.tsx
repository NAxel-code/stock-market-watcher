'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, Bell, CheckCircle2, AlertTriangle, Send, Mail } from 'lucide-react'
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

interface AlertRule {
  title: string
  condition: string
  channel: 'TELEGRAM' | 'EMAIL'
  status: 'ACTIVE' | 'TRIGGERED'
}

const ALERT_RULES: AlertRule[] = [
  {
    title: 'NVDA falls below $150',
    condition: 'PRICE < 150.00',
    channel: 'TELEGRAM',
    status: 'ACTIVE',
  },
  {
    title: 'NVDA moves more than 5% in a day',
    condition: '|1D| > 5%',
    channel: 'TELEGRAM',
    status: 'TRIGGERED',
  },
  {
    title: 'D05.SI moves more than 3% in a day',
    condition: '|1D| > 3%',
    channel: 'TELEGRAM',
    status: 'ACTIVE',
  },
  {
    title: 'Any holding above 12% of portfolio',
    condition: 'WEIGHT > 12%',
    channel: 'EMAIL',
    status: 'TRIGGERED',
  },
  {
    title: 'High-importance news on watchlist',
    condition: 'IMPORTANCE = HIGH',
    channel: 'TELEGRAM',
    status: 'ACTIVE',
  },
  {
    title: 'Day before an FOMC decision',
    condition: 'CALENDAR · FED',
    channel: 'TELEGRAM',
    status: 'ACTIVE',
  },
]

interface TriggeredLog {
  date: string
  event: string
  status: 'SENT'
}

const TRIGGERED_LOG: TriggeredLog[] = [
  {
    date: '23 NOV',
    event: 'NVDA +32.77% (rule: |1D| > 5%)',
    status: 'SENT',
  },
  {
    date: '23 NOV',
    event: 'NVDA weight 12.6% (rule: > 12%)',
    status: 'SENT',
  },
  {
    date: '23 NOV',
    event: 'High importance: Nvidia reinstates Huang',
    status: 'SENT',
  },
  {
    date: '18 NOV',
    event: 'High importance: BI raises rate to 6.00%',
    status: 'SENT',
  },
]

export function TerminalWatchlist() {
  const [activeList, setActiveList] = useState<string>('Core (8)')

  const currentStocks = LISTS_DATA[activeList] || LISTS_DATA['Core (8)']

  return (
    <div className="space-y-4 font-mono text-[#F0F4F8]">
      {/* Header & List Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#161C26] pb-3">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
            WATCHLISTS / 3 LISTS · 6 ALERT RULES
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
            className="px-2 py-1 rounded bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8] flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> New list
          </button>
          <button
            type="button"
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
            {currentStocks.length} INSTRUMENTS
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
                <th className="py-2 font-normal pl-4">NEXT EVENT</th>
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

      {/* 2-Column Bottom: Alert Rules & Triggered Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Alert Rules */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161C26]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                  RULES / DELIVERED BY TELEGRAM AND EMAIL
                </div>
                <h3 className="text-sm font-bold text-[#F0F4F8]">Alert rules</h3>
              </div>
              <button
                type="button"
                className="text-[10px] font-mono text-[#00E599] hover:underline flex items-center gap-1 font-bold"
              >
                + NEW RULE
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {ALERT_RULES.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[#121620] border border-[#161C26] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#F0F4F8]">{rule.title}</div>
                    <div className="text-[10px] text-[#6F7887] font-mono">{rule.condition}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161C26] text-[#8C96A5] font-semibold flex items-center gap-1">
                      {rule.channel === 'TELEGRAM' ? <Send className="h-2.5 w-2.5 text-[#00B2FF]" /> : <Mail className="h-2.5 w-2.5 text-amber-400" />}
                      {rule.channel}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.2 rounded font-bold border',
                        rule.status === 'TRIGGERED'
                          ? 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                          : 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30'
                      )}
                    >
                      {rule.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Triggered Log (last 7 days) */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#161C26]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                  LOG / LAST 7 DAYS
                </div>
                <h3 className="text-sm font-bold text-[#F0F4F8]">Triggered</h3>
              </div>
              <span className="text-[10px] text-[#6F7887]">4 NOTIFICATIONS SENT</span>
            </div>

            <div className="space-y-2 mt-2">
              {TRIGGERED_LOG.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#121620] border border-[#161C26] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#6F7887] shrink-0">{log.date}</span>
                    <span className="text-[#F0F4F8] font-medium">{log.event}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-bold shrink-0">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#161C26] mt-3 text-[10px] text-[#6F7887]">
            Prices: StockPulse API snapshot, 23 Nov 2026. Alert rules and log are examples.
          </div>
        </div>
      </div>
    </div>
  )
}
