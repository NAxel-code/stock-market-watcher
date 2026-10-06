import { useQuery } from '@tanstack/react-query'
import { fetchMarketSummary } from '@/lib/api'
import { isMarketOpen } from '@/lib/formatters'
import type { MarketSummary } from '@/types/stock'

export function useMarketSummary() {
  return useQuery<MarketSummary, Error>({
    queryKey: ['market', 'summary'],
    queryFn: fetchMarketSummary,
    refetchInterval: isMarketOpen() ? 60_000 : 15 * 60_000,
    staleTime: 30_000,
    retry: 3,
  })
}
