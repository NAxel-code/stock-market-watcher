import { Suspense } from 'react'
import { StockDetailClient } from '@/components/features/StockDetailClient'
import { Skeleton } from '@/components/ui/skeleton'

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const { ticker } = await params
  const safeTicker = (ticker ?? '').toUpperCase()

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
          <Skeleton className="h-64 w-full rounded-xl bg-zinc-800" />
        </div>
      }
    >
      <StockDetailClient ticker={safeTicker} />
    </Suspense>
  )
}
