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
      return [{ id: 'ALL', label: 'All', count: 0, avgChange: null }]
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
      const sec = q.sector?.trim() || 'Other'
      const existing = sectorMap.get(sec) || []
      existing.push(q)
      sectorMap.set(sec, existing)
    })

    const result: FilterTab[] = [
      {
        id: 'ALL',
        label: 'All',
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
              'group flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all duration-150 border active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
              isActive
                ? 'bg-[#121620] text-[#00E599] border-[#00E599]/40 font-bold shadow-[0_0_12px_rgba(0,229,153,0.12)]'
                : 'bg-[#0D0F14] text-[#8C96A5] border-[#161C26] hover:text-[#F0F4F8] hover:border-[#1F2937] hover:bg-[#121620]/60'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[9px] px-1 py-0.2 rounded font-mono tabular-nums transition-colors',
                isActive
                  ? 'bg-[#00E599]/20 text-[#00E599] font-bold border border-[#00E599]/30'
                  : 'bg-[#07080A] text-[#6F7887] group-hover:text-[#A2ACB9] border border-[#161C26]'
              )}
            >
              {tab.count}
            </span>
            {hasAvg && (
              <span
                className={cn(
                  'text-[10px] font-mono tabular-nums font-semibold ml-0.5',
                  isPos ? 'text-[#00E599]' : 'text-[#FF3B56]'
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
