'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketStatus } from '@/lib/api'

function formatJakartaLiveTime(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const parts = formatter.formatToParts(new Date()).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value
      return acc
    }, {})

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} WIB`
  } catch {
    return new Date().toLocaleTimeString('id-ID') + ' WIB'
  }
}

export function MarketStatusRibbon() {
  const { data } = useQuery({
    queryKey: ['market', 'status'],
    queryFn: fetchMarketStatus,
    refetchInterval: 60_000,
  })

  // Live real-time ticking clock (1s interval)
  const [liveJakartaTime, setLiveJakartaTime] = useState<string>('')

  useEffect(() => {
    setLiveJakartaTime(formatJakartaLiveTime())
    const interval = setInterval(() => {
      setLiveJakartaTime(formatJakartaLiveTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  return (
    <div
      id="tour-market-status"
      role="status"
      aria-label="Real-Time Market Status"
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
        <span>Jakarta: {liveJakartaTime || data.idx.current_time_local}</span>
      </div>
    </div>
  )
}
