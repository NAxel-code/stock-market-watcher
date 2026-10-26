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
      className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A202C]/80 bg-[#07080A]/95 px-4 py-1.5 text-xs text-[#6F7887]"
    >
      <div className="flex items-center gap-4">
        {/* IDX status */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-[#F0F4F8] text-[11px] uppercase tracking-wider">🇮🇩 IDX (BEI):</span>
          <span className="flex items-center gap-1.5">
            {data.idx.is_open ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]" />
              </span>
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-[#343D4D]" />
            )}
            <span className={data.idx.is_open ? 'text-[#00E599] font-mono font-semibold text-[11px]' : 'text-[#6F7887] font-mono font-medium text-[11px]'}>
              {data.idx.session_name}
            </span>
          </span>
        </div>

        {/* US status */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-[#F0F4F8] text-[11px] uppercase tracking-wider">🇺🇸 US (NYSE/NASDAQ):</span>
          <span className="flex items-center gap-1.5">
            {data.us.is_open ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]" />
              </span>
            ) : (
              <span className="inline-block h-2 w-2 rounded-full bg-[#343D4D]" />
            )}
            <span className={data.us.is_open ? 'text-[#00E599] font-mono font-semibold text-[11px]' : 'text-[#6F7887] font-mono font-medium text-[11px]'}>
              {data.us.session_name}
            </span>
          </span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3 text-[11px] text-[#8C96A5] font-mono tabular-nums">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00B2FF] animate-pulse"></span>
          Jakarta: <strong className="text-[#F0F4F8] font-normal">{liveJakartaTime || data.idx.current_time_local}</strong>
        </span>
      </div>
    </div>
  )
}
