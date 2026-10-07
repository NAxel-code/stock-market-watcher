'use client'

import React, { useMemo } from 'react'
import { isIdxTicker } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { StockQuote } from '@/types/stock'

export interface SectorFilterBarProps {
  activeFilter: string
  onSelectFilter: (filterId: string) => void
  quotes?: StockQuote[]
  className?: string
}

interface FilterTab {
  id: string
  label: string
  count: number
  avgChange: number | null
}

export function SectorFilterBar({
  activeFilter,
  onSelectFilter,
  quotes = [],
  className = '',
}: SectorFilterBarProps) {
  const tabs = useMemo<FilterTab[]>(() => {
    if (!quotes || quotes.length === 0) {
      return [{ id: 'ALL', label: 'Semua', count: 0, avgChange: null }]
    }

    // Helper to calculate average change percentage
    const calcAvg = (items: StockQuote[]): number | null => {
      const valid = items.filter((q) => q.change_percent !== undefined && q.change_percent !== null)
      if (valid.length === 0) return null
      const total = valid.reduce((sum, q) => sum + q.change_percent, 0)
      return Number((total / valid.length).toFixed(2))
    }

    // Market segments
    const idxQuotes = quotes.filter((q) => isIdxTicker(q.ticker) || Boolean(q.is_idx))
    const usQuotes = quotes.filter((q) => !isIdxTicker(q.ticker) && !q.is_idx)

    // Sector mapping
    const sectorMap = new Map<string, StockQuote[]>()
    quotes.forEach((q) => {
      const sec = q.sector?.trim() || 'Lainnya'
      const existing = sectorMap.get(sec) || []
      existing.push(q)
      sectorMap.set(sec, existing)
    })

    const result: FilterTab[] = [
      {
        id: 'ALL',
        label: 'Semua',
        count: quotes.length,
        avgChange: calcAvg(quotes),
      },
      {
        id: 'IDX',
        label: 'IDX (BEI)',
        count: idxQuotes.length,
        avgChange: calcAvg(idxQuotes),
      },
      {
        id: 'US',
        label: 'US Market',
        count: usQuotes.length,
        avgChange: calcAvg(usQuotes),
      },
    ]

    // Sort individual sectors by stock count descending
    Array.from(sectorMap.entries())
      .filter(([sec, items]) => sec !== 'Lainnya' && items.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([sec, items]) => {
        result.push({
          id: `SEC:${sec}`,
          label: sec,
          count: items.length,
          avgChange: calcAvg(items),
        })
      })

    return result
  }, [quotes])

  return (
    <div
      data-testid="sector-filter-bar"
      className={cn('flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none', className)}
      role="tablist"
      aria-label="Filter saham berdasarkan sektor atau pasar"
    >
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id
        const hasAvg = tab.avgChange !== null && !isNaN(tab.avgChange)
        const isPos = hasAvg && (tab.avgChange as number) >= 0

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            data-testid={`filter-tab-${tab.id}`}
            onClick={() => onSelectFilter(tab.id)}
            className={cn(
              'group flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border',
              isActive
                ? 'bg-zinc-100 text-zinc-950 border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 font-semibold shadow-xs'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors',
                isActive
                  ? 'bg-zinc-300 text-zinc-900 font-bold'
                  : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
              )}
            >
              {tab.count}
            </span>
            {hasAvg && (
              <span
                className={cn(
                  'text-[10px] font-mono font-medium ml-0.5',
                  isActive
                    ? isPos
                      ? 'text-emerald-700 dark:text-emerald-800'
                      : 'text-rose-700 dark:text-rose-800'
                    : isPos
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                )}
              >
                {`${isPos ? '+' : ''}${tab.avgChange}%`}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
