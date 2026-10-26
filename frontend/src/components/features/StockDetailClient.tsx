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
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Plus, Minus, ShieldAlert, Compass, BarChart2, Calculator, Landmark } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export function StockDetailClient({ ticker }: { ticker: string }) {
  const [activeTab, setActiveTab] = useState<'desk' | 'chart' | 'simulator' | 'calculator'>('desk')
  const { data: quote, isLoading, error } = useStockData(ticker)
  const { data: history1y } = useStockHistory(ticker, '1y')
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useUIStore()
  const inWatchlist = isInWatchlist(ticker)
  const isIdx = isIdxTicker(ticker) || Boolean(quote?.is_idx)
  const stockCurrency = quote ? getStockCurrency(quote) : (isIdx ? 'IDR' : 'USD')

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold font-mono">{quote.ticker}</h1>
            {quote.sector && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80">
                {quote.sector}
              </span>
            )}
            {isIdx && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                IDX (BEI)
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm mt-0.5">{quote.company_name}</p>
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
            className={cn(inWatchlist && 'border-zinc-700')}
            aria-label={inWatchlist ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
          >
            {inWatchlist ? <><Minus className="h-4 w-4 mr-1" /> Remove</> : <><Plus className="h-4 w-4 mr-1" /> Add to Watchlist</>}
          </Button>
        </div>
      </div>

      {/* Price & Auto Rejection Bands */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <div className="text-4xl font-bold font-mono tabular-nums tracking-tight text-[#F0F4F8]">
              {formatCurrency(quote.current_price, stockCurrency)}
            </div>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded border font-mono tracking-wider uppercase',
                stockCurrency === 'IDR'
                  ? 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30'
                  : 'bg-[#00B2FF]/10 text-[#00B2FF] border-[#00B2FF]/30'
              )}
              title={`Currency: ${stockCurrency === 'IDR' ? 'Indonesian Rupiah' : 'US Dollar'}`}
            >
              {stockCurrency}
            </span>
          </div>
          <div className="text-[11px] text-[#6F7887] font-mono mt-1">
            DENOMINATION: <span className="text-[#8C96A5]">{stockCurrency === 'IDR' ? 'Indonesian Rupiah (IDR / Rp)' : 'US Dollar (USD / $)'}</span>
          </div>
          <div className={cn('flex items-center gap-1.5 mt-1 text-base font-mono font-bold tabular-nums', isPositive ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatPercent(quote.change_percent)}
            <span className="text-xs font-normal text-[#6F7887]">({isPositive ? '+' : ''}{formatCurrency(quote.change, stockCurrency)})</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null && (
              <span className="text-[11px] text-[#6F7887] font-mono">
                From 52W High:{' '}
                <span className={quote.distance_from_52w_high < 0 ? 'text-[#FF3B56] font-mono font-semibold tabular-nums' : 'text-[#00E599] font-mono font-semibold tabular-nums'}>
                  {quote.distance_from_52w_high > 0 ? `+${quote.distance_from_52w_high}%` : `${quote.distance_from_52w_high}%`}
                </span>
              </span>
            )}
            {quote.is_stale && (
              <div className="text-[10px] text-[#FFB800] font-mono flex items-center gap-1 bg-[#FFB800]/10 border border-[#FFB800]/30 px-1.5 py-0.5 rounded">
                ⚠ Delayed feed
              </div>
            )}
          </div>
        </div>

        {/* IDX Auto-Rejection limits (ARA / ARB) */}
        {isIdx && quote.ara_price && quote.arb_price && (
          <div className="rounded-md border border-[#161C26] bg-[#0D0F14] p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1 text-[#F0F4F8] font-mono font-bold text-[11px] uppercase tracking-wider mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-[#FFB800]" />
              <span>Auto Rejection Limits (IDX)</span>
            </div>
            <div className="flex gap-4 font-mono text-[11px]">
              <div>
                <span className="text-[#6F7887]">ARA (Upper): </span>
                <span className="font-semibold tabular-nums text-[#00E599]">{formatCurrency(quote.ara_price, 'IDR')}</span>
              </div>
              <div>
                <span className="text-[#6F7887]">ARB (Lower): </span>
                <span className="font-semibold tabular-nums text-[#FF3B56]">{formatCurrency(quote.arb_price, 'IDR')}</span>
              </div>
              {quote.tick_size && (
                <div>
                  <span className="text-[#6F7887]">Tick: </span>
                  <span className="tabular-nums text-[#F0F4F8]">Rp {quote.tick_size}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#0D0F14] rounded-md border border-[#161C26] w-fit">
        <button
          onClick={() => setActiveTab('desk')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'desk'
              ? 'bg-[#121620] text-[#00E599] border border-[#00E599]/30 shadow-xs'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          <Compass className="h-3.5 w-3.5 text-[#00E599]" />
          <span>Technical Desk</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
            PRO
          </span>
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'chart'
              ? 'bg-[#121620] text-[#00B2FF] border border-[#00B2FF]/30 shadow-xs'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          <BarChart2 className="h-3.5 w-3.5 text-[#00B2FF]" />
          <span>Interactive Chart</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
            activeTab === 'simulator'
              ? 'bg-[#121620] text-[#00E599] border border-[#00E599]/30 shadow-xs'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          <Landmark className="h-3.5 w-3.5 text-[#00E599]" />
          <span>Paper Trading</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
            SIM
          </span>
        </button>
        {isIdx && (
          <button
            onClick={() => setActiveTab('calculator')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer',
              activeTab === 'calculator'
                ? 'bg-[#121620] text-[#FFB800] border border-[#FFB800]/30 shadow-xs'
                : 'text-[#6F7887] hover:text-[#F0F4F8]'
            )}
          >
            <Calculator className="h-3.5 w-3.5 text-[#FFB800]" />
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
        />
      )}

      {/* Tab Content: Interactive Chart & Stats */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Bloomberg-Style 52-Week Range Bar */}
          <div className="rounded-lg border border-[#161C26] bg-[#0D0F14] p-4">
            <FiftyTwoWeekRangeBar
              low={quote.fifty_two_week_low}
              high={quote.fifty_two_week_high}
              current={quote.current_price}
              currency={stockCurrency}
            />
          </div>

          {/* Multi-Horizon Returns Matrix (CoinGecko Style) */}
          <MultiHorizonReturns
            currentPrice={quote.current_price}
            dayChangePercent={quote.change_percent}
            history1y={history1y?.data}
          />

          {/* TradingView-Style Interactive Chart with Volume */}
          <div className="rounded-lg border border-[#161C26] bg-[#0D0F14] p-4">
            <PriceChart
              ticker={ticker}
              currency={stockCurrency}
              previousClose={quote.previous_close}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-[#161C26] bg-[#07080A] p-3.5">
                <div className="text-[11px] font-mono text-[#6F7887] uppercase mb-1">{stat.label}</div>
                <div className="font-mono font-bold tabular-nums text-sm text-[#F0F4F8]">{stat.value}</div>
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
    </div>
  )
}
