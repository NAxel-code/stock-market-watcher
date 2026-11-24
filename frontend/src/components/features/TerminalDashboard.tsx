'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Info, Calendar, ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchlistRow {
  ticker: string
  name: string
  price: string
  change: string
  isPositive: boolean
  sparkline: number[]
}

const SAMPLE_WATCHLIST: WatchlistRow[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: '$166.66',
    change: '+32.77%',
    isPositive: true,
    sparkline: [125, 126, 128, 127, 130, 145, 166.66],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: '$499.59',
    change: '+3.11%',
    isPositive: true,
    sparkline: [480, 482, 488, 485, 492, 495, 499.59],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc',
    price: '$257.45',
    change: '+4.30%',
    isPositive: true,
    sparkline: [242, 245, 248, 250, 252, 255, 257.45],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc',
    price: '$282.46',
    change: '+6.47%',
    isPositive: true,
    sparkline: [260, 263, 268, 270, 274, 278, 282.46],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc',
    price: '$593.61',
    change: '+5.84%',
    isPositive: true,
    sparkline: [550, 558, 565, 570, 580, 588, 593.61],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc',
    price: '$348.87',
    change: '+1.84%',
    isPositive: true,
    sparkline: [338, 340, 342, 343, 345, 347, 348.87],
  },
  {
    ticker: 'D05.SI',
    name: 'DBS Group Holdings',
    price: 'S$65.76',
    change: '−0.53%',
    isPositive: false,
    sparkline: [67.0, 66.8, 66.5, 66.2, 66.0, 65.9, 65.76],
  },
  {
    ticker: 'BBCA.JK',
    name: 'Bank Central Asia',
    price: 'Rp 5,675',
    change: '+2.25%',
    isPositive: true,
    sparkline: [5450, 5500, 5525, 5550, 5600, 5650, 5675],
  },
]

interface NewsItem {
  id: string
  date: string
  source: string
  importance: 'HIGH' | 'MED'
  title: string
  whyItMatters?: string
  tags: string
  category: 'ALL' | 'HOLDINGS' | 'FED' | 'SG' | 'ID' | 'TECH'
}

const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    date: '23 NOV',
    source: 'CNBC',
    importance: 'HIGH',
    title: 'Nvidia reinstates Jensen Huang as CEO; S&P 500 rebounds 5%',
    whyItMatters: 'Your largest US holding. It drove most of today’s gain.',
    tags: 'NVDA · US MARKETS',
    category: 'HOLDINGS',
  },
  {
    id: '2',
    date: '18 NOV',
    source: 'BANK INDONESIA',
    importance: 'HIGH',
    title: 'Bank Indonesia raises the BI-Rate 25 bps to 6.00% to steady the rupiah',
    tags: 'ID MACRO · RATES',
    category: 'ID',
  },
  {
    id: '3',
    date: '17 NOV',
    source: 'NVIDIA',
    importance: 'MED',
    title: 'Q3 FY27 revenue $115.8B, up 103% from a year ago; Q4 guide $130B',
    tags: 'NVDA · EARNINGS',
    category: 'TECH',
  },
  {
    id: '4',
    date: '12 NOV',
    source: 'FEDERAL RESERVE',
    importance: 'MED',
    title: 'Fed sets 2027 calendar with seven rate decisions instead of eight',
    tags: 'FED',
    category: 'FED',
  },
  {
    id: '5',
    date: '28 OCT',
    source: 'FEDERAL RESERVE',
    importance: 'MED',
    title: 'Fed holds at 3.75–4.00%; two members wanted a hike',
    tags: 'FED · RATES',
    category: 'FED',
  },
]

interface ScheduleItem {
  date: string
  inDays: string
  type: 'HOLIDAY' | 'DIVIDEND' | 'DATA' | 'FED' | 'EARNINGS' | 'CENTRAL BANK'
  event: string
  detail: string
  status: 'CONFIRMED' | 'EST.' | 'WINDOW'
}

