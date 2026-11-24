'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMarketStatus, fetchFXRates } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import { formatPercent } from '@/lib/formatters'
import type { MarketStatusResponse, FXRatesResponse } from '@/types/stock'

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
  const { data } = useQuery<MarketStatusResponse>({
    queryKey: ['market', 'status'],
    queryFn: fetchMarketStatus,
    refetchInterval: 60_000,
  })

  const setFXRates = useUIStore((s) => s.setFXRates)

  const { data: fxData } = useQuery<FXRatesResponse>({
    queryKey: ['market', 'fx'],
    queryFn: fetchFXRates,
    refetchInterval: 60_000,
    staleTime: 45_000,
  })

  // Sync FX rates into global UI store whenever fetched
  useEffect(() => {
    if (fxData?.rates && Array.isArray(fxData.rates)) {
      const rateMap: Record<string, number> = {}
      for (const r of fxData.rates) {
        rateMap[r.pair] = r.rate
      }
      setFXRates(rateMap)
    }
  }, [fxData, setFXRates])

  // Live real-time ticking clock (1s interval)
  const [liveJakartaTime, setLiveJakartaTime] = useState<string>('')

  useEffect(() => {
    setLiveJakartaTime(formatJakartaLiveTime())
    const interval = setInterval(() => {
      setLiveJakartaTime(formatJakartaLiveTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!data || !data.idx) return null

  const fxRates = Array.isArray(fxData?.rates) ? fxData.rates : []

  return (
    <div
      id="tour-market-status"
      role="status"
      aria-label="Real-Time Market Status"
      className="border-b border-[#1A202C]/80 bg-[#07080A]/95 text-xs text-[#6F7887]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 px-4 py-1.5 overflow-x-auto scrollbar-none">
        {/* Markets status sessions */}
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
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

          <span className="text-[#232B3A]">|</span>

          {/* SGX status if available */}
          {data.sgx && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-[#F0F4F8] text-[11px] uppercase tracking-wider">🇸🇬 SGX:</span>
                <span className="flex items-center gap-1.5">
                  {data.sgx.is_open ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E599]" />
                    </span>
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-[#343D4D]" />
                  )}
                  <span className={data.sgx.is_open ? 'text-[#00E599] font-mono font-semibold text-[11px]' : 'text-[#6F7887] font-mono font-medium text-[11px]'}>
                    {data.sgx.session_name}
                  </span>
                </span>
              </div>
              <span className="text-[#232B3A]">|</span>
            </>
          )}

          {/* US status */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold text-[#F0F4F8] text-[11px] uppercase tracking-wider">🇺🇸 US:</span>
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

        {/* Live FX Rates Strip & Clock */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-mono">
          {fxRates.length > 0 && (
            <div className="flex items-center gap-2.5 py-0.5">
              <span className="text-[#4F5968] font-bold uppercase tracking-wider text-[10px]">FX:</span>
              {fxRates.slice(0, 4).map((fx) => {
                const isPositive = fx.change_percent >= 0
                return (
                  <div key={fx.pair} className="flex items-center gap-1 bg-[#10141D] px-2 py-0.5 rounded border border-[#1A2230]">
                    <span className="text-[#8C96A5] font-semibold">{fx.pair}</span>
                    <span className="text-[#F0F4F8] font-medium">
                      {fx.rate >= 100 ? Math.round(fx.rate).toLocaleString() : fx.rate.toFixed(4)}
                    </span>
                    <span className={isPositive ? 'text-[#00E599] text-[10px]' : 'text-[#FF3B56] text-[10px]'}>
                      {formatPercent(fx.change_percent)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Jakarta Live Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-[#8C96A5] tabular-nums pl-1 border-l border-[#1A2230]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00B2FF] animate-pulse"></span>
            Jakarta: <strong className="text-[#F0F4F8] font-normal">{liveJakartaTime || data.idx.current_time_local}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
