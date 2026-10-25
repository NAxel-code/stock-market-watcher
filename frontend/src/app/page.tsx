import { Suspense } from 'react'
import { MarketSummary } from '@/components/features/MarketSummary'
import { WatchlistGrid } from '@/components/features/WatchlistGrid'
import { OnboardingBanner } from '@/components/features/OnboardingBanner'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Onboarding / Tutorial Banner */}
      <OnboardingBanner />

      {/* Market Summary Section */}
      <section id="tour-market-summary">
        <div className="flex items-center justify-between mb-3 border-b border-[#161C26] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]"></span>
            <h2 className="text-sm font-mono font-bold tracking-wider text-[#F0F4F8] uppercase">
              Global & IDX Benchmark Overview
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#6F7887] hidden sm:inline">LIVE TELEMETRY</span>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg bg-[#0D0F14] border border-[#161C26]" />
            ))}
          </div>
        }>
          <MarketSummary />
        </Suspense>
      </section>

      {/* Watchlist Section */}
      <section id="tour-watchlist-grid">
        <div className="flex items-center justify-between mb-3 border-b border-[#161C26] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B2FF]"></span>
            <h2 className="text-sm font-mono font-bold tracking-wider text-[#F0F4F8] uppercase">
              Active Equities Universe
            </h2>
          </div>
          <p className="text-[11px] font-mono text-[#6F7887]">TOP BLUECHIPS (US & IDX)</p>
        </div>
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg bg-[#0D0F14] border border-[#161C26]" />
            ))}
          </div>
        }>
          <WatchlistGrid />
        </Suspense>
      </section>
    </div>
  )
}
