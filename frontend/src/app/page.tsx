import { Suspense } from 'react'
import { TerminalDashboard } from '@/components/features/TerminalDashboard'

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-[#0f0f12] rounded border border-[#222226]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-[#0f0f12] rounded border border-[#222226]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 bg-[#0f0f12] rounded border border-[#222226]" />
              ))}
            </div>
          </div>
        }
      >
        <TerminalDashboard />
      </Suspense>
    </div>
  )
}
