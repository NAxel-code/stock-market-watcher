import { useQuery } from '@tanstack/react-query'
import { fetchMarketsOverview } from '@/lib/api'
import type { MarketsOverviewResponse } from '@/types/stock'

export function useMarketsOverview() {
  return useQuery<MarketsOverviewResponse, Error>({
    queryKey: ['markets', 'overview'],
    queryFn: fetchMarketsOverview,
    refetchInterval: 45_000,
    staleTime: 30_000,
    retry: 2,
  })
}
