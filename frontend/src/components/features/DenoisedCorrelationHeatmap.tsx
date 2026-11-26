'use client'

import React, { useState, useMemo } from 'react'
import { Activity, Layers, RefreshCw, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useWatchlistCorrelation } from '@/hooks/useWatchlistCorrelation'
import { useUIStore } from '@/stores/useUIStore'

interface DenoisedCorrelationHeatmapProps {
  initialTickers?: string[]
}

const PRESET_POOLS = {
  WATCHLIST: 'Active Watchlist (Top 8)',
  US_TECH: 'US Megacaps (AAPL, MSFT, NVDA, AMZN, GOOGL, META)',
  IDX_BANKS: 'IDX Bluechips (BBCA, BBRI, BMRI, BBNI, ASII, TLKM)',
}

type PresetKey = keyof typeof PRESET_POOLS

function getCellColor(val: number, isDiagonal: boolean): string {
  if (isDiagonal) return 'bg-[#141418] text-[#71717a]'
  if (val >= 0.7) return 'bg-[#3f3f46] text-[#f4f4f5] font-bold'
  if (val >= 0.4) return 'bg-[#27272a] text-[#e4e4e7] font-semibold'
  if (val >= 0.15) return 'bg-[#18181b] text-[#a1a1aa]'
  if (val > -0.15) return 'bg-[#09090b] text-[#52525b]'
  if (val > -0.4) return 'bg-red-500/15 text-red-200'
  if (val > -0.7) return 'bg-red-500/30 text-red-200 font-semibold'
  return 'bg-red-500/50 text-white font-bold'
}

