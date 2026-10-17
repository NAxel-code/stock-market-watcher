'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketStatus } from '@/lib/api'

export function MarketStatusRibbon() {
  const { data } = useQuery({
    queryKey: ['market', 'status'],
    queryFn: fetchMarketStatus,
    refetchInterval: 60_000,
  })

  if (!data) return null

  return (
    <div
      id="tour-market-status"
      role="status"
      aria-label="Status Pasar Real-Time"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/90 bg-zinc-950/80 backdrop-blur-md px-4 py-1.5 text-xs text-zinc-300"
    >
      <div className="flex items-center gap-4">
        {/* IDX status */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-200">🇮🇩 IDX (BEI):</span>
          <span className="flex items-center gap-1.5">
            {data.idx.is_open ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
            )}
            <span className={data.idx.is_open ? 'text-emerald-400 font-semibold' : 'text-zinc-400 font-medium'}>
              {data.idx.session_name}
            </span>
          </span>
        </div>

        {/* US status */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-200">🇺🇸 US (NYSE/NASDAQ):</span>
          <span className="flex items-center gap-1.5">
            {data.us.is_open ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-600" />
            )}
            <span className={data.us.is_open ? 'text-emerald-400 font-semibold' : 'text-zinc-400 font-medium'}>
              {data.us.session_name}
            </span>
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-400 font-mono tabular-nums">
        <span>Jakarta: {data.idx.current_time_local}</span>
      </div>
    </div>
  )
}
