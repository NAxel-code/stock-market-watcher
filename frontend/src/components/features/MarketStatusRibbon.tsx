'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { fetchMarketStatus, fetchFXRates } from '@/lib/api'
import { useUIStore, type TimezoneMode } from '@/stores/useUIStore'
import { formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { MarketStatusResponse, FXRatesResponse } from '@/types/stock'

const TIMEZONE_CONFIGS: Record<TimezoneMode, { label: string; timeZone?: string; suffix: string }> = {
  LOCAL: { label: 'Local', timeZone: undefined, suffix: '' },
  WIB: { label: 'Jakarta', timeZone: 'Asia/Jakarta', suffix: 'WIB' },
  SGT: { label: 'Singapore', timeZone: 'Asia/Singapore', suffix: 'SGT' },
  EST: { label: 'New York', timeZone: 'America/New_York', suffix: 'EST' },
  UTC: { label: 'UTC', timeZone: 'UTC', suffix: 'UTC' },
}

export function formatClockTime(date: Date, mode: TimezoneMode): { label: string; formatted: string; suffix: string } {
  try {
    const config = TIMEZONE_CONFIGS[mode] || TIMEZONE_CONFIGS.LOCAL
    let resolvedZone = config.timeZone
    if (!resolvedZone) {
      try {
        resolvedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta'
      } catch {
        resolvedZone = 'Asia/Jakarta'
      }
    }

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: resolvedZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value
      return acc
    }, {})

    let suffix = config.suffix
    if (!suffix) {
      try {
        const tzPart = new Intl.DateTimeFormat('en-US', {
          timeZone: resolvedZone,
          timeZoneName: 'short',
        }).formatToParts(date).find((p) => p.type === 'timeZoneName')
        suffix = tzPart ? tzPart.value : resolvedZone.split('/').pop() || ''
      } catch {
        suffix = ''
      }
    }

    const label = mode === 'LOCAL' ? 'Local' : config.label
    const formatted = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
    return { label, formatted, suffix }
  } catch {
    return {
      label: 'Local',
      formatted: date.toLocaleTimeString(),
      suffix: '',
    }
  }
}

