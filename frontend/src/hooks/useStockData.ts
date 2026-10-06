import { useQuery } from '@tanstack/react-query'
import { fetchStockQuote } from '@/lib/api'
import { isMarketOpen } from '@/lib/formatters'
import type { StockQuote } from '@/types/stock'

export function useStockData(ticker: string) {
  return useQuery<StockQuote, Error>({
    queryKey: ['quote', ticker],
    queryFn: () => fetchStockQuote(ticker),
    refetchInterval: isMarketOpen() ? 60_000 : 15 * 60_000,
    staleTime: 30_000,
    enabled: Boolean(ticker),
    retry: 3,
  })
}
