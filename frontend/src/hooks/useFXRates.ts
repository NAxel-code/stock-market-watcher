import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchFXRates } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import type { FXRatesResponse } from '@/types/stock'

export function useFXRates() {
  const setFXRates = useUIStore((state) => state.setFXRates)

  const query = useQuery<FXRatesResponse, Error>({
    queryKey: ['market', 'fx'],
    queryFn: fetchFXRates,
    refetchInterval: 60_000,
    staleTime: 45_000,
    retry: 2,
  })

  useEffect(() => {
    if (query.data?.rates) {
      const rateMap: Record<string, number> = {}
      for (const item of query.data.rates) {
        rateMap[item.pair] = item.rate
      }
      setFXRates(rateMap)
    }
  }, [query.data, setFXRates])

  return query
}
