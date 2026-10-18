'use client'

import React, { useState, useMemo } from 'react'
import { useUIStore, DEFAULT_WATCHLIST } from '@/stores/useUIStore'
import { useBatchQuotes } from '@/hooks/useBatchQuotes'
import { StockCard } from '@/components/features/StockCard'
import { SectorFilterBar } from '@/components/features/SectorFilterBar'
import { isIdxTicker } from '@/lib/formatters'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function WatchlistGrid({ showRemove = false }: { showRemove?: boolean }) {
  const { watchlist, removeFromWatchlist, resetToDefaultWatchlist } = useUIStore()
  const { data: quotes, isLoading, isError, error, refetch } = useBatchQuotes(watchlist)
  const [activeFilter, setActiveFilter] = useState('ALL')

  const handleRemove = (ticker: string) => {
    removeFromWatchlist(ticker)
    toast.success(`${ticker} removed from watchlist`)
  }

  const handleResetDefaults = () => {
    resetToDefaultWatchlist()
    setActiveFilter('ALL')
    toast.success(`Watchlist restored to 32 top US & IDX bluechips`)
  }

  // Filter watchlist based on selected sector tab
  const filteredTickers = useMemo(() => {
    if (activeFilter === 'ALL') return watchlist

    return watchlist.filter((ticker) => {
      const quote = quotes?.find((q) => q.ticker.toUpperCase() === ticker.toUpperCase())
      const isIdx = isIdxTicker(ticker) || Boolean(quote?.is_idx)

      if (activeFilter === 'IDX') return isIdx
      if (activeFilter === 'US') return !isIdx

      if (activeFilter.startsWith('SEC:')) {
        const targetSector = activeFilter.slice(4).trim().toLowerCase()
        const currentSector = quote?.sector?.trim().toLowerCase()
        return currentSector === targetSector
      }

      return true
    })
  }, [watchlist, quotes, activeFilter])

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500 space-y-3">
        <p className="text-lg">Your watchlist is currently empty.</p>
        <p className="text-sm">Use ⌘K search or click below to load featured stocks.</p>
        <button
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Load 32 Featured Stocks (US & IDX)
        </button>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-zinc-900/60 p-6 text-center space-y-3">
        <p className="text-sm text-red-400 font-medium">
          Failed to load market data {error?.message ? `(${error.message})` : ''}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const isCustomWatchlist = watchlist.length !== DEFAULT_WATCHLIST.length

  return (
    <div className="space-y-4">
      {/* Sector & Market Filter Bar */}
      <div id="tour-sector-filter" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <SectorFilterBar
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            quotes={quotes}
          />
        </div>

        {/* Watchlist Counter & Reset Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pb-2 text-xs text-zinc-400">
          <span className="font-mono tabular-nums text-[11px]">
            {filteredTickers.length} / {watchlist.length} Stocks
          </span>
          {isCustomWatchlist && (
            <button
              onClick={handleResetDefaults}
              title="Reset to 32 featured US & IDX stocks"
              className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-zinc-100 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 px-2.5 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid or Empty Filter Result */}
      {filteredTickers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-2">
          <p className="text-sm text-zinc-400">No stocks match the selected filter.</p>
          <button
            onClick={() => setActiveFilter('ALL')}
            className="text-xs text-blue-400 hover:underline"
          >
            Show All Stocks
          </button>
        </div>
      ) : (
        <div id="tour-stock-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTickers.map((ticker) => {
            const quote = quotes?.find((q) => q.ticker.toUpperCase() === ticker.toUpperCase())
            return (
              <StockCard
                key={ticker}
                quote={quote}
                isLoading={isLoading || (!quotes && !isError)}
                showRemove={showRemove}
                onRemove={handleRemove}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
