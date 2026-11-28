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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {data?.indices.map((index) => {
          const isPositive = index.change_percent >= 0
          const isIdx = isIdxTicker(index.ticker) || index.ticker.includes('JK')
          return (
            <div
              key={index.ticker}
              className="rounded-md border border-[#222226] p-3.5 bg-[#0f0f12] transition-all duration-200 hover:border-[#3f3f46] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#a1a1aa] font-medium tracking-tight group-hover:text-white transition-colors">
                  {index.name}
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#27272a] bg-[#141418] text-[#a1a1aa] uppercase tracking-wider">
                  {isIdx ? 'IDX' : 'US'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono tabular-nums tracking-tight text-[#f4f4f5]">
                  {formatIndexPoints(index.current_price)}
                </span>
                <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase">pts</span>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-mono font-semibold tabular-nums mt-1',
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(index.change_percent)}
              </div>
              {index.is_stale && (
                <div className="text-[9px] text-amber-400 font-mono mt-1.5 flex items-center gap-1">
                  <span className="inline-block h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
                  <span>Delayed feed</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Top Movers (Minimalist Obsidian Style) */}
      {data && (data.top_gainers.length > 0 || data.top_losers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Gainers */}
          {data.top_gainers.length > 0 && (
            <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
              <div className="flex items-center justify-between mb-3 border-b border-[#222226] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Market Movers // Top Gainers</span>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono">US & IDX SESSIONS</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_gainers.map((mover) => {
                  const moverCurrency = getStockCurrency(mover)
                  return (
                    <Link
                      key={mover.ticker}
                      href={`/stocks/${mover.ticker}`}
                      className="p-2.5 rounded-md bg-[#141418] hover:bg-[#18181b] border border-[#222226] hover:border-[#3f3f46] transition-all flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#f4f4f5] group-hover:text-white">{mover.ticker}</span>
                          <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded border border-[#27272a] bg-[#09090b] text-[#a1a1aa]">
                            {moverCurrency}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#a1a1aa] font-mono tabular-nums mt-0.5">
                          {formatCurrency(mover.current_price, moverCurrency)}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold tabular-nums text-emerald-400">
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
            <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
              <div className="flex items-center justify-between mb-3 border-b border-[#222226] pb-2">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span>Market Movers // Top Losers</span>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono">US & IDX SESSIONS</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data.top_losers.map((mover) => {
                  const moverCurrency = getStockCurrency(mover)
                  return (
                    <Link
                      key={mover.ticker}
                      href={`/stocks/${mover.ticker}`}
                      className="p-2.5 rounded-md bg-[#141418] hover:bg-[#18181b] border border-[#222226] hover:border-[#3f3f46] transition-all flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[#f4f4f5] group-hover:text-white">{mover.ticker}</span>
                          <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded border border-[#27272a] bg-[#09090b] text-[#a1a1aa]">
                            {moverCurrency}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#a1a1aa] font-mono tabular-nums mt-0.5">
                          {formatCurrency(mover.current_price, moverCurrency)}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold tabular-nums text-red-400">
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
