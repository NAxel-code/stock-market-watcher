import { useQuery } from '@tanstack/react-query'
import { fetchStockDesk } from '@/lib/api'
import type { StockDeskResponse } from '@/types/stock'

export function useStockDesk(ticker: string) {
  return useQuery<StockDeskResponse, Error>({
    queryKey: ['stock-desk', ticker],
    queryFn: () => fetchStockDesk(ticker),
    staleTime: 5 * 60_000, // 5 minutes cache
    enabled: Boolean(ticker),
    retry: 2,
  })
}
