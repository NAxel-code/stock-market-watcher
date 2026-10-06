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
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/60 px-4 py-1.5 text-xs text-zinc-400">
      <div className="flex items-center gap-4">
        {/* IDX status */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-300">🇮🇩 IDX (BEI):</span>
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                data.idx.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={data.idx.is_open ? 'text-green-400 font-medium' : 'text-zinc-400'}>
              {data.idx.session_name}
            </span>
          </span>
        </div>

        {/* US status */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-300">🇺🇸 US (NYSE/NASDAQ):</span>
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                data.us.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className={data.us.is_open ? 'text-green-400 font-medium' : 'text-zinc-400'}>
              {data.us.session_name}
            </span>
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 text-[11px] text-zinc-500">
        <span>Jakarta: {data.idx.current_time_local}</span>
      </div>
    </div>
  )
}
