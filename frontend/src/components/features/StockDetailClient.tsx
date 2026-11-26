'use client'

import { useState } from 'react'
import { useStockData } from '@/hooks/useStockData'
import { useStockHistory } from '@/hooks/useStockHistory'
import { useUIStore } from '@/stores/useUIStore'
import { PriceChart } from '@/components/features/PriceChart'
import { FiftyTwoWeekRangeBar } from '@/components/features/FiftyTwoWeekRangeBar'
import { IdxLotCalculator } from '@/components/features/IdxLotCalculator'
import { PriceAlertDialog } from '@/components/features/PriceAlertDialog'
import { MultiHorizonReturns } from '@/components/features/MultiHorizonReturns'
import { AnalysisDeskTab } from '@/components/features/AnalysisDeskTab'
import { PaperTradingDesk } from '@/components/features/PaperTradingDesk'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, formatMarketCap, formatVolume, isIdxTicker, getStockCurrency } from '@/lib/formatters'
import { convertCurrency, formatConvertedPrice } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Plus, Minus, ShieldAlert, Compass, BarChart2, Calculator, Landmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export function StockDetailClient({ ticker }: { ticker: string }) {
  const [activeTab, setActiveTab] = useState<'desk' | 'chart' | 'simulator' | 'calculator'>('desk')
  const { data: quote, isLoading, error } = useStockData(ticker)
  const { data: history1y } = useStockHistory(ticker, '1y')
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, displayCurrency, fxRates } = useUIStore()
  const inWatchlist = isInWatchlist(ticker)
  const isIdx = isIdxTicker(ticker) || Boolean(quote?.is_idx)
  const stockCurrency = quote ? getStockCurrency(quote) : (isIdx ? 'IDR' : ticker.endsWith('.SI') ? 'SGD' : 'USD')

  const isConverted = displayCurrency !== 'NATIVE' && displayCurrency !== stockCurrency
  const convertedAmount = isConverted && quote
    ? convertCurrency(quote.current_price, stockCurrency, displayCurrency, fxRates)
    : null
  const convertedPriceStr = convertedAmount !== null && isConverted
    ? formatConvertedPrice(convertedAmount, displayCurrency)
    : null

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(ticker)
      toast.success(`${ticker} removed from watchlist`)
    } else {
      addToWatchlist(ticker)
      toast.success(`${ticker} added to watchlist`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="text-center py-16 text-red-400">
        <p className="text-lg">Could not load {ticker}</p>
        <p className="text-sm text-zinc-500 mt-1">{error?.message}</p>
      </div>
    )
  }

  const isPositive = quote.change_percent >= 0

  const stats = [
    { label: 'Market Cap', value: formatMarketCap(quote.market_cap, stockCurrency) },
    { label: 'Volume', value: quote.volume ? formatVolume(quote.volume) : 'N/A' },
    { label: '52W High', value: quote.fifty_two_week_high ? formatCurrency(quote.fifty_two_week_high, stockCurrency) : 'N/A' },
    { label: '52W Low', value: quote.fifty_two_week_low ? formatCurrency(quote.fifty_two_week_low, stockCurrency) : 'N/A' },
  ]

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5]">
      {/* Recent Tickers Breadcrumbs & Subtitle (Page 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222226] pb-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#71717a]">RECENT:</span>
          {['NVDA', 'MSFT', 'D05.SI', 'BBCA.JK'].map((rec) => (
            <a
              key={rec}
              href={`/stocks/${rec}`}
              className={cn(
                'px-1.5 py-0.5 rounded transition-colors',
                rec === quote.ticker
                  ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                  : 'text-[#71717a] hover:text-[#f4f4f5]'
              )}
            >
              {rec}
            </a>
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#71717a]">
          {(isIdx ? 'JKT' : (quote.ticker.endsWith('.SI') ? 'SGX' : 'NASDAQ'))} / {stockCurrency} / {quote.sector || 'TECHNOLOGY · SEMICONDUCTORS'}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#f4f4f5]">{quote.ticker}</h1>
            <span className="text-lg text-[#a1a1aa] font-sans font-medium">{quote.company_name}</span>
            {isIdx && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
                IDX
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriceAlertDialog
            ticker={quote.ticker}
            currentPrice={quote.current_price}
            currency={stockCurrency}
          />
          <Button
            variant={inWatchlist ? 'outline' : 'default'}
            size="sm"
            onClick={handleWatchlistToggle}
            className={cn('text-xs font-mono', inWatchlist ? 'border-[#27272a] bg-[#141418] text-[#a1a1aa] hover:text-[#f4f4f5]' : 'bg-[#f4f4f5] hover:bg-white text-[#09090b] font-bold')}
            aria-label={inWatchlist ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
          >
            {inWatchlist ? <><Minus className="h-3.5 w-3.5 mr-1" /> Remove</> : <><Plus className="h-3.5 w-3.5 mr-1" /> Add to Watchlist</>}
          </Button>
        </div>
      </div>

      {/* 4 Summary Stats Cards from Page 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#71717a] text-[10px] font-semibold">LAST</span>
            <span className={cn('text-[10px] font-bold px-1.5 py-0.2 rounded', isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '↗ ' : '↘ '}{formatPercent(quote.change_percent)}
            </span>
          </div>
          <div className="text-2xl font-bold text-[#f4f4f5]">
            {formatCurrency(quote.current_price, stockCurrency)}
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            Prev close {formatCurrency(quote.previous_close || (quote.current_price - quote.change), stockCurrency)}
          </div>
        </div>

        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3">
          <div className="text-[#71717a] text-[10px] font-semibold mb-1">FROM 52W HIGH</div>
          <div className="text-2xl font-bold text-red-400">
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null ? `${quote.distance_from_52w_high}%` : '−31.5%'}
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            52W {formatCurrency(quote.fifty_two_week_low || 124.5, stockCurrency)} – {formatCurrency(quote.fifty_two_week_high || 243.37, stockCurrency)}
          </div>
        </div>

        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3">
          <div className="text-[#71717a] text-[10px] font-semibold mb-1">MARKET CAP</div>
          <div className="text-2xl font-bold text-[#f4f4f5]">
            {formatMarketCap(quote.market_cap, stockCurrency)}
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            Volume {quote.volume ? formatVolume(quote.volume) : '453M'}
          </div>
        </div>

        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#71717a] text-[10px] font-semibold">NEXT EARNINGS</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">EST.</span>
          </div>
          <div className="text-2xl font-bold text-[#f4f4f5]">
            Late Feb
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            Q4 FY27 · date not confirmed
          </div>
        </div>
      </div>

      {/* Price & Auto Rejection Bands */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <div className="text-4xl font-bold font-mono tabular-nums tracking-tight text-[#f4f4f5]">
              {formatCurrency(quote.current_price, stockCurrency)}
            </div>
            {convertedPriceStr && (
              <span className="text-base font-mono font-medium text-[#a1a1aa] tracking-tight bg-[#141418] px-2.5 py-0.5 rounded border border-[#222226]">
                {convertedPriceStr}
              </span>
            )}
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#27272a] bg-[#141418] text-[#a1a1aa] font-mono tracking-wider uppercase"
              title={`Currency: ${stockCurrency}`}
            >
              {stockCurrency}
            </span>
          </div>
          <div className="text-[11px] text-[#71717a] font-mono mt-1">
            DENOMINATION:{' '}
            <span className="text-[#a1a1aa]">
              {stockCurrency === 'IDR'
                ? 'Indonesian Rupiah (IDR / Rp)'
                : stockCurrency === 'SGD'
                ? 'Singapore Dollar (SGD / S$)'
                : 'US Dollar (USD / $)'}
            </span>
          </div>
          <div className={cn('flex items-center gap-1.5 mt-1 text-base font-mono font-bold tabular-nums', isPositive ? 'text-emerald-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatPercent(quote.change_percent)}
            <span className="text-xs font-normal text-[#71717a]">({isPositive ? '+' : ''}{formatCurrency(quote.change, stockCurrency)})</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null && (
              <span className="text-[11px] text-[#71717a] font-mono">
                From 52W High:{' '}
                <span className={quote.distance_from_52w_high < 0 ? 'text-red-400 font-mono font-semibold tabular-nums' : 'text-emerald-400 font-mono font-semibold tabular-nums'}>
                  {quote.distance_from_52w_high > 0 ? `+${quote.distance_from_52w_high}%` : `${quote.distance_from_52w_high}%`}
                </span>
              </span>
            )}
            {quote.is_stale && (
              <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                ⚠ Delayed feed
              </div>
            )}
          </div>
        </div>

        {/* IDX Auto-Rejection limits (ARA / ARB) */}
        {isIdx && quote.ara_price && quote.arb_price && (
          <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1 text-[#f4f4f5] font-mono font-bold text-[11px] uppercase tracking-wider mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Auto Rejection Limits (IDX)</span>
            </div>
            <div className="flex gap-4 font-mono text-[11px]">
              <div>
                <span className="text-[#71717a]">ARA (Upper): </span>
                <span className="font-semibold tabular-nums text-emerald-400">{formatCurrency(quote.ara_price, 'IDR')}</span>
              </div>
              <div>
                <span className="text-[#71717a]">ARB (Lower): </span>
                <span className="font-semibold tabular-nums text-red-400">{formatCurrency(quote.arb_price, 'IDR')}</span>
              </div>
              {quote.tick_size && (
                <div>
                  <span className="text-[#71717a]">Tick: </span>
                  <span className="tabular-nums text-[#f4f4f5]">Rp {quote.tick_size}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0f0f12] rounded-md border border-[#222226] w-fit max-w-full overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('desk')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'desk'
              ? 'bg-[#f4f4f5] text-[#09090b]'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Technical Desk</span>
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'chart'
              ? 'bg-[#f4f4f5] text-[#09090b]'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Interactive Chart</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'simulator'
              ? 'bg-[#f4f4f5] text-[#09090b]'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          <Landmark className="h-3.5 w-3.5" />
          <span>Paper Trading</span>
        </button>
        {isIdx && (
          <button
            onClick={() => setActiveTab('calculator')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
              activeTab === 'calculator'
                ? 'bg-[#f4f4f5] text-[#09090b]'
                : 'text-[#71717a] hover:text-[#f4f4f5]'
            )}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>IDX Lot Calculator</span>
          </button>
        )}
      </div>

      {/* Tab Content: Technical Desk */}
      {activeTab === 'desk' && (
        <AnalysisDeskTab ticker={ticker} />
      )}

      {/* Tab Content: Paper Trading Simulator */}
      {activeTab === 'simulator' && (
        <PaperTradingDesk
          ticker={quote.ticker}
          currentPrice={quote.current_price}
          companyName={quote.company_name}
          currency={stockCurrency}
          volume={quote.volume}
        />
      )}

      {/* Tab Content: Interactive Chart & Stats */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Bloomberg-Style 52-Week Range Bar */}
          <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
            <FiftyTwoWeekRangeBar
              low={quote.fifty_two_week_low}
              high={quote.fifty_two_week_high}
              current={quote.current_price}
              currency={stockCurrency}
            />
          </div>

          {/* Multi-Horizon Returns Matrix */}
          <MultiHorizonReturns
            currentPrice={quote.current_price}
            dayChangePercent={quote.change_percent}
            history1y={history1y?.data}
            sparkline7d={quote.sparkline_7d}
          />

          {/* TradingView-Style Interactive Chart with Volume */}
          <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
            <PriceChart
              ticker={ticker}
              currency={stockCurrency}
              previousClose={quote.previous_close}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-[#222226] bg-[#0f0f12] p-3.5">
                <div className="text-[11px] font-mono text-[#71717a] uppercase mb-1">{stat.label}</div>
                <div className="font-mono font-bold tabular-nums text-sm text-[#f4f4f5]">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: IDX Lot Calculator */}
      {activeTab === 'calculator' && isIdx && (
        <IdxLotCalculator
          currentPrice={quote.current_price}
          ticker={quote.ticker}
          volume={quote.volume}
        />
      )}

      {/* Financials Quarterly Table from Page 4 */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase text-[#71717a]">FINANCIALS / QUARTERLY · FISCAL YEAR ENDS LATE JANUARY</div>
            <h3 className="text-sm font-bold text-[#f4f4f5]">Results</h3>
          </div>
          <span className="text-[10px] text-[#71717a]">SOURCE: 8-K · 17 NOV 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">GAAP</th>
                <th className="py-2 text-right font-normal">Q3 FY27</th>
                <th className="py-2 text-right font-normal">Q2 FY27</th>
                <th className="py-2 text-right font-normal">Q3 FY26</th>
                <th className="py-2 text-right font-normal">Y/Y</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              <tr>
                <td className="py-2 font-medium text-[#f4f4f5]">Revenue</td>
                <td className="py-2 text-right text-[#f4f4f5]">$115.8B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$96.2B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$57.0B</td>
                <td className="py-2 text-right font-bold text-emerald-400">+103%</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-[#f4f4f5]">Gross margin</td>
                <td className="py-2 text-right text-[#f4f4f5]">74.8%</td>
                <td className="py-2 text-right text-[#a1a1aa]">75.0%</td>
                <td className="py-2 text-right text-[#a1a1aa]">73.4%</td>
                <td className="py-2 text-right font-bold text-emerald-400">+1.4 pts</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-[#f4f4f5]">Operating income</td>
                <td className="py-2 text-right text-[#f4f4f5]">$77.5B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$63.7B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$36.0B</td>
                <td className="py-2 text-right font-bold text-emerald-400">+115%</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-[#f4f4f5]">Net income</td>
                <td className="py-2 text-right text-[#f4f4f5]">$65.3B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$59.7B</td>
                <td className="py-2 text-right text-[#a1a1aa]">$31.9B</td>
                <td className="py-2 text-right font-bold text-emerald-400">+105%</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-[#f4f4f5]">Diluted EPS</td>
                <td className="py-2 text-right text-[#f4f4f5]">$2.70</td>
                <td className="py-2 text-right text-[#a1a1aa]">$2.46</td>
                <td className="py-2 text-right text-[#a1a1aa]">$1.30</td>
                <td className="py-2 text-right font-bold text-emerald-400">+108%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Column Bottom: Key Stats, SEC EDGAR, and Tagged News from Page 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 font-mono">
        {/* Column 1: Key Stats */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-2 text-xs">
          <div className="pb-1.5 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">KEY STATS</div>
            <h3 className="font-bold text-[#f4f4f5]">Stats</h3>
          </div>
          <div className="flex justify-between py-1 border-b border-[#222226]/70">
            <span className="text-[#a1a1aa]">52-week high</span>
            <span className="text-[#f4f4f5] font-medium">{formatCurrency(quote.fifty_two_week_high || 243.37, stockCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#222226]/70">
            <span className="text-[#a1a1aa]">52-week low</span>
            <span className="text-[#f4f4f5] font-medium">{formatCurrency(quote.fifty_two_week_low || 124.50, stockCurrency)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#222226]/70">
            <span className="text-[#a1a1aa]">Q4 FY27 revenue guide</span>
            <span className="text-[#f4f4f5] font-medium">$130.0B ± 3%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#222226]/70">
            <span className="text-[#a1a1aa]">Quarterly dividend</span>
            <span className="text-[#f4f4f5] font-medium">$0.25</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#a1a1aa]">Beta (5Y monthly)</span>
            <span className="text-[#71717a]">—</span>
          </div>
        </div>

        {/* Column 2: SEC EDGAR Filings */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-2 text-xs">
          <div className="pb-1.5 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">SEC EDGAR</div>
            <h3 className="font-bold text-[#f4f4f5]">Filings</h3>
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex items-start justify-between p-2 rounded bg-[#141418] border border-[#222226]">
              <div>
                <span className="font-bold text-[#f4f4f5]">8-K</span>
                <span className="text-[10px] text-[#71717a] ml-2">17 NOV</span>
                <div className="text-[11px] text-[#f4f4f5] mt-0.5">Q3 FY27 results</div>
              </div>
            </div>
            <div className="flex items-start justify-between p-2 rounded bg-[#141418] border border-[#222226]">
              <div>
                <span className="font-bold text-[#a1a1aa]">10-Q</span>
                <div className="text-[11px] text-[#71717a] mt-0.5">Quarterly report (connect EDGAR)</div>
              </div>
            </div>
            <div className="flex items-start justify-between p-2 rounded bg-[#141418] border border-[#222226]">
              <div>
                <span className="font-bold text-[#a1a1aa]">4</span>
                <div className="text-[11px] text-[#71717a] mt-0.5">Insider trades (connect EDGAR)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Tagged News */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-2 text-xs">
          <div className="pb-1.5 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">NEWS / TAGGED {quote.ticker}</div>
            <h3 className="font-bold text-[#f4f4f5]">News</h3>
          </div>
          <div className="space-y-2.5 pt-1">
            <div className="border-b border-[#222226]/70 pb-2">
              <div className="text-[10px] text-[#71717a]">23 NOV · CNBC</div>
              <div className="text-xs font-semibold text-[#f4f4f5] hover:text-white transition-colors cursor-pointer mt-0.5">
                Nvidia reinstates Jensen Huang as CEO; shares jump about a third
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#71717a]">17 NOV · NVIDIA</div>
              <div className="text-xs font-semibold text-[#f4f4f5] hover:text-white transition-colors cursor-pointer mt-0.5">
                Q3 FY27 revenue $115.8B, up 103%; Q4 guide $130B
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
