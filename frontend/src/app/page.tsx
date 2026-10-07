import { Suspense } from 'react'
import { MarketSummary } from '@/components/features/MarketSummary'
import { WatchlistGrid } from '@/components/features/WatchlistGrid'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Market Summary Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-300">Ringkasan Pasar Utama</h2>
          <span className="text-xs font-mono text-zinc-500 hidden sm:inline">Indeks Global & IDX</span>
        </div>
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
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-300">Daftar Pantauan Saham Unggulan</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Top 25% saham teraktif dan berkapitalisasi terbesar di bursa US & Indonesia (BEI)</p>
        </div>
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