const SAMPLE_SCHEDULE: ScheduleItem[] = [
  {
    date: 'THU 26 NOV',
    inDays: '2D',
    type: 'HOLIDAY',
    event: 'US markets closed',
    detail: 'Thanksgiving',
    status: 'CONFIRMED',
  },
  {
    date: 'FRI 27 NOV',
    inDays: '3D',
    type: 'HOLIDAY',
    event: 'US early close',
    detail: '1pm ET / 2am Sat SGT',
    status: 'CONFIRMED',
  },
  {
    date: 'WED 2 DEC',
    inDays: '8D',
    type: 'DIVIDEND',
    event: 'NVDA record date',
    detail: '$0.25/share, paid 23 Dec',
    status: 'CONFIRMED',
  },
  {
    date: 'FRI 4 DEC',
    inDays: '10D',
    type: 'DATA',
    event: 'US jobs report (Nov)',
    detail: 'BLS · 9:30pm SGT',
    status: 'CONFIRMED',
  },
  {
    date: 'THU 10 DEC',
    inDays: '16D',
    type: 'FED',
    event: 'FOMC decision + projections',
    detail: 'Meeting 8–9 Dec · 3:00am SGT',
    status: 'CONFIRMED',
  },
  {
    date: 'THU 10 DEC',
    inDays: '16D',
    type: 'DATA',
    event: 'US CPI (Nov)',
    detail: 'BLS · 9:30pm SGT',
    status: 'CONFIRMED',
  },
  {
    date: 'LATE JAN',
    inDays: '~60D',
    type: 'EARNINGS',
    event: 'MSFT, AAPL, META, GOOGL, AMZN',
    detail: 'MSFT FQ2 FY27 · AAPL FQ1 FY27 · others Q4',
    status: 'EST.',
  },
  {
    date: 'BY 29 JAN',
    inDays: '≤66D',
    type: 'CENTRAL BANK',
    event: 'MAS monetary policy statement',
    detail: 'Quarterly · S$NEER band',
    status: 'WINDOW',
  },
]

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 56
  const height = 18

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const strokeColor = isPositive ? '#00E599' : '#FF3B56'

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function TerminalDashboard() {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'YTD' | '1Y'>('1D')
  const [newsFilter, setNewsFilter] = useState<string>('ALL')
  const [scheduleFilter, setScheduleFilter] = useState<string>('ALL')

  const filteredNews = SAMPLE_NEWS.filter((item) => {
    if (newsFilter === 'ALL') return true
    if (newsFilter === 'HOLDINGS') return item.category === 'HOLDINGS'
    if (newsFilter === 'FED') return item.category === 'FED' || item.tags.includes('FED')
    if (newsFilter === 'SG') return item.tags.includes('SG')
    if (newsFilter === 'ID') return item.category === 'ID' || item.tags.includes('ID')
    if (newsFilter === 'TECH') return item.category === 'TECH' || item.tags.includes('TECH')
    return true
  })

  const filteredSchedule = SAMPLE_SCHEDULE.filter((item) => {
    if (scheduleFilter === 'ALL') return true
    if (scheduleFilter === 'CENTRAL BANKS') return item.type === 'FED' || item.type === 'CENTRAL BANK'
    if (scheduleFilter === 'DATA') return item.type === 'DATA'
    if (scheduleFilter === 'EARNINGS') return item.type === 'EARNINGS'
    if (scheduleFilter === 'HOLIDAYS') return item.type === 'HOLIDAY'
    return true
  })

  return (
    <div className="space-y-4 pb-12 font-mono text-[#F0F4F8]">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#161C26] pb-3">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
            PORTFOLIO / SGD BASE / SAMPLE HOLDINGS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8]">
            Dashboard
          </h1>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded border border-[#161C26] text-xs">
          {(['1D', '1W', '1M', 'YTD', '1Y'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors text-xs font-semibold',
                timeframe === tf
                  ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30'
                  : 'text-[#6F7887] hover:text-[#F0F4F8]'
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Value */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#8C96A5] font-semibold tracking-wider">VALUE</span>
            <span className="text-[#00E599] text-[11px] font-bold bg-[#00E599]/10 px-1.5 py-0.5 rounded border border-[#00E599]/20 flex items-center gap-0.5">
              ↗ +2.6%
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#F0F4F8]">
            S$124,800
          </div>
          <div className="text-[11px] text-[#6F7887] mt-1 font-sans">
            Total portfolio value
          </div>
          <div className="text-[10px] text-[#8C96A5] mt-2 pt-2 border-t border-[#161C26]">
            9 holdings · 3 currencies
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#8C96A5] font-semibold tracking-wider">TODAY</span>
            <span className="text-[#00E599] text-[11px] font-bold bg-[#00E599]/10 px-1.5 py-0.5 rounded border border-[#00E599]/20 flex items-center gap-0.5">
              ↗ +2.6%
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#00E599]">
            +S$3,150
          </div>
          <div className="text-[11px] text-[#6F7887] mt-1 font-sans">
            Day profit and loss
          </div>
          <div className="text-[10px] text-[#8C96A5] mt-2 pt-2 border-t border-[#161C26]">
            NVDA +S$1,420 largest
          </div>
        </div>

        {/* Card 3: Total Return */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#8C96A5] font-semibold tracking-wider">TOTAL RETURN</span>
            <span className="text-[#8C96A5] text-[11px] font-medium">
              +2.3 pts
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#00E599]">
            +8.4%
          </div>
          <div className="text-[11px] text-[#6F7887] mt-1 font-sans">
            Since 1 Jan 2026
          </div>
          <div className="text-[10px] text-[#8C96A5] mt-2 pt-2 border-t border-[#161C26]">
            Benchmark VWRA +6.1%
          </div>
        </div>

        {/* Card 4: FX Effect */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#8C96A5] font-semibold tracking-wider">FX EFFECT</span>
            <span className="text-[#FF3B56] text-[11px] font-bold bg-[#FF3B56]/10 px-1.5 py-0.5 rounded border border-[#FF3B56]/20 flex items-center gap-0.5">
              ↘ FX
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#FF3B56]">
            −2.8%
          </div>
          <div className="text-[11px] text-[#6F7887] mt-1 font-sans">
            USD/SGD drag on return
          </div>
          <div className="text-[10px] text-[#8C96A5] mt-2 pt-2 border-t border-[#161C26]">
            Stocks +11.2% · FX −2.8%
          </div>
        </div>
      </div>

      {/* 3-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Column 1: Watchlist / Core */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#161C26]">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">WATCHLIST / CORE</div>
              <h2 className="text-sm font-bold text-[#F0F4F8]">Watchlist</h2>
            </div>
            <Link
              href="/watchlist"
              className="text-[11px] font-mono text-[#00E599] hover:underline flex items-center gap-0.5"
            >
              ALL LISTS →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                  <th className="py-1.5 font-normal">TICKER</th>
                  <th className="py-1.5 font-normal">7D</th>
                  <th className="py-1.5 text-right font-normal">LAST</th>
                  <th className="py-1.5 text-right font-normal">1D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161C26]/60">
                {SAMPLE_WATCHLIST.map((row) => (
                  <tr key={row.ticker} className="hover:bg-[#121620] transition-colors group">
                    <td className="py-2">
                      <Link href={`/stocks/${row.ticker}`} className="block">
                        <div className="font-bold text-[#F0F4F8] group-hover:text-[#00E599] transition-colors">
                          {row.ticker}
                        </div>
                        <div className="text-[10px] text-[#6F7887] font-sans truncate max-w-[100px]">
                          {row.name}
                        </div>
                      </Link>
                    </td>
                    <td className="py-2">
                      <MiniSparkline data={row.sparkline} isPositive={row.isPositive} />
                    </td>
                    <td className="py-2 text-right font-medium text-[#F0F4F8]">
                      {row.price}
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn('font-bold', row.isPositive ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
                        {row.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Allocation / By Asset Class */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#161C26]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">ALLOCATION / BY ASSET CLASS</div>
                <h2 className="text-sm font-bold text-[#F0F4F8]">Overview</h2>
              </div>
              <Link
                href="/portfolio"
                className="text-[11px] font-mono text-[#00E599] hover:underline flex items-center gap-0.5"
              >
                PORTFOLIO →
              </Link>
            </div>

            {/* Circular Donut & Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              {/* SVG Donut */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#161C26" strokeWidth="4" />
                  {/* US stocks 46% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#00E599"
                    strokeWidth="4"
                    strokeDasharray="40.5 47.5"
                    strokeDashoffset="0"
                  />
                  {/* VWRA 24% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#00B2FF"
                    strokeWidth="4"
                    strokeDasharray="21.1 66.9"
                    strokeDashoffset="-40.5"
                  />
                  {/* Singapore stocks 15% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#FFB020"
                    strokeWidth="4"
                    strokeDasharray="13.2 74.8"
                    strokeDashoffset="-61.6"
                  />
                  {/* Gold 10% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#E6C200"
                    strokeWidth="4"
                    strokeDasharray="8.8 79.2"
                    strokeDashoffset="-74.8"
                  />
                  {/* Cash 5% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#6F7887"
                    strokeWidth="4"
                    strokeDasharray="4.4 83.6"
                    strokeDashoffset="-83.6"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] uppercase text-[#6F7887]">TOTAL</div>
                  <div className="text-sm font-bold text-[#F0F4F8]">S$124.8k</div>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs font-mono w-full sm:w-auto">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#00E599]" />
                    <span className="text-[#8C96A5]">US stocks</span>
                  </div>
                  <span className="font-bold text-[#F0F4F8]">46%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#00B2FF]" />
                    <span className="text-[#8C96A5]">Global ETF (VWRA)</span>
                  </div>
                  <span className="font-bold text-[#F0F4F8]">24%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#FFB020]" />
                    <span className="text-[#8C96A5]">Singapore stocks</span>
                  </div>
                  <span className="font-bold text-[#F0F4F8]">15%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#E6C200]" />
                    <span className="text-[#8C96A5]">Gold</span>
                  </div>
                  <span className="font-bold text-[#F0F4F8]">10%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#6F7887]" />
                    <span className="text-[#8C96A5]">Cash</span>
                  </div>
                  <span className="font-bold text-[#F0F4F8]">5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rule Checks / Alerts Section */}
          <div className="pt-3 border-t border-[#161C26] mt-2 space-y-2">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
              RULE CHECKS
            </div>
            <div className="p-2 rounded bg-[#FFB020]/10 border border-[#FFB020]/25 text-xs flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-[#F0F4F8]">NVDA is 12.6% of the portfolio</div>
              </div>
              <span className="text-[10px] font-bold text-[#FFB020] bg-[#FFB020]/20 px-1.5 py-0.5 rounded shrink-0">
                WARNING · &gt;12% TRIM
              </span>
            </div>
            <div className="p-2 rounded bg-[#00B2FF]/10 border border-[#00B2FF]/25 text-xs flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-[#F0F4F8]">US-situs holdings US$44k of US$60k</div>
              </div>
              <span className="text-[10px] font-bold text-[#00B2FF] bg-[#00B2FF]/20 px-1.5 py-0.5 rounded shrink-0">
                INFO · ESTATE LIMIT
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: News / Sorted by Relevance */}
        <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#161C26]">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">NEWS / SORTED BY RELEVANCE</div>
              <h2 className="text-sm font-bold text-[#F0F4F8]">News feed</h2>
            </div>
            <Link
              href="/news"
              className="text-[11px] font-mono text-[#00E599] hover:underline flex items-center gap-0.5"
            >
              ALL NEWS →
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2 text-[10px] font-mono border-b border-[#161C26]">
            {['ALL', 'HOLDINGS', 'FED', 'SG', 'ID', 'TECH'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setNewsFilter(tab)}
                className={cn(
                  'px-2 py-0.5 rounded transition-colors whitespace-nowrap',
                  newsFilter === tab
                    ? 'bg-[#161D2B] text-[#00E599] font-bold border border-[#00E599]/30'
                    : 'text-[#6F7887] hover:text-[#F0F4F8]'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* News List */}
          <div className="space-y-3 overflow-y-auto max-h-[380px] scrollbar-thin">
            {filteredNews.map((news) => (
              <div key={news.id} className="border-b border-[#161C26]/60 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[10px] text-[#6F7887] mb-1">
                  <span>{news.date} · {news.source}</span>
                  <span
                    className={cn(
                      'px-1 py-0.2 rounded font-bold text-[9px]',
                      news.importance === 'HIGH'
                        ? 'bg-[#FF3B56]/15 text-[#FF3B56] border border-[#FF3B56]/30'
                        : 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                    )}
                  >
                    {news.importance}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#F0F4F8] hover:text-[#00E599] transition-colors leading-snug cursor-pointer">
                  {news.title}
                </div>
                {news.whyItMatters && (
                  <div className="mt-1 text-[11px] text-[#8C96A5] font-sans bg-[#121620]/70 p-1.5 rounded border border-[#161C26]">
                    <span className="text-[#00E599] font-mono font-semibold text-[10px]">WHY IT MATTERS · </span>
                    {news.whyItMatters}
                  </div>
                )}
                <div className="mt-1 text-[9px] text-[#6F7887] font-mono">
                  {news.tags}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Section: SCHEDULE / TIMES IN SGT */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#161C26]">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">SCHEDULE / TIMES IN SGT</div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-[#F0F4F8]">Events</h2>
              {/* Category Filters */}
              <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto scrollbar-none">
                {['ALL', 'CENTRAL BANKS', 'DATA', 'EARNINGS', 'HOLIDAYS'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setScheduleFilter(cat)}
                    className={cn(
                      'px-2 py-0.5 rounded transition-colors whitespace-nowrap',
                      scheduleFilter === cat
                        ? 'bg-[#161D2B] text-[#00E599] font-bold border border-[#00E599]/30'
                        : 'text-[#6F7887] hover:text-[#F0F4F8]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/calendar"
            className="text-[11px] font-mono text-[#00E599] hover:underline flex items-center gap-0.5 shrink-0"
          >
            FULL CALENDAR →
          </Link>
        </div>

        {/* Quarter Progress Tracker */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
              <div className="font-bold text-[#F0F4F8]">Q1 2026</div>
              <div className="text-[10px] text-[#6F7887]">JAN – MAR</div>
              <div className="mt-1 text-[10px] text-[#8C96A5] font-semibold">DONE</div>
            </div>
            <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
              <div className="font-bold text-[#F0F4F8]">Q2 2026</div>
              <div className="text-[10px] text-[#6F7887]">APR – JUN</div>
              <div className="mt-1 text-[10px] text-[#8C96A5] font-semibold">DONE</div>
            </div>
            <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
              <div className="font-bold text-[#F0F4F8]">Q3 2026</div>
              <div className="text-[10px] text-[#6F7887]">JUL – SEP</div>
              <div className="mt-1 text-[10px] text-[#8C96A5] font-semibold">DONE · REPORTING ENDED</div>
            </div>
            <div className="bg-[#161D2B] border border-[#00E599]/40 p-2 rounded shadow-[0_0_12px_rgba(0,229,153,0.08)]">
              <div className="font-bold text-[#00E599]">Q4 2026</div>
              <div className="text-[10px] text-[#8C96A5]">OCT – DEC</div>
              <div className="mt-1 text-[10px] text-[#00E599] font-bold">NOW · DAY 55 OF 92</div>
            </div>
            <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
              <div className="font-bold text-[#F0F4F8]">Q1 2027</div>
              <div className="text-[10px] text-[#6F7887]">JAN – MAR</div>
              <div className="mt-1 text-[10px] text-[#6F7887] font-semibold">STARTS 1 JAN · IN 38D</div>
            </div>
          </div>
          <div className="text-[11px] text-[#6F7887] font-sans">
            EARNINGS SEASON · Q3 reports done (NVDA reported 17 Nov) · Q4 reports start mid-Jan (est.)
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                <th className="py-2 font-normal">DATE</th>
                <th className="py-2 font-normal">IN</th>
                <th className="py-2 font-normal">TYPE</th>
                <th className="py-2 font-normal">EVENT</th>
                <th className="py-2 font-normal">DETAIL</th>
                <th className="py-2 text-right font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161C26]/60">
              {filteredSchedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#121620] transition-colors">
                  <td className="py-2.5 font-bold text-[#F0F4F8] whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-2.5 text-[#00E599] font-semibold whitespace-nowrap">
                    {item.inDays}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161C26] text-[#8C96A5] font-semibold">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-[#F0F4F8]">
                    {item.event}
                  </td>
                  <td className="py-2.5 text-[#6F7887] font-sans">
                    {item.detail}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        item.status === 'CONFIRMED'
                          ? 'bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30'
                          : item.status === 'EST.'
                          ? 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                          : 'bg-[#00B2FF]/15 text-[#00B2FF] border border-[#00B2FF]/30'
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Attribution Note */}
        <div className="pt-2 border-t border-[#161C26] text-[10px] text-[#6F7887]">
          Prices: StockPulse API snapshot, 23 Nov 2026. Dates: Federal Reserve, BLS, Bank Indonesia, MAS and NVIDIA releases. Portfolio values are sample data.
        </div>
      </div>
    </div>
  )
}
