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
    const sgxQuotes = quotes.filter((q) => q.ticker.toUpperCase().endsWith('.SI') || q.currency === 'SGD')
    const usQuotes = quotes.filter((q) => !isIdxTicker(q.ticker) && !q.is_idx && !q.ticker.toUpperCase().endsWith('.SI') && q.currency !== 'SGD')

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
    ]

    if (sgxQuotes.length > 0) {
      result.push({
        id: 'SGX',
        label: 'SGX',
        count: sgxQuotes.length,
        avgChange: calcAvg(sgxQuotes),
      })
    }

    result.push({
      id: 'US',
      label: 'US Market',
      count: usQuotes.length,
      avgChange: calcAvg(usQuotes),
    })

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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5]',
              isActive
                ? 'bg-[#f4f4f5] text-[#09090b] border-[#f4f4f5] font-bold'
                : 'bg-[#0f0f12] text-[#a1a1aa] border-[#222226] hover:text-[#f4f4f5] hover:bg-[#141418]'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[9px] px-1 py-0.2 rounded font-mono tabular-nums transition-colors',
                isActive
                  ? 'bg-[#09090b]/10 text-[#09090b] font-bold'
                  : 'bg-[#141418] text-[#71717a] group-hover:text-[#a1a1aa] border border-[#222226]'
              )}
            >
              {tab.count}
            </span>
            {hasAvg && (
              <span
                className={cn(
                  'text-[10px] font-mono tabular-nums font-semibold ml-0.5',
                  isActive
                    ? (isPos ? 'text-emerald-700' : 'text-red-700')
                    : (isPos ? 'text-emerald-400' : 'text-red-400')
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
