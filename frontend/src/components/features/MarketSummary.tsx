'use client'

import Link from 'next/link'
import { useMarketSummary } from '@/hooks/useMarketSummary'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function MarketSummary() {
  const { data, isLoading, error } = useMarketSummary()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 border border-red-900 rounded-xl p-4">
        Failed to load market data. {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Primary Indices (US + IDX) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data?.indices.map((index) => {
          const isPositive = index.change_percent >= 0
          return (
            <div
              key={index.ticker}
              className={cn(
                'rounded-xl border p-4 bg-zinc-900 transition-colors',
                isPositive ? 'border-green-900/50' : 'border-red-900/50'
              )}
            >
              <div className="text-xs text-zinc-400 mb-1">{index.name}</div>
              <div className="text-xl font-bold font-mono">
                {formatCurrency(index.current_price)}
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatPercent(index.change_percent)}
              </div>
              {index.is_stale && <div className="text-[10px] text-amber-400 mt-1">Delayed data</div>}
            </div>
          )
        })}
      </div>

      {/* Top Movers (Google Finance / Bloomberg Style) */}
      {data && (data.top_gainers.length > 0 || data.top_losers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Gainers */}
          {data.top_gainers.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 mb-3">
                <Flame className="h-3.5 w-3.5" />
                <span>Top Gainers Hari Ini</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_gainers.map((mover) => (
                  <Link
                    key={mover.ticker}
                    href={`/stocks/${mover.ticker}`}
                    className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/60 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs">{mover.ticker}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {formatCurrency(mover.current_price)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-400">
                      +{mover.change_percent.toFixed(2)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {data.top_losers.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-3">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Top Losers Hari Ini</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_losers.map((mover) => (
                  <Link
                    key={mover.ticker}
                    href={`/stocks/${mover.ticker}`}
                    className="p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/60 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs">{mover.ticker}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {formatCurrency(mover.current_price)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-red-400">
                      {mover.change_percent.toFixed(2)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
