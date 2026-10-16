'use client'

import React from 'react'
import { formatCurrency } from '@/lib/formatters'

interface FiftyTwoWeekRangeBarProps {
  low?: number
  high?: number
  current: number
  currency?: string
}

export function FiftyTwoWeekRangeBar({ low, high, current, currency = 'USD' }: FiftyTwoWeekRangeBarProps) {
  if (!low || !high || high <= low) {
    return null
  }

  const rawPercent = ((current - low) / (high - low)) * 100
  const clampedPercent = Math.max(0, Math.min(100, rawPercent))

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span>52W Low: <strong className="text-zinc-100 font-mono tabular-nums font-semibold">{formatCurrency(low, currency)}</strong></span>
        <span className="text-zinc-400 tabular-nums font-medium">52W Range ({clampedPercent.toFixed(0)}%)</span>
        <span>52W High: <strong className="text-zinc-100 font-mono tabular-nums font-semibold">{formatCurrency(high, currency)}</strong></span>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-zinc-950 border border-zinc-800/80 overflow-hidden">
        {/* Fill track */}
        <div
          className="h-full bg-gradient-to-r from-rose-500/70 via-amber-500/70 to-emerald-500/70 rounded-full opacity-80"
          style={{ width: '100%' }}
        />
        {/* Pin marker */}
        <div
          className="absolute top-0 bottom-0 w-2.5 bg-zinc-100 rounded-full border border-zinc-950 shadow-sm -ml-1 transition-all duration-300"
          style={{ left: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
}
