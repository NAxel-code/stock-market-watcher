import { TerminalWatchlist } from '@/components/features/TerminalWatchlist'
import { DenoisedCorrelationHeatmap } from '@/components/features/DenoisedCorrelationHeatmap'

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <TerminalWatchlist />
      <div className="pt-2 border-t border-[#222226]">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a1a1aa]" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-[#a1a1aa] uppercase">
            Quant Telemetry · Denoised Correlation Matrix (RMT)
          </h2>
        </div>
        <DenoisedCorrelationHeatmap />
      </div>
    </div>
  )
}
