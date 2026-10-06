import { Suspense } from 'react'
import { StockDetailClient } from '@/components/features/StockDetailClient'
import { Skeleton } from '@/components/ui/skeleton'

export default function StockDetailPage({ params }: { params: { ticker: string } }) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
      </div>
    }>
      <StockDetailClient ticker={params.ticker.toUpperCase()} />
    </Suspense>
  )
}
