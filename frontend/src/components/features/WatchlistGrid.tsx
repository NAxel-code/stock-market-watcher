'use client'

import { useUIStore } from '@/stores/useUIStore'
import { useBatchQuotes } from '@/hooks/useBatchQuotes'
import { StockCard } from '@/components/features/StockCard'
import { toast } from 'sonner'

export function WatchlistGrid({ showRemove = false }: { showRemove?: boolean }) {
  const { watchlist, removeFromWatchlist } = useUIStore()
  const { data: quotes, isLoading } = useBatchQuotes(watchlist)

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {watchlist.map((ticker) => {
        const quote = quotes?.find((q) => q.ticker === ticker)
        return (
          <StockCard
            key={ticker}
            quote={quote}
            isLoading={isLoading}
            showRemove={showRemove}
            onRemove={handleRemove}
          />
        )
      })}
    </div>
  )
}
