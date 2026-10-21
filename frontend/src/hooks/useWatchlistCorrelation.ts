import { useQuery } from '@tanstack/react-query'
import { fetchWatchlistCorrelation } from '@/lib/api'
import type { WatchlistCorrelationResponse } from '@/types/stock'

export function useWatchlistCorrelation(tickers: string[], enabled: boolean = true) {
  return useQuery<WatchlistCorrelationResponse, Error>({
    queryKey: ['watchlist-correlation', tickers],
    queryFn: () => fetchWatchlistCorrelation(tickers),
    staleTime: 5 * 60_000,
    enabled: enabled && tickers.length >= 2,
    retry: 1,
  })
}
