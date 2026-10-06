import { Suspense } from 'react'
import { MarketSummary } from '@/components/features/MarketSummary'
import { WatchlistGrid } from '@/components/features/WatchlistGrid'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Market Summary Section */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-400 mb-3">Market Overview</h2>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl bg-zinc-800" />
            ))}
          </div>
        }>
          <MarketSummary />
        </Suspense>
      </section>

      {/* Watchlist Section */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-400 mb-3">Your Watchlist</h2>
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl bg-zinc-800" />
            ))}
          </div>
        }>
          <WatchlistGrid />
        </Suspense>
      </section>
    </div>
  )
}
