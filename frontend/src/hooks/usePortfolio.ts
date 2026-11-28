import { useQuery } from '@tanstack/react-query'
import { fetchPortfolioAnalysis } from '@/lib/api'
import type { PortfolioAnalysisResponse } from '@/types/stock'

export function usePortfolio(baseCurrency: string = 'SGD') {
  return useQuery<PortfolioAnalysisResponse, Error>({
    queryKey: ['portfolio', 'analyze', baseCurrency],
    queryFn: () => fetchPortfolioAnalysis(baseCurrency),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  })
}
