'use client'

import { useStockData } from '@/hooks/useStockData'
import { useUIStore } from '@/stores/useUIStore'
import { PriceChart } from '@/components/features/PriceChart'
import { FiftyTwoWeekRangeBar } from '@/components/features/FiftyTwoWeekRangeBar'
import { IdxLotCalculator } from '@/components/features/IdxLotCalculator'
import { PriceAlertDialog } from '@/components/features/PriceAlertDialog'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, formatMarketCap, formatVolume, isIdxTicker } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Plus, Minus, ShieldAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export function StockDetailClient({ ticker }: { ticker: string }) {
  const { data: quote, isLoading, error } = useStockData(ticker)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useUIStore()
  const inWatchlist = isInWatchlist(ticker)
  const isIdx = isIdxTicker(ticker) || Boolean(quote?.is_idx)

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
    { label: 'Market Cap', value: formatMarketCap(quote.market_cap) },
    { label: 'Volume', value: quote.volume ? formatVolume(quote.volume) : 'N/A' },
    { label: '52W High', value: quote.fifty_two_week_high ? formatCurrency(quote.fifty_two_week_high, quote.currency) : 'N/A' },
    { label: '52W Low', value: quote.fifty_two_week_low ? formatCurrency(quote.fifty_two_week_low, quote.currency) : 'N/A' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold font-mono">{quote.ticker}</h1>
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
            currency={quote.currency}
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
          <div className="text-4xl font-bold font-mono">
            {formatCurrency(quote.current_price, quote.currency)}
          </div>
          <div className={cn('flex items-center gap-1.5 mt-1 text-lg font-medium', isPositive ? 'text-green-400' : 'text-red-400')}>
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {formatPercent(quote.change_percent)}
            <span className="text-sm">({isPositive ? '+' : ''}{formatCurrency(quote.change, quote.currency)})</span>
          </div>
          {quote.is_stale && <div className="text-xs text-amber-400 mt-1">⚠ Showing delayed data</div>}
        </div>

        {/* IDX Auto-Rejection limits (ARA / ARB) */}
        {isIdx && quote.ara_price && quote.arb_price && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 space-y-1 text-xs">
            <div className="flex items-center gap-1 text-zinc-400 font-semibold mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span>Batas Auto Rejection (IDX)</span>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-zinc-500">ARA (Atas): </span>
                <span className="font-mono font-semibold text-green-400">{formatCurrency(quote.ara_price, 'IDR')}</span>
              </div>
              <div>
                <span className="text-zinc-500">ARB (Bawah): </span>
                <span className="font-mono font-semibold text-red-400">{formatCurrency(quote.arb_price, 'IDR')}</span>
              </div>
              {quote.tick_size && (
                <div>
                  <span className="text-zinc-500">Fraksi: </span>
                  <span className="font-mono text-zinc-300">Rp {quote.tick_size}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bloomberg-Style 52-Week Range Bar */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <FiftyTwoWeekRangeBar
          low={quote.fifty_two_week_low}
          high={quote.fifty_two_week_high}
          current={quote.current_price}
          currency={quote.currency}
        />
      </div>

      {/* TradingView-Style Interactive Chart with Volume */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <PriceChart
          ticker={ticker}
          currency={quote.currency}
          previousClose={quote.previous_close}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
            <div className="font-mono font-medium">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* IDX Lot Transaction Calculator (Only for Indonesian Stocks) */}
      {isIdx && (
        <IdxLotCalculator
          currentPrice={quote.current_price}
          ticker={quote.ticker}
        />
      )}
    </div>
  )
}
