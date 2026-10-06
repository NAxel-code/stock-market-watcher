'use client'

import React, { useMemo } from 'react'
import { formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { HistoryPoint } from '@/types/stock'

interface MultiHorizonReturnsProps {
  currentPrice: number
  dayChangePercent?: number
  history1y?: HistoryPoint[]
}

export function MultiHorizonReturns({
  currentPrice,
  dayChangePercent = 0,
  history1y = [],
}: MultiHorizonReturnsProps) {
  const returns = useMemo(() => {
    const res: { label: string; period: string; change: number | null }[] = [
      { label: '24 Jam', period: '1D', change: dayChangePercent },
      { label: '7 Hari', period: '7D', change: null },
      { label: '30 Hari', period: '1M', change: null },
      { label: '1 Tahun', period: '1Y', change: null },
    ]

    if (!history1y || history1y.length === 0 || !currentPrice) {
      return res
    }

    const n = history1y.length
    // 7 days ago (approx 5 trading days)
    if (n >= 5) {
      const p7d = history1y[Math.max(0, n - 5)].close
      if (p7d > 0) res[1].change = Number((((currentPrice - p7d) / p7d) * 100).toFixed(2))
    }

    // 30 days ago (approx 21 trading days)
    if (n >= 21) {
      const p30d = history1y[Math.max(0, n - 21)].close
      if (p30d > 0) res[2].change = Number((((currentPrice - p30d) / p30d) * 100).toFixed(2))
    }

    // 1 year ago (start of 1y history)
    if (n >= 50) {
      const p1y = history1y[0].close
      if (p1y > 0) res[3].change = Number((((currentPrice - p1y) / p1y) * 100).toFixed(2))
    }

    return res
  }, [currentPrice, dayChangePercent, history1y])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Kinerja Multi-Periode (CoinGecko Returns Grid)
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {returns.map((item) => {
          const val = item.change
          const hasVal = val !== null && !isNaN(val)
          const isPos = hasVal && val >= 0

          return (
            <div
              key={item.period}
              className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 text-center transition-colors"
            >
              <div className="text-[11px] text-zinc-500 font-medium">
                {item.label} ({item.period})
              </div>
              <div
                className={cn(
                  'font-mono text-sm font-bold mt-0.5',
                  !hasVal ? 'text-zinc-500' : isPos ? 'text-green-400' : 'text-red-400'
                )}
              >
                {hasVal ? formatPercent(val) : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
