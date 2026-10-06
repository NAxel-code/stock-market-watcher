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
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>52W Low: <strong className="text-zinc-200 font-mono">{formatCurrency(low, currency)}</strong></span>
        <span>52W Range ({clampedPercent.toFixed(0)}%)</span>
        <span>52W High: <strong className="text-zinc-200 font-mono">{formatCurrency(high, currency)}</strong></span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        {/* Fill track */}
        <div
          className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full opacity-60"
          style={{ width: '100%' }}
        />
        {/* Pin marker */}
        <div
          className="absolute top-0 bottom-0 w-2.5 bg-blue-400 rounded-full border border-white shadow-sm -ml-1 transition-all duration-300"
          style={{ left: `${clampedPercent}%` }}
        />
      </div>
    </div>
  )
}
