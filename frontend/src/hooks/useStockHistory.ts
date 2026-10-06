import { useQuery } from '@tanstack/react-query'
import { fetchStockHistory } from '@/lib/api'
import type { Period, StockHistory } from '@/types/stock'

export function useStockHistory(ticker: string, period: Period) {
  return useQuery<StockHistory, Error>({
    queryKey: ['history', ticker, period],
    queryFn: () => fetchStockHistory(ticker, period),
    staleTime: period === '1d' ? 60_000 : 60 * 60_000,
    enabled: Boolean(ticker),
    retry: 2,
  })
}