export function DenoisedCorrelationHeatmap({ initialTickers }: DenoisedCorrelationHeatmapProps) {
  const { watchlist } = useUIStore()
  const [preset, setPreset] = useState<PresetKey>('WATCHLIST')
  const [viewMode, setViewMode] = useState<'denoised' | 'raw'>('raw')
  const [isExpanded, setIsExpanded] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{
    rowTicker: string
    colTicker: string
    denoisedVal: number
    rawVal: number
  } | null>(null)

  const activeTickers = useMemo(() => {
    if (preset === 'US_TECH') {
      return ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META']
    }
    if (preset === 'IDX_BANKS') {
      return ['BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'BBNI.JK', 'ASII.JK', 'TLKM.JK']
    }
    // Default to watchlist, limit to top 8 for clean rendering
    const source = initialTickers && initialTickers.length >= 2 ? initialTickers : watchlist
    return source.slice(0, 8)
  }, [preset, initialTickers, watchlist])

  const { data, isLoading, isError, refetch, isFetching } = useWatchlistCorrelation(activeTickers)

  const tickers = data?.tickers ?? activeTickers
  const matrix = viewMode === 'denoised' ? data?.denoised_correlation : data?.raw_correlation

  return (
    <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4 md:p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222226] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#a1a1aa]" />
            <h3 className="text-sm font-bold tracking-tight text-[#f4f4f5] font-mono uppercase">
              RMT Portfolio Correlation Matrix
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#141418] text-[#a1a1aa] border border-[#222226]">
              Marchenko-Pastur Denoised
            </span>
          </div>
          <p className="text-xs text-[#71717a]">
            Random Matrix Theory (RMT) removes empirical sample noise to reveal true diversification and cluster risks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Recalculate Correlation Matrix"
            className="p-1.5 rounded border border-[#222226] bg-[#09090b] text-[#71717a] hover:text-[#f4f4f5] hover:border-[#3f3f46] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold rounded border border-[#222226] bg-[#09090b] text-[#a1a1aa] hover:text-[#f4f4f5] hover:border-[#3f3f46] transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Expand Matrix</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Subheader: Presets & Denoised vs Raw Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Presets */}
            <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded border border-[#222226] text-xs">
              <span className="text-[10px] font-mono text-[#71717a] px-2 font-medium">UNIVERSE:</span>
              {(Object.keys(PRESET_POOLS) as PresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    preset === key
                      ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                  }`}
                >
                  {key === 'WATCHLIST' ? 'Active Watchlist' : key === 'US_TECH' ? 'US Megacaps' : 'IDX Bluechips'}
                </button>
              ))}
            </div>

            {/* Matrix Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded border border-[#222226] text-xs">
              <button
                onClick={() => setViewMode('denoised')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  viewMode === 'denoised'
                    ? 'bg-[#f4f4f5] text-[#09090b]'
                    : 'text-[#71717a] hover:text-[#f4f4f5]'
                }`}
              >
                Denoised (RMT)
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  viewMode === 'raw'
                    ? 'bg-[#f4f4f5] text-[#09090b]'
                    : 'text-[#71717a] hover:text-[#f4f4f5]'
                }`}
              >
                Raw Empirical
              </button>
            </div>
          </div>

          {/* RMT Statistical Diagnostics Bar */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded bg-[#09090b] p-2.5 border border-[#222226]">
                <span className="text-[#71717a] text-[10px] font-mono block uppercase">Noise Neutralized</span>
                <span className="font-mono font-bold text-sm text-amber-400">
                  {data.noise_count} / {data.tickers.length} Factors
                </span>
                <span className="text-[9px] text-[#52525b] font-mono block truncate">Shrunk to constant trace</span>
              </div>

              <div className="rounded bg-[#09090b] p-2.5 border border-[#222226]">
                <span className="text-[#71717a] text-[10px] font-mono block uppercase">Signal Drivers</span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {data.signal_count} Drivers
                </span>
                <span className="text-[9px] text-[#52525b] font-mono block truncate">Above Marchenko-Pastur bound</span>
              </div>

              <div className="rounded bg-[#09090b] p-2.5 border border-[#222226]">
                <span className="text-[#71717a] text-[10px] font-mono block uppercase">Noise Cutoff (&lambda;<sub>+</sub>)</span>
                <span className="font-mono font-bold text-sm text-[#f4f4f5]">
                  {data.lambda_plus.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#52525b] font-mono block truncate">&sigma;&sup2;(1 + &radic;(N/T))&sup2;</span>
              </div>

              <div className="rounded bg-[#09090b] p-2.5 border border-[#222226]">
                <span className="text-[#71717a] text-[10px] font-mono block uppercase">Portfolio Diagnosis</span>
                <span className="font-mono font-bold text-sm text-[#f4f4f5]">
                  {data.signal_count <= 1 ? 'Single Cluster' : `${data.signal_count} Sub-clusters`}
                </span>
                <span className="text-[9px] text-[#52525b] font-mono block truncate">Diversification health</span>
              </div>
            </div>
          )}

          {/* Heatmap Grid */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Activity className="h-5 w-5 animate-pulse text-blue-400" />
              <p className="text-xs">Computing Marchenko-Pastur spectral decomposition...</p>
            </div>
          ) : isError || !matrix || matrix.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
              <p>Unable to calculate correlation matrix for selected universe.</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-blue-400 hover:underline"
              >
                Retry calculation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto pb-2">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-left text-[11px] font-mono text-zinc-500 font-semibold border-b border-zinc-800/80">
                        Asset
                      </th>
                      {tickers.map((colTicker) => (
                        <th
                          key={colTicker}
                          className="p-1.5 text-center text-[10px] font-mono font-bold text-zinc-300 border-b border-zinc-800/80 min-w-[54px]"
                        >
                          {colTicker.replace('.JK', '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickers.map((rowTicker, rowIndex) => (
                      <tr key={rowTicker} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-1.5 text-[11px] font-mono font-bold text-zinc-300 border-r border-zinc-800/60 whitespace-nowrap">
                          {rowTicker.replace('.JK', '')}
                        </td>
                        {tickers.map((colTicker, colIndex) => {
                          const val = matrix[rowIndex]?.[colIndex] ?? 0
                          const isDiagonal = rowIndex === colIndex
                          const cellColor = getCellColor(val, isDiagonal)

                          return (
                            <td
                              key={colTicker}
                              onMouseEnter={() => {
                                const denVal = data?.denoised_correlation?.[rowIndex]?.[colIndex] ?? val
                                const rVal = data?.raw_correlation?.[rowIndex]?.[colIndex] ?? val
                                setHoveredCell({
                                  rowTicker,
                                  colTicker,
                                  denoisedVal: denVal,
                                  rawVal: rVal,
                                })
                              }}
                              className={`p-1 text-center font-mono text-[11px] tabular-nums transition-all cursor-crosshair border border-zinc-950/40 ${cellColor}`}
                            >
                              {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Hover Details Card */}
              {hoveredCell ? (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200">
                      {hoveredCell.rowTicker} &times; {hoveredCell.colTicker}
                    </span>
                    <span className="text-zinc-500 text-[11px]">|</span>
                    <span className="text-zinc-400 text-[11px]">
                      Denoised (RMT):{' '}
                      <strong className="font-mono text-zinc-100">
                        {hoveredCell.denoisedVal >= 0 ? `+${hoveredCell.denoisedVal.toFixed(2)}` : hoveredCell.denoisedVal.toFixed(2)}
                      </strong>
                    </span>
                    <span className="text-zinc-500 text-[11px]">|</span>
                    <span className="text-zinc-400 text-[11px]">
                      Raw Sample:{' '}
                      <strong className="font-mono text-zinc-300">
                        {hoveredCell.rawVal >= 0 ? `+${hoveredCell.rawVal.toFixed(2)}` : hoveredCell.rawVal.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono">
                    {hoveredCell.rowTicker === hoveredCell.colTicker ? (
                      <span className="text-zinc-500">Self-correlation (1.0)</span>
                    ) : Math.abs(hoveredCell.denoisedVal - hoveredCell.rawVal) > 0.08 ? (
                      <span className="text-amber-400 font-medium">
                        &Delta; {Math.abs(hoveredCell.denoisedVal - hoveredCell.rawVal).toFixed(2)} noise filtered
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">High spectral agreement</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>Hover over any matrix cell to compare raw vs Marchenko-Pastur denoised comovement.</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-rose-600"></span> Inverse (-1.0)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-zinc-900 border border-zinc-700"></span> Neutral (0.0)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-blue-600"></span> Correlated (+1.0)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
