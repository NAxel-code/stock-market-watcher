'use client'

import { useUIStore } from '@/stores/useUIStore'
import { useBatchQuotes } from '@/hooks/useBatchQuotes'
import { StockCard } from '@/components/features/StockCard'
import { toast } from 'sonner'

export function WatchlistGrid({ showRemove = false }: { showRemove?: boolean }) {
  const { watchlist, removeFromWatchlist } = useUIStore()
  const { data: quotes, isLoading, isError, error, refetch } = useBatchQuotes(watchlist)

  const handleRemove = (ticker: string) => {
    removeFromWatchlist(ticker)
    toast.success(`${ticker} removed from watchlist`)
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-lg">Your watchlist is empty.</p>
        <p className="text-sm mt-1">Search for stocks with ⌘K to get started.</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-zinc-900/60 p-6 text-center space-y-3">
        <p className="text-sm text-red-400 font-medium">
          Gagal memuat data pasar {error?.message ? `(${error.message})` : ''}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors"
        >
          Muat Ulang (Retry)
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {watchlist.map((ticker) => {
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
  )
}