export function MarketStatusRibbon() {
  const { data } = useQuery<MarketStatusResponse>({
    queryKey: ['market', 'status'],
    queryFn: fetchMarketStatus,
    refetchInterval: 60_000,
  })

  const setFXRates = useUIStore((s) => s.setFXRates)
  const timezoneMode = useUIStore((s) => s.timezoneMode)
  const setTimezoneMode = useUIStore((s) => s.setTimezoneMode)
  const streamStatus = useUIStore((s) => s.streamStatus)

  const [isTzDropdownOpen, setIsTzDropdownOpen] = useState(false)
  const [clockData, setClockData] = useState(() => formatClockTime(new Date(), timezoneMode))

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

  // Live real-time ticking clock (1s interval) with user-selected or local device timezone
  useEffect(() => {
    const syncTimer = setTimeout(() => {
      setClockData(formatClockTime(new Date(), timezoneMode))
    }, 0)
    const interval = setInterval(() => {
      setClockData(formatClockTime(new Date(), timezoneMode))
    }, 1000)

    return () => {
      clearTimeout(syncTimer)
      clearInterval(interval)
    }
  }, [timezoneMode])

  if (!data || !data.idx) return null

  const fxRates = Array.isArray(fxData?.rates) ? fxData.rates : []

  return (
    <div
      id="tour-market-status"
      role="status"
      aria-label="Real-Time Market Status"
      className="border-b border-[#161C26] bg-[#07080A] text-xs text-[#6F7887]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-4 py-1.5 overflow-x-auto scrollbar-none">
        {/* Markets status sessions */}
        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap font-mono text-[11px]">
          {/* US status */}
          <div className="flex items-center gap-1.5">
            {data.us.is_open ? (
              <span className="inline-block h-2 w-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.6)]" />
            ) : (
              <span className="inline-block h-2 w-2 rounded-full border border-[#4F5968] bg-transparent" />
            )}
            <span className="font-semibold text-[#F0F4F8] uppercase tracking-wider">US</span>
            <span className={data.us.is_open ? 'text-[#00E599] font-bold' : 'text-[#6F7887]'}>
              {data.us.is_open ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          <span className="text-[#232B3A]">·</span>

          {/* SGX status if available */}
          {data.sgx && (
            <>
              <div className="flex items-center gap-1.5">
                {data.sgx.is_open ? (
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.6)]" />
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full border border-[#4F5968] bg-transparent" />
                )}
                <span className="font-semibold text-[#F0F4F8] uppercase tracking-wider">SGX:</span>
                <span className={data.sgx.is_open ? 'text-[#00E599] font-bold' : 'text-[#6F7887]'}>
                  {data.sgx.session_name || (data.sgx.is_open ? 'OPEN' : 'CLOSED')}
                </span>
              </div>
              <span className="text-[#232B3A]">·</span>
            </>
          )}

          {/* IDX status */}
          <div className="flex items-center gap-1.5">
            {data.idx.is_open ? (
              <span className="inline-block h-2 w-2 rounded-full bg-[#00E599] shadow-[0_0_8px_rgba(0,229,153,0.6)]" />
            ) : (
              <span className="inline-block h-2 w-2 rounded-full border border-[#4F5968] bg-transparent" />
            )}
            <span className="font-semibold text-[#F0F4F8] uppercase tracking-wider">IDX (BEI):</span>
            <span className={data.idx.is_open ? 'text-[#00E599] font-bold' : 'text-[#6F7887]'}>
              {data.idx.session_name || (data.idx.is_open ? 'OPEN' : 'CLOSED')}
            </span>
          </div>

          <span className="text-[#232B3A]">|</span>

          {/* Major Indices Strip */}
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#8C96A5]">SPX <strong className="text-[#F0F4F8] font-medium">7,264.73</strong> <span className="text-[#00E599]">+5.13%</span></span>
            <span className="text-[#8C96A5]">COMP <strong className="text-[#F0F4F8] font-medium">24,188.64</strong> <span className="text-[#00E599]">+6.95%</span></span>
            <span className="text-[#8C96A5]">DJI <strong className="text-[#F0F4F8] font-medium">49,753.08</strong> <span className="text-[#00E599]">+3.34%</span></span>
            <span className="text-[#8C96A5]">JCI <strong className="text-[#F0F4F8] font-medium">5,215.85</strong> <span className="text-[#00E599]">+1.35%</span></span>
            <span className="text-[#232B3A]">|</span>
            <span className="text-[#8C96A5]">USD/IDR <strong className="text-[#F0F4F8] font-medium">18,245</strong> <span className="text-[10px] text-[#6F7887]">BI 17 NOV</span></span>
            <span className="text-[#8C96A5]">FED <strong className="text-[#F0F4F8] font-medium">3.75–4.00%</strong></span>
            <span className="text-[#8C96A5]">BI <strong className="text-[#F0F4F8] font-medium">6.00%</strong></span>
          </div>
        </div>

        {/* Live FX Rates Strip & Clock */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-mono">
          {fxRates.length > 0 && (
            <div className="flex items-center gap-2 py-0.5">
              <span className="text-[#4F5968] font-bold uppercase tracking-wider text-[10px]">FX:</span>
              {fxRates.slice(0, 3).map((fx) => {
                const isPositive = fx.change_percent >= 0
                return (
                  <div key={fx.pair} className="flex items-center gap-1 bg-[#0E121B] px-1.5 py-0.5 rounded border border-[#161C26]">
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

          {/* Real-Time Stream Transport Badge */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold',
              streamStatus === 'live'
                ? 'bg-[#00E599]/10 border-[#00E599]/30 text-[#00E599]'
                : streamStatus === 'connecting'
                ? 'bg-[#FFB020]/10 border-[#FFB020]/30 text-[#FFB020]'
                : 'bg-[#121620] border-[#161C26] text-[#6F7887]'
            )}
            title={
              streamStatus === 'live'
                ? 'Real-time SSE quote stream connected'
                : streamStatus === 'connecting'
                ? 'Establishing live quote stream...'
                : 'HTTP polling fallback active'
            }
          >
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                streamStatus === 'live'
                  ? 'bg-[#00E599] animate-pulse'
                  : streamStatus === 'connecting'
                  ? 'bg-[#FFB020] animate-pulse'
                  : 'bg-[#6F7887]'
              )}
            />
            <span>
              {streamStatus === 'live'
                ? 'STREAM'
                : streamStatus === 'connecting'
                ? 'SYNC'
                : 'POLL'}
            </span>
          </div>

          {/* Interactive Live Clock with Timezone Switcher (Defaults to Local Device) */}
          <div className="relative flex items-center pl-1 border-l border-[#161C26]">
            <button
              type="button"
              onClick={() => setIsTzDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-[#8C96A5] hover:text-white tabular-nums px-1.5 py-0.5 rounded hover:bg-[#121620] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00E599]"
              title="Click to change timezone (Default: Local device)"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00E599] shrink-0" />
              <span className="font-semibold text-[#8C96A5]" suppressHydrationWarning>{clockData.label}:</span>
              <strong className="text-[#F0F4F8] font-normal" suppressHydrationWarning>{clockData.formatted}</strong>
              {clockData.suffix && (
                <span className="text-[10px] text-[#6F7887] font-semibold" suppressHydrationWarning>{clockData.suffix}</span>
              )}
              <ChevronDown className="h-3 w-3 text-[#6F7887] ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {isTzDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTzDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg bg-[#0C0E14] border border-[#1A202C] p-1 shadow-xl space-y-0.5 font-mono text-[11px]">
                  {(
                    [
                      { mode: 'LOCAL', label: 'Local (Device)', desc: 'Your Computer Time' },
                      { mode: 'WIB', label: 'Jakarta (WIB)', desc: 'IDX Market Time' },
                      { mode: 'SGT', label: 'Singapore (SGT)', desc: 'SGX Market Time' },
                      { mode: 'EST', label: 'New York (EST)', desc: 'US Market Time' },
                      { mode: 'UTC', label: 'UTC', desc: 'Universal Time' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => {
                        setTimezoneMode(item.mode)
                        setIsTzDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors',
                        timezoneMode === item.mode
                          ? 'bg-[#00E599]/15 text-[#00E599] font-bold'
                          : 'text-[#6F7887] hover:bg-[#161C26] hover:text-white'
                      )}
                    >
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-[9px] text-[#6F7887]">{item.desc}</p>
                      </div>
                      {timezoneMode === item.mode && <span className="text-[#00E599]">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
