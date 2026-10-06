import { useQuery } from '@tanstack/react-query'
import { fetchBatchQuotes } from '@/lib/api'
import { isMarketOpen } from '@/lib/formatters'
import type { StockQuote } from '@/types/stock'

export function useBatchQuotes(tickers: string[]) {
  return useQuery<StockQuote[], Error>({
    queryKey: ['batch', tickers.join(',')],
    queryFn: () => fetchBatchQuotes(tickers),
    refetchInterval: isMarketOpen() ? 60_000 : 15 * 60_000,
    staleTime: 30_000,
    enabled: tickers.length > 0,
    retry: 2,
  })
}
