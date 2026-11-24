'use client'

import React, { useMemo } from 'react'
import { formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { HistoryPoint } from '@/types/stock'

interface MultiHorizonReturnsProps {
  currentPrice: number
  dayChangePercent?: number
  history1y?: HistoryPoint[]
  sparkline7d?: number[]
}

export function MultiHorizonReturns({
  currentPrice,
  dayChangePercent = 0,
  history1y = [],
  sparkline7d,
}: MultiHorizonReturnsProps) {
  const returns = useMemo(() => {
    const res: { label: string; period: string; change: number | null }[] = [
      { label: '24 Hours', period: '1D', change: dayChangePercent },
      { label: '7 Days', period: '7D', change: null },
      { label: '30 Days', period: '1M', change: null },
      { label: '1 Year', period: '1Y', change: null },
    ]

    const n = history1y?.length || 0

    // 7 days ago: prefer sparkline_7d if available, else 5 bars back
    if (sparkline7d && sparkline7d.length >= 2 && sparkline7d[0] > 0) {
      const pFirst = sparkline7d[0]
      const pLast = currentPrice || sparkline7d[sparkline7d.length - 1]
      res[1].change = Number((((pLast - pFirst) / pFirst) * 100).toFixed(2))
    } else if (n >= 5) {
      const p7d = history1y[Math.max(0, n - 5)].close
      if (p7d > 0) res[1].change = Number((((currentPrice - p7d) / p7d) * 100).toFixed(2))
    }

    if (n > 0 && currentPrice > 0) {
      // 30 days ago (approx 21 trading days, or ~4 weekly bars)
      if (n >= 21) {
        const p30d = history1y[Math.max(0, n - 21)].close
        if (p30d > 0) res[2].change = Number((((currentPrice - p30d) / p30d) * 100).toFixed(2))
      } else if (n >= 4) {
        const p30d = history1y[Math.max(0, n - 4)].close
        if (p30d > 0) res[2].change = Number((((currentPrice - p30d) / p30d) * 100).toFixed(2))
      }

      // 1 year ago (oldest bar in 1Y dataset)
      if (n >= 30) {
        const p1y = history1y[0].close
        if (p1y > 0) res[3].change = Number((((currentPrice - p1y) / p1y) * 100).toFixed(2))
      }
    }

    return res
  }, [currentPrice, dayChangePercent, history1y, sparkline7d])

  return (
    <div className="rounded-xl border border-zinc-800/90 border-t-zinc-700/50 bg-zinc-900/70 p-4 space-y-2">
      <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
        Multi-Horizon Performance
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {returns.map((item) => {
          const val = item.change
          const hasVal = val !== null && !isNaN(val)
          const isPos = hasVal && val >= 0

          return (
            <div
              key={item.period}
              className={cn(
                'rounded-lg p-2.5 text-center transition-colors border',
                !hasVal
                  ? 'bg-zinc-950/70 border-zinc-800/80'
                  : isPos
                  ? 'bg-emerald-950/20 border-emerald-900/40'
                  : 'bg-rose-950/20 border-rose-900/40'
              )}
            >
              <div className="text-[11px] text-zinc-400 font-medium">
                {item.label} ({item.period})
              </div>
              <div
                className={cn(
                  'font-mono text-sm font-bold tabular-nums mt-0.5',
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
