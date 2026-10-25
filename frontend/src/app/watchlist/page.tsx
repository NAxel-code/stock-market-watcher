import { WatchlistGrid } from '@/components/features/WatchlistGrid'
import { DenoisedCorrelationHeatmap } from '@/components/features/DenoisedCorrelationHeatmap'

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#161C26] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00E599]"></span>
          <h1 className="text-lg font-mono font-bold tracking-wider text-[#F0F4F8] uppercase">
            Personal Watchlist & Portfolio Desk
          </h1>
        </div>
        <p className="text-xs text-[#6F7887] font-mono mt-1">
          Track selected US & IDX equities, simulate market impact, and inspect RMT denoised correlation risks
        </p>
      </div>
      <WatchlistGrid showRemove />
      <DenoisedCorrelationHeatmap />
    </div>
  )
}
