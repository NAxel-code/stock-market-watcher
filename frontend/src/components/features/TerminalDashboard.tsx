'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fetchBatchQuotes, fetchPortfolioAnalysis } from '@/lib/api'
import { formatCurrency, formatCompactCurrency, formatPercent, getStockCurrency } from '@/lib/formatters'
import { convertCurrency } from '@/lib/currency'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

interface WatchlistRow {
  ticker: string
  name: string
  nativePrice: number
  nativeCurrency: string
  price: string
  change: string
  isPositive: boolean
  sparkline: number[]
}

const SAMPLE_WATCHLIST: WatchlistRow[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    nativePrice: 166.66,
    nativeCurrency: 'USD',
    price: '$166.66',
    change: '+32.77%',
    isPositive: true,
    sparkline: [125, 126, 128, 127, 130, 145, 166.66],
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    nativePrice: 499.59,
    nativeCurrency: 'USD',
    price: '$499.59',
    change: '+3.11%',
    isPositive: true,
    sparkline: [480, 482, 488, 485, 492, 495, 499.59],
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc',
    nativePrice: 257.45,
    nativeCurrency: 'USD',
    price: '$257.45',
    change: '+4.30%',
    isPositive: true,
    sparkline: [242, 245, 248, 250, 252, 255, 257.45],
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc',
    nativePrice: 282.46,
    nativeCurrency: 'USD',
    price: '$282.46',
    change: '+6.47%',
    isPositive: true,
    sparkline: [260, 263, 268, 270, 274, 278, 282.46],
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc',
    nativePrice: 593.61,
    nativeCurrency: 'USD',
    price: '$593.61',
    change: '+5.84%',
    isPositive: true,
    sparkline: [550, 558, 565, 570, 580, 588, 593.61],
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc',
    nativePrice: 348.87,
    nativeCurrency: 'USD',
    price: '$348.87',
    change: '+1.84%',
    isPositive: true,
    sparkline: [338, 340, 342, 343, 345, 347, 348.87],
  },
  {
    ticker: 'D05.SI',
    name: 'DBS Group Holdings',
    nativePrice: 65.76,
    nativeCurrency: 'SGD',
    price: 'S$65.76',
    change: '−0.53%',
    isPositive: false,
    sparkline: [67.0, 66.8, 66.5, 66.2, 66.0, 65.9, 65.76],
  },
  {
    ticker: 'BBCA.JK',
    name: 'Bank Central Asia',
    nativePrice: 5675,
    nativeCurrency: 'IDR',
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

function MiniSparkline({ data }: { data: number[] }) {
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

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke="#a1a1aa"
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
  const { watchlist, streamStatus, triggeredAlerts, displayCurrency, fxRates, language } = useUIStore()
  const baseCurrency = displayCurrency === 'NATIVE' ? 'SGD' : displayCurrency
  const isId = language === 'id'

  const coreTickers = useMemo(
    () => (watchlist.length > 0 ? watchlist.slice(0, 8) : SAMPLE_WATCHLIST.map((r) => r.ticker)),
    [watchlist]
  )

  const { data: liveBatchQuotes } = useQuery({
    queryKey: ['quotes', 'batch', 'terminal-core', coreTickers.join(',')],
    queryFn: () => fetchBatchQuotes(coreTickers),
    staleTime: 30_000,
    refetchInterval: streamStatus === 'live' ? false : 60_000,
  })

  const { data: portfolioSnap } = useQuery({
    queryKey: ['portfolio', 'analyze', baseCurrency],
    queryFn: () => fetchPortfolioAnalysis(baseCurrency),
    staleTime: 60_000,
  })

  const watchlistRows = useMemo<WatchlistRow[]>(() => {
    const formatPrice = (amount: number, fromCurr: string) => {
      const targetCurr = displayCurrency === 'NATIVE' ? fromCurr : displayCurrency
      const converted =
        targetCurr === fromCurr
          ? amount
          : convertCurrency(amount, fromCurr, targetCurr, fxRates)
      const finalAmount = converted !== null ? converted : amount
      const finalCurrency = converted !== null ? targetCurr : fromCurr
      return formatCurrency(finalAmount, finalCurrency)
    }

    if (!liveBatchQuotes || liveBatchQuotes.length === 0) {
      return SAMPLE_WATCHLIST.map((item) => ({
        ...item,
        price: formatPrice(item.nativePrice, item.nativeCurrency),
      }))
    }
    return liveBatchQuotes.map((q) => {
      const curr = getStockCurrency(q)
      const isPositive = q.change_percent >= 0
      const spark = q.sparkline_7d && q.sparkline_7d.length >= 2
        ? q.sparkline_7d
        : [q.previous_close || q.current_price, q.current_price]
      return {
        ticker: q.ticker,
        name: q.company_name,
        nativePrice: q.current_price,
        nativeCurrency: curr,
        price: formatPrice(q.current_price, curr),
        change: formatPercent(q.change_percent),
        isPositive,
        sparkline: spark,
      }
    })
  }, [liveBatchQuotes, displayCurrency, fxRates])

  const convertSnapMetric = (amount: number, snapCurr?: string) => {
    const fromCurr = snapCurr || 'SGD'
    if (fromCurr === baseCurrency) return amount
    return convertCurrency(amount, fromCurr, baseCurrency, fxRates) ?? amount
  }

  const totalPortfolioValue = portfolioSnap
    ? convertSnapMetric(portfolioSnap.total_value_base, portfolioSnap.base_currency)
    : convertSnapMetric(124800, 'SGD')
  const unrealizedPnlValue = portfolioSnap
    ? convertSnapMetric(portfolioSnap.unrealized_pnl_base, portfolioSnap.base_currency)
    : convertSnapMetric(3150, 'SGD')
  const stockMoveValue = portfolioSnap
    ? convertSnapMetric(portfolioSnap.total_stock_move_pnl_base, portfolioSnap.base_currency)
    : convertSnapMetric(1420, 'SGD')
  const fxMoveValue = portfolioSnap
    ? convertSnapMetric(portfolioSnap.total_fx_move_pnl_base, portfolioSnap.base_currency)
    : null
  const netDividendValue = portfolioSnap
    ? convertSnapMetric(portfolioSnap.total_annual_dividend_net_base, portfolioSnap.base_currency)
    : convertSnapMetric(1840, 'SGD')

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
    <div className="space-y-4 pb-12 font-mono text-[#f4f4f5]">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a]">
            {isId
              ? `PORTOFOLIO / BASIS ${baseCurrency} / CONTOH KEPEMILIKAN`
              : `PORTFOLIO / ${baseCurrency} BASE / SAMPLE HOLDINGS`}
          </div>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-[#f4f4f5] mt-0.5">
            {isId ? 'Dasbor' : 'Dashboard'}
          </h1>
        </div>

        {/* Timeframe Selector (Minimalist White Active Pill) */}
        <div className="flex items-center gap-0.5 bg-[#0f0f12] p-0.5 rounded border border-[#222226] text-[11px]">
          {(['1D', '1W', '1M', 'YTD', '1Y'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                'px-2.5 py-1 rounded transition-colors font-semibold',
                timeframe === tf
                  ? 'bg-[#f4f4f5] text-[#09090b]'
                  : 'text-[#71717a] hover:text-[#f4f4f5]'
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
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#71717a] font-medium tracking-wider">{isId ? 'NILAI' : 'VALUE'}</span>
            <span
              className={cn(
                'text-[11px] font-medium',
                (portfolioSnap?.unrealized_pnl_percent ?? 2.6) >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {portfolioSnap ? formatPercent(portfolioSnap.unrealized_pnl_percent) : '↗ +2.6%'}
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#f4f4f5]">
            {formatCurrency(totalPortfolioValue, baseCurrency)}
          </div>
          <div className="text-[11px] text-[#71717a] mt-1 font-sans">
            {isId ? 'Total nilai portofolio' : 'Total portfolio value'}
          </div>
          <div className="text-[10px] text-[#71717a] mt-2.5 pt-2 border-t border-[#1c1c21]">
            {portfolioSnap
              ? isId
                ? `${portfolioSnap.holdings.length} saham · ${Object.keys(portfolioSnap.allocation.by_currency).length} mata uang`
                : `${portfolioSnap.holdings.length} holdings · ${Object.keys(portfolioSnap.allocation.by_currency).length} currencies`
              : isId
                ? '9 saham · 3 mata uang'
                : '9 holdings · 3 currencies'}
          </div>
        </div>

        {/* Card 2: Today / P&L */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#71717a] font-medium tracking-wider">{isId ? 'L/R BELUM REALISASI' : 'UNREALIZED P&L'}</span>
            <span className="text-emerald-400 text-[10px] font-medium">
              {streamStatus === 'live' ? '● LIVE' : '↗ +2.6%'}
            </span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold tracking-tight',
              unrealizedPnlValue >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {`${unrealizedPnlValue >= 0 ? '+' : ''}${formatCurrency(unrealizedPnlValue, baseCurrency)}`}
          </div>
          <div className="text-[11px] text-[#71717a] mt-1 font-sans">
            {isId ? 'Alpha saham + L/R valas bersih' : 'Stock alpha + FX net P&L'}
          </div>
          <div className="text-[10px] text-[#71717a] mt-2.5 pt-2 border-t border-[#1c1c21]">
            {portfolioSnap
              ? `${isId ? 'Saham' : 'Stock'}: ${formatCurrency(stockMoveValue, baseCurrency)}`
              : `NVDA +${formatCurrency(stockMoveValue, baseCurrency)}`}
          </div>
        </div>

        {/* Card 3: Total Return */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#71717a] font-medium tracking-wider">{isId ? 'TOTAL IMBAL HASIL' : 'TOTAL RETURN'}</span>
            <span className="text-emerald-400 text-[11px] font-medium">
              Sharpe {portfolioSnap?.risk.sharpe_ratio.toFixed(2) ?? '1.42'}
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400">
            {portfolioSnap ? formatPercent(portfolioSnap.unrealized_pnl_percent) : '+8.4%'}
          </div>
          <div className="text-[11px] text-[#71717a] mt-1 font-sans">
            {isId ? 'Sejak harga beli awal' : 'Since cost basis inception'}
          </div>
          <div className="text-[10px] text-[#71717a] mt-2.5 pt-2 border-t border-[#1c1c21]">
            Beta {portfolioSnap?.risk.portfolio_beta.toFixed(2) ?? '1.05'} · Vol {portfolioSnap?.risk.annualized_volatility.toFixed(1) ?? '14.2'}%
          </div>
        </div>

        {/* Card 4: FX Effect */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#71717a] font-medium tracking-wider">{isId ? 'EFEK VALAS' : 'FX EFFECT'}</span>
            <span className="text-red-400 text-[11px] font-medium">
              ↘ {isId ? 'VALAS' : 'FX'}
            </span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold tracking-tight',
              (fxMoveValue ?? -1) >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {fxMoveValue !== null
              ? formatCurrency(fxMoveValue, baseCurrency)
              : '−2.8%'}
          </div>
          <div className="text-[11px] text-[#71717a] mt-1 font-sans">
            {isId ? 'Selisih translasi lintas mata uang' : 'Cross-currency translation drag'}
          </div>
          <div className="text-[10px] text-[#71717a] mt-2.5 pt-2 border-t border-[#1c1c21]">
            {isId ? 'Dividen Bersih' : 'Net Dividend'}: {formatCurrency(netDividendValue, baseCurrency)}
          </div>
        </div>
      </div>

      {/* 3-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Column 1: Watchlist / Core */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1c1c21]">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                {isId ? 'PANTAUAN / INTI' : 'WATCHLIST / CORE'}
              </div>
              <h2 className="text-sm font-sans font-bold text-[#f4f4f5]">
                {isId ? 'Daftar Pantau' : 'Watchlist'}
              </h2>
            </div>
            <Link
              href="/watchlist"
              className="text-[11px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors flex items-center gap-0.5"
            >
              {isId ? 'SEMUA DAFTAR →' : 'ALL LISTS →'}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1c1c21] text-[10px] uppercase text-[#71717a]">
                  <th className="py-1.5 font-normal">{isId ? 'EMITEN' : 'TICKER'}</th>
                  <th className="py-1.5 font-normal">{isId ? '7H' : '7D'}</th>
                  <th className="py-1.5 text-right font-normal">{isId ? 'HARGA' : 'LAST'}</th>
                  <th className="py-1.5 text-right font-normal">{isId ? '1H' : '1D'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c21]">
                {watchlistRows.map((row) => (
                  <tr key={row.ticker} className="hover:bg-[#141418] transition-colors group">
                    <td className="py-2">
                      <Link href={`/stocks/${row.ticker}`} className="block">
                        <div className="font-semibold text-[#f4f4f5] group-hover:text-white transition-colors">
                          {row.ticker}
                        </div>
                        <div className="text-[10px] text-[#71717a] font-sans truncate max-w-[100px]">
                          {row.name}
                        </div>
                      </Link>
                    </td>
                    <td className="py-2">
                      <MiniSparkline data={row.sparkline} />
                    </td>
                    <td className="py-2 text-right font-medium text-[#f4f4f5]">
                      {row.price}
                    </td>
                    <td className="py-2 text-right">
                      <span className={cn('font-medium', row.isPositive ? 'text-emerald-400' : 'text-red-400')}>
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
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1c1c21]">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                  {isId ? 'ALOKASI / BERDASARKAN KELAS ASET' : 'ALLOCATION / BY ASSET CLASS'}
                </div>
                <h2 className="text-sm font-sans font-bold text-[#f4f4f5]">
                  {isId ? 'Ringkasan' : 'Overview'}
                </h2>
              </div>
              <Link
                href="/portfolio"
                className="text-[11px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors flex items-center gap-0.5"
              >
                {isId ? 'PORTOFOLIO →' : 'PORTFOLIO →'}
              </Link>
            </div>

            {/* Circular Donut & Legend (Monochrome Obsidian Spectrum matching PDF) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              {/* SVG Donut */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Background track */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#18181b" strokeWidth="4" />
                  {/* US stocks 46% */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#f4f4f5"
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
                    stroke="#a1a1aa"
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
                    stroke="#71717a"
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
                    stroke="#52525b"
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
                    stroke="#27272a"
                    strokeWidth="4"
                    strokeDasharray="4.4 83.6"
                    strokeDashoffset="-83.6"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                  <div className="text-[10px] uppercase text-[#71717a]">TOTAL</div>
                  <div className="text-xs font-bold text-[#f4f4f5]">
                    {formatCompactCurrency(totalPortfolioValue, baseCurrency)}
                  </div>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1.5 text-xs font-mono w-full sm:w-auto">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#f4f4f5]" />
                    <span className="text-[#a1a1aa]">{isId ? 'Saham AS' : 'US stocks'}</span>
                  </div>
                  <span className="font-semibold text-[#f4f4f5]">46%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#a1a1aa]" />
                    <span className="text-[#a1a1aa]">{isId ? 'ETF Global (VWRA)' : 'Global ETF (VWRA)'}</span>
                  </div>
                  <span className="font-semibold text-[#f4f4f5]">24%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#71717a]" />
                    <span className="text-[#a1a1aa]">{isId ? 'Saham Singapura' : 'Singapore stocks'}</span>
                  </div>
                  <span className="font-semibold text-[#f4f4f5]">15%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#52525b]" />
                    <span className="text-[#a1a1aa]">{isId ? 'Emas' : 'Gold'}</span>
                  </div>
                  <span className="font-semibold text-[#f4f4f5]">10%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#27272a]" />
                    <span className="text-[#a1a1aa]">{isId ? 'Kas' : 'Cash'}</span>
                  </div>
                  <span className="font-semibold text-[#f4f4f5]">5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rule Checks / Alerts Section */}
          <div className="pt-3 border-t border-[#1c1c21] mt-2 space-y-2">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
              {isId ? 'PEMERIKSAAN ATURAN' : 'RULE CHECKS'}
            </div>
            {triggeredAlerts.slice(0, 2).map((alert) => (
              <div key={alert.id} className="py-1.5 border-b border-[#1c1c21] text-xs flex items-start justify-between gap-2">
                <div className="font-sans text-[#e4e4e7]">
                  {alert.message ?? `${alert.ticker} ${alert.condition} ${alert.target_price}`}
                </div>
                <span className="text-[10px] font-medium text-emerald-400 shrink-0">
                  {isId ? 'TERPICU' : 'TRIGGERED'}
                </span>
              </div>
            ))}
            <div className="py-1.5 border-b border-[#1c1c21] text-xs flex items-start justify-between gap-2">
              <div className="font-sans text-[#e4e4e7]">
                {portfolioSnap?.risk.position_cap_warnings?.[0] ?? 'NVDA is 12.6% of the portfolio'}
              </div>
              <span className="text-[10px] font-medium text-amber-400 shrink-0">
                {isId ? 'PERINGATAN · PANGKAS >12%' : 'WARNING · >12% TRIM'}
              </span>
            </div>
            <div className="py-1 text-xs flex items-start justify-between gap-2">
              <div className="font-sans text-[#e4e4e7]">
                {portfolioSnap
                  ? `${isId ? 'Eksposur aset AS' : 'US-situs exposure'} US$${Math.round(portfolioSnap.risk.us_estate_tax_exposure_usd / 1000)}k / US$60k`
                  : 'US-situs holdings US$44k of US$60k'}
              </div>
              <span className="text-[10px] font-medium text-[#71717a] shrink-0">
                {isId ? 'INFO · BATAS ESTATE' : 'INFO · ESTATE LIMIT'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: News / Sorted by Relevance */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1c1c21]">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
                {isId ? 'BERITA / URUT RELEVANSI' : 'NEWS / SORTED BY RELEVANCE'}
              </div>
              <h2 className="text-sm font-sans font-bold text-[#f4f4f5]">
                {isId ? 'Berita Pasar' : 'News feed'}
              </h2>
            </div>
            <Link
              href="/news"
              className="text-[11px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors flex items-center gap-0.5"
            >
              {isId ? 'SEMUA BERITA →' : 'ALL NEWS →'}
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2 text-[10px] font-mono border-b border-[#1c1c21]">
            {[
              { id: 'ALL', label: isId ? 'SEMUA' : 'ALL' },
              { id: 'HOLDINGS', label: isId ? 'PORTOFOLIO' : 'HOLDINGS' },
              { id: 'FED', label: 'FED' },
              { id: 'SG', label: 'SG' },
              { id: 'ID', label: 'ID' },
              { id: 'TECH', label: 'TECH' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setNewsFilter(tab.id)}
                className={cn(
                  'px-2 py-0.5 rounded transition-colors whitespace-nowrap',
                  newsFilter === tab.id
                    ? 'bg-[#f4f4f5] text-[#09090b] font-semibold'
                    : 'text-[#71717a] hover:text-[#f4f4f5]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* News List */}
          <div className="space-y-3 overflow-y-auto max-h-[380px] scrollbar-thin">
            {filteredNews.map((news) => (
              <div key={news.id} className="border-b border-[#1c1c21] pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[10px] text-[#71717a] mb-1">
                  <span>{news.date} · {news.source}</span>
                  <span
                    className={cn(
                      'font-semibold text-[9px]',
                      news.importance === 'HIGH' ? 'text-amber-400' : 'text-[#71717a]'
                    )}
                  >
                    {news.importance}
                  </span>
                </div>
                <div className="text-xs font-sans font-semibold text-[#f4f4f5] hover:text-white transition-colors leading-snug cursor-pointer">
                  {news.title}
                </div>
                {news.whyItMatters && (
                  <div className="mt-1.5 text-[11px] text-[#a1a1aa] font-sans pl-2 border-l border-[#3f3f46]">
                    {news.whyItMatters}
                  </div>
                )}
                <div className="mt-1 text-[9px] text-[#71717a] font-mono">
                  {news.tags}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Section: SCHEDULE / TIMES IN SGT */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1c1c21]">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#71717a]">
              {isId ? 'JADWAL / ZONA WAKTU SGT' : 'SCHEDULE / TIMES IN SGT'}
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-sans font-bold text-[#f4f4f5]">
                {isId ? 'Kalender Acara' : 'Events'}
              </h2>
              {/* Category Filters */}
              <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto scrollbar-none">
                {[
                  { id: 'ALL', label: isId ? 'SEMUA' : 'ALL' },
                  { id: 'CENTRAL BANKS', label: isId ? 'BANK SENTRAL' : 'CENTRAL BANKS' },
                  { id: 'DATA', label: 'DATA' },
                  { id: 'EARNINGS', label: 'EARNINGS' },
                  { id: 'HOLIDAYS', label: isId ? 'LIBUR BURSA' : 'HOLIDAYS' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setScheduleFilter(cat.id)}
                    className={cn(
                      'px-2 py-0.5 rounded transition-colors whitespace-nowrap',
                      scheduleFilter === cat.id
                        ? 'bg-[#f4f4f5] text-[#09090b] font-semibold'
                        : 'text-[#71717a] hover:text-[#f4f4f5]'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/calendar"
            className="text-[11px] font-mono text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors flex items-center gap-0.5 shrink-0"
          >
            {isId ? 'KALENDER PENUH →' : 'FULL CALENDAR →'}
          </Link>
        </div>

        {/* Quarter Progress Tracker (PDF Page 1 Monochrome Active Block) */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-left text-xs">
            <div className="bg-[#141418] border border-[#222226] p-2.5 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#f4f4f5]">Q1</span>
                <span className="text-[10px] text-[#71717a]">2026</span>
              </div>
              <div className="text-[10px] text-[#71717a]">JAN – MAR</div>
              <div className="mt-2 text-[10px] text-[#71717a] font-medium">{isId ? 'SELESAI' : 'DONE'}</div>
            </div>
            <div className="bg-[#141418] border border-[#222226] p-2.5 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#f4f4f5]">Q2</span>
                <span className="text-[10px] text-[#71717a]">2026</span>
              </div>
              <div className="text-[10px] text-[#71717a]">APR – JUN</div>
              <div className="mt-2 text-[10px] text-[#71717a] font-medium">{isId ? 'SELESAI' : 'DONE'}</div>
            </div>
            <div className="bg-[#141418] border border-[#222226] p-2.5 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#f4f4f5]">Q3</span>
                <span className="text-[10px] text-[#71717a]">2026</span>
              </div>
              <div className="text-[10px] text-[#71717a]">JUL – SEP</div>
              <div className="mt-2 text-[10px] text-[#71717a] font-medium">{isId ? 'SELESAI · LAPORAN TUTUP' : 'DONE · REPORTING ENDED'}</div>
            </div>
            <div className="bg-[#f4f4f5] border border-[#f4f4f5] p-2.5 rounded text-[#09090b]">
              <div className="flex items-center justify-between">
                <span className="font-bold">Q4</span>
                <span className="text-[10px] text-zinc-600">2026</span>
              </div>
              <div className="text-[10px] text-zinc-600">OKT – DES</div>
              <div className="mt-2 text-[10px] font-bold text-[#09090b]">{isId ? 'SAAT INI · HARI 55 DARI 92' : 'NOW · DAY 55 OF 92'}</div>
            </div>
            <div className="bg-[#141418] border border-[#222226] p-2.5 rounded">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#f4f4f5]">Q1</span>
                <span className="text-[10px] text-[#71717a]">2027</span>
              </div>
              <div className="text-[10px] text-[#71717a]">JAN – MAR</div>
              <div className="mt-2 text-[10px] text-[#71717a] font-medium">{isId ? 'MULAI 1 JAN · 38 HARI LAGI' : 'STARTS 1 JAN · IN 38D'}</div>
            </div>
          </div>
          <div className="text-[11px] text-[#71717a] font-sans">
            {isId
              ? 'MUSIM LAPORAN LABA · Q3 selesai (NVDA rilis 17 Nov) · Q4 mulai pertengahan Jan (est.)'
              : 'EARNINGS SEASON · Q3 reports done (NVDA reported 17 Nov) · Q4 reports start mid-Jan (est.)'}
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1c1c21] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">{isId ? 'TANGGAL' : 'DATE'}</th>
                <th className="py-2 font-normal">{isId ? 'DLN' : 'IN'}</th>
                <th className="py-2 font-normal">{isId ? 'TIPE' : 'TYPE'}</th>
                <th className="py-2 font-normal">{isId ? 'ACARA' : 'EVENT'}</th>
                <th className="py-2 font-normal">DETAIL</th>
                <th className="py-2 text-right font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c21]">
              {filteredSchedule.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#141418] transition-colors">
                  <td className="py-2.5 font-semibold text-[#f4f4f5] whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-2.5 text-[#a1a1aa] whitespace-nowrap">
                    {item.inDays}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="text-[10px] text-[#71717a] font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-sans font-medium text-[#f4f4f5]">
                    {item.event}
                  </td>
                  <td className="py-2.5 text-[#71717a] font-sans">
                    {item.detail}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        item.status === 'CONFIRMED'
                          ? 'text-[#a1a1aa]'
                          : item.status === 'EST.'
                          ? 'text-amber-400'
                          : 'text-[#71717a]'
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
        <div className="pt-2 border-t border-[#1c1c21] text-[10px] text-[#71717a]">
          {isId
            ? 'Harga: Snapshot API StockPulse. Tanggal: Federal Reserve, BLS, Bank Indonesia, MAS, dan rilis NVIDIA. Nilai portofolio adalah data live & contoh.'
            : 'Prices: StockPulse API snapshot. Dates: Federal Reserve, BLS, Bank Indonesia, MAS and NVIDIA releases. Portfolio values are live & sample reference data.'}
        </div>
      </div>
    </div>
  )
}
