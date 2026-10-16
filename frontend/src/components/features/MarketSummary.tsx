'use client'

import Link from 'next/link'
import { useMarketSummary } from '@/hooks/useMarketSummary'
import { formatCurrency, formatIndexPoints, formatPercent, getStockCurrency, isIdxTicker } from '@/lib/formatters'
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
          const isIdx = isIdxTicker(index.ticker) || index.ticker.includes('JK')
          return (
            <div
              key={index.ticker}
              className={cn(
                'rounded-xl border p-4 bg-zinc-900/90 transition-all duration-150 hover:-translate-y-0.5 border-t-zinc-700/50',
                isPositive ? 'border-emerald-900/40 hover:border-emerald-800/60' : 'border-rose-900/40 hover:border-rose-800/60'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-300 font-medium">{index.name}</span>
                <span className={cn(
                  "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border",
                  isIdx
                    ? "text-emerald-400 bg-emerald-950/60 border-emerald-900/60"
                    : "text-blue-400 bg-blue-950/60 border-blue-900/60"
                )}>
                  {isIdx ? 'IDX' : 'US'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums tracking-tight text-zinc-100">
                  {formatIndexPoints(index.current_price)}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 font-medium uppercase">pts</span>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-sm font-semibold tabular-nums mt-0.5',
                  isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatPercent(index.change_percent)}
              </div>
              {index.is_stale && (
                <div className="text-[10px] text-amber-400 font-mono mt-1.5 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Delayed data</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Top Movers (Google Finance / Bloomberg Style) */}
      {data && (data.top_gainers.length > 0 || data.top_losers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Gainers */}
          {data.top_gainers.length > 0 && (
            <div className="rounded-xl border border-zinc-800/90 border-t-zinc-700/50 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Top Gainers Hari Ini</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Bursa US & IDX</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_gainers.map((mover) => {
                  const moverCurrency = getStockCurrency(mover)
                  return (
                    <Link
                      key={mover.ticker}
                      href={`/stocks/${mover.ticker}`}
                      className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/90 border border-zinc-800/70 hover:border-zinc-700 transition-all duration-150 flex justify-between items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-xs text-zinc-100">{mover.ticker}</span>
                          <span className={cn(
                            "text-[9px] font-mono font-bold px-1 py-0.2 rounded border",
                            moverCurrency === 'IDR'
                              ? "text-emerald-400 bg-emerald-950/60 border-emerald-900/60"
                              : "text-blue-400 bg-blue-950/60 border-blue-900/60"
                          )}>
                            {moverCurrency}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-300 font-mono tabular-nums mt-0.5">
                          {formatCurrency(mover.current_price, moverCurrency)}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold tabular-nums text-green-400">
                        +{mover.change_percent.toFixed(2)}%
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {data.top_losers.length > 0 && (
            <div className="rounded-xl border border-zinc-800/90 border-t-zinc-700/50 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Top Losers Hari Ini</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Bursa US & IDX</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_losers.map((mover) => {
                  const moverCurrency = getStockCurrency(mover)
                  return (
                    <Link
                      key={mover.ticker}
                      href={`/stocks/${mover.ticker}`}
                      className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/90 border border-zinc-800/70 hover:border-zinc-700 transition-all duration-150 flex justify-between items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-xs text-zinc-100">{mover.ticker}</span>
                          <span className={cn(
                            "text-[9px] font-mono font-bold px-1 py-0.2 rounded border",
                            moverCurrency === 'IDR'
                              ? "text-emerald-400 bg-emerald-950/60 border-emerald-900/60"
                              : "text-blue-400 bg-blue-950/60 border-blue-900/60"
                          )}>
                            {moverCurrency}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-300 font-mono tabular-nums mt-0.5">
                          {formatCurrency(mover.current_price, moverCurrency)}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold tabular-nums text-red-400">
                        {mover.change_percent.toFixed(2)}%
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
