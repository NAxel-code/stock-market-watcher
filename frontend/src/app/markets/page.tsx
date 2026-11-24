'use client'

import { useState } from 'react'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Flame,
  Zap,
  BarChart3,
  Percent,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import { useMarketsOverview } from '@/hooks/useMarketsOverview'
import { useUIStore } from '@/stores/useUIStore'
import { getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MarketInstrument, YieldCurvePoint, UnusualMover } from '@/types/stock'

type MarketTab = 'ALL' | 'INDICES' | 'ETFS' | 'RATES' | 'FX' | 'COMMODITIES' | 'UNUSUAL'

export default function MarketsPage() {
  const { language } = useUIStore()
  const { data: overview, isLoading, isError, refetch, isFetching } = useMarketsOverview()
  const [activeTab, setActiveTab] = useState<MarketTab>('ALL')

  const tTitle = language === 'id' ? 'Intelijen Pasar Multi-Aset' : 'Multi-Asset Market Intelligence'
  const tSubtitle =
    language === 'id'
      ? 'Kurva yield obligasi, ETF lintas pasar, suku bunga acuan bank sentral, komoditas ASEAN, dan statistical volatility shocks.'
      : 'Sovereign yield curves, cross-border ETFs, central bank benchmarks, ASEAN commodities, and statistical volatility shocks.'

  return (
    <div className="min-h-screen bg-[#07080A] text-[#F0F4F8] pb-24 md:pb-16">
      {/* Top Header */}
      <section className="border-b border-[#161C26] bg-[#07080A]/95 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
                MARKETS / SNAPSHOT 23 NOV 2026 · 23:24 SGT
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-[#F0F4F8]">
                  Markets
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 uppercase font-semibold">
                  Multi-Asset Market Intelligence
                </span>
              </div>
              <p className="text-xs text-[#6F7887] font-mono mt-1 max-w-3xl">
                {tSubtitle}
              </p>
            </div>

            {/* Status & Refresh Telemetry */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex font-mono">
                <span className="text-[10px] text-[#6F7887] uppercase flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {language === 'id' ? 'Diperbarui' : 'Updated'}:{' '}
                  <span className="text-[#F0F4F8]">
                    {overview?.as_of ? new Date(overview.as_of).toLocaleTimeString() : '23:24 SGT'}
                  </span>
                </span>
                <span className="text-[10px] text-[#00E599] flex items-center gap-1 justify-end">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00E599] animate-pulse" />
                  Official Sources (US Treasury, MAS, BI, ICE)
                </span>
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161C26]/60 hover:bg-[#161C26] text-xs font-mono border border-[#232B3A] text-[#F0F4F8] transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin text-[#00E599]')} />
                <span className="hidden sm:inline">{language === 'id' ? 'Segarkan' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: 'ALL', label: language === 'id' ? 'Semua Monitor' : 'All Monitors' },
                { id: 'INDICES', label: language === 'id' ? 'Indeks Saham' : 'Indices' },
                { id: 'ETFS', label: 'Core ETFs' },
                { id: 'RATES', label: language === 'id' ? 'Yield & Suku Bunga' : 'Sovereign Rates' },
                { id: 'FX', label: 'Macro FX' },
                { id: 'COMMODITIES', label: language === 'id' ? 'Komoditas' : 'Commodities' },
                { id: 'UNUSUAL', label: language === 'id' ? 'Vol Shocks' : 'Unusual Moves' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all border',
                  activeTab === tab.id
                    ? 'bg-[#161D2B] text-[#00E599] border-[#00E599]/40 font-bold'
                    : 'bg-[#0E121B] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8] hover:border-[#232B3A]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container mx-auto px-4 max-w-7xl py-6 space-y-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-[#6F7887] font-mono gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-[#00E599]" />
            <p className="text-xs">Gathering multi-asset market intelligence across US, SG, and ID...</p>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/40 text-red-300 font-mono text-xs flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">Failed to load market telemetry.</p>
              <p className="text-[11px] text-red-400/80">Using fallback cached pricing where available.</p>
            </div>
          </div>
        )}

        {overview && (
          <>
            {/* 1. INDICES BLOCK */}
            {(activeTab === 'ALL' || activeTab === 'INDICES') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#00C2FF]" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'Indeks Global & Regional' : 'Global & Regional Benchmarks'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#6F7887]">US · SGX · IDX</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {overview.indices.map((idx) => (
                    <InstrumentCard key={idx.ticker} item={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* 2. CORE ETFS BLOCK */}
            {(activeTab === 'ALL' || activeTab === 'ETFS') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#00E599]" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'ETF Inti & Instrumen UCITS' : 'Core Institutional ETFs (US & UCITS)'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#6F7887]">15% WHT & 0% Estate Tax Comparison</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {overview.etfs.map((etf) => (
                    <div
                      key={etf.ticker}
                      className="p-3.5 rounded-lg bg-[#0C0E14] border border-[#1A202C] hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-white">{etf.ticker}</span>
                            {etf.ticker.includes('.L') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                                UCITS (Ireland)
                              </span>
                            )}
                            {etf.ticker.includes('.SI') && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40">
                                SGX Domicile
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6F7887] font-mono truncate max-w-[200px] mt-0.5">
                            {etf.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-[#F0F4F8]">
                            {etf.unit} {etf.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <div
                            className={cn(
                              'text-xs font-mono font-semibold flex items-center justify-end gap-0.5 mt-0.5',
                              etf.change_percent >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'
                            )}
                          >
                            {etf.change_percent >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>
                              {etf.change_percent >= 0 ? '+' : ''}
                              {etf.change_percent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1A202C]/60 flex items-center justify-between text-[10px] font-mono text-[#6F7887]">
                        <span>Exchange: {etf.source}</span>
                        {etf.ticker.includes('.L') ? (
                          <span className="text-emerald-400/90 font-medium">0% US Estate Tax Risk</span>
                        ) : etf.ticker.includes('.SI') ? (
                          <span className="text-blue-400/90 font-medium">0% Dividend WHT</span>
                        ) : (
                          <span className="text-amber-400/90 font-medium">30% US WHT Applies</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. SOVEREIGN YIELD CURVES & RATES */}
            {(activeTab === 'ALL' || activeTab === 'RATES') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-[#FFAA00]" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'Kurva Yield & Suku Bunga Bank Sentral' : 'Sovereign Yield Curves & Central Bank Rates'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#00E599]">
                    US 2s10s Spread: +13 bps (Normalizing)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* US Treasury */}
                  <div className="p-4 rounded-lg bg-[#0C0E14] border border-[#1A202C]">
                    <div className="flex items-center justify-between border-b border-[#1A202C] pb-2 mb-3">
                      <span className="font-mono font-bold text-xs uppercase text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        US Treasury Curve (FRED / Treasury)
                      </span>
                      <span className="text-[10px] font-mono text-[#6F7887]">Fed Funds 4.83%</span>
                    </div>
                    <div className="space-y-2">
                      {overview.sovereign_rates
                        .filter((r) => r.country === 'US')
                        .map((rate) => (
                          <YieldRow key={rate.tenor} rate={rate} />
                        ))}
                    </div>
                  </div>

                  {/* Singapore MAS */}
                  <div className="p-4 rounded-lg bg-[#0C0E14] border border-[#1A202C]">
                    <div className="flex items-center justify-between border-b border-[#1A202C] pb-2 mb-3">
                      <span className="font-mono font-bold text-xs uppercase text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Singapore SGS & SORA (MAS)
                      </span>
                      <span className="text-[10px] font-mono text-[#6F7887]">Monetary Authority</span>
                    </div>
                    <div className="space-y-2">
                      {overview.sovereign_rates
                        .filter((r) => r.country === 'SG')
                        .map((rate) => (
                          <YieldRow key={rate.tenor} rate={rate} />
                        ))}
                    </div>
                  </div>

                  {/* Indonesia BI */}
                  <div className="p-4 rounded-lg bg-[#0C0E14] border border-[#1A202C]">
                    <div className="flex items-center justify-between border-b border-[#1A202C] pb-2 mb-3">
                      <span className="font-mono font-bold text-xs uppercase text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Indonesian Gov Bonds (BI / PHEI)
                      </span>
                      <span className="text-[10px] font-mono text-[#6F7887]">BI-Rate 6.00%</span>
                    </div>
                    <div className="space-y-2">
                      {overview.sovereign_rates
                        .filter((r) => r.country === 'ID')
                        .map((rate) => (
                          <YieldRow key={rate.tenor} rate={rate} />
                        ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. MACRO FX MATRIX */}
            {(activeTab === 'ALL' || activeTab === 'FX') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#00C2FF]" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'Matriks Valuta Asing (FX)' : 'Macro FX Matrix & Dollar Index'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#6F7887]">Triangulated Cross-Rates</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.fx_rates.map((fx) => (
                      <InstrumentCard key={fx.ticker} item={fx} />
                    ))}
                  </div>

                  {/* Institutional Currency Converter Tool (Page 5) */}
                  <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26] flex flex-col justify-between font-mono text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6F7887]">TOOL</div>
                      <h3 className="text-sm font-bold text-[#F0F4F8] mt-0.5">Currency converter</h3>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div>
                          <label className="text-[10px] text-[#6F7887] uppercase block">AMOUNT</label>
                          <input
                            type="text"
                            defaultValue="1,000"
                            className="w-full mt-1 bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-xs text-[#F0F4F8] focus:border-[#00E599] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#6F7887] uppercase block">FROM</label>
                          <select className="w-full mt-1 bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-xs text-[#F0F4F8] focus:border-[#00E599] focus:outline-none">
                            <option>USD</option>
                            <option>SGD</option>
                            <option>IDR</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#6F7887] uppercase block">TO</label>
                          <select className="w-full mt-1 bg-[#121620] border border-[#161C26] rounded px-2 py-1 text-xs text-[#F0F4F8] focus:border-[#00E599] focus:outline-none">
                            <option>IDR</option>
                            <option>SGD</option>
                            <option>USD</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#161C26]">
                        <span className="text-[10px] uppercase text-[#6F7887]">RESULT</span>
                        <div className="text-xl font-bold text-[#00E599] mt-0.5">
                          Rp 18,245,000
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#6F7887] mt-3 pt-2 border-t border-[#161C26]">
                      AT 18,245 · BANK INDONESIA 17 NOV 2026 · ALSO IN CMD+K: &quot;1000 usd to idr&quot;
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 5. COMMODITIES BLOCK */}
            {(activeTab === 'ALL' || activeTab === 'COMMODITIES') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'Komoditas Energi, Logam & ASEAN' : 'Energy, Metals & Southeast Asian Commodities'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#6F7887]">ICE · COMEX · World Bank · ICDX</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {overview.commodities.map((comm) => (
                    <InstrumentCard key={comm.ticker} item={comm} />
                  ))}
                </div>
              </section>
            )}

            {/* 6. QUANT UNUSUAL MOVES / STATISTICAL VOLATILITY SHOCKS */}
            {(activeTab === 'ALL' || activeTab === 'UNUSUAL') && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#00E599]" />
                    <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-white">
                      {language === 'id' ? 'Statistik Kejutan Volatilitas (Unusual Moves)' : 'Quant Unusual Moves (Normalized Vol Shocks)'}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[#6F7887]">
                    Z-Score = Today&apos;s Return / 1Y Daily Volatility
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {overview.unusual_moves.map((mover) => (
                    <div
                      key={mover.ticker}
                      className="p-3.5 rounded-lg bg-[#0C0E14] border border-[#1A202C] hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-sm text-white">{mover.ticker}</span>
                            <span className="text-[10px] font-mono text-[#6F7887]">({mover.exchange})</span>
                          </div>
                          <p className="text-xs text-[#6F7887] font-mono truncate max-w-[180px] mt-0.5">
                            {mover.name}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold px-2 py-0.5 rounded border',
                            mover.direction === 'SURGE'
                              ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30'
                              : 'bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30'
                          )}
                        >
                          {mover.direction === 'SURGE' ? 'SURGE +' : 'DUMP -'}
                          {mover.z_score_shock.toFixed(1)}σ
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#1A202C]/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#6F7887] font-mono">1Y Daily Vol</span>
                          <p className="text-xs font-mono font-semibold text-[#F0F4F8]">
                            {mover.daily_volatility_1y.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#6F7887] font-mono">Today Move</span>
                          <p
                            className={cn(
                              'text-xs font-mono font-bold flex items-center justify-end gap-0.5',
                              mover.change_percent >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'
                            )}
                          >
                            {mover.change_percent >= 0 ? '+' : ''}
                            {mover.change_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function InstrumentCard({ item }: { item: MarketInstrument }) {
  const isPositive = item.change_percent >= 0
  return (
    <div className="p-3.5 rounded-lg bg-[#0C0E14] border border-[#1A202C] hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono font-bold text-sm text-white">{item.name}</span>
          <p className="text-[10px] text-[#6F7887] font-mono mt-0.5">{item.ticker}</p>
        </div>
        <div className="text-right">
          <span className="font-mono font-bold text-sm text-[#F0F4F8]">
            {item.current_price.toLocaleString(undefined, {
              minimumFractionDigits: item.category === 'FX' ? 4 : 2,
            })}{' '}
            <span className="text-[10px] text-[#6F7887] font-normal">{item.unit}</span>
          </span>
          <div
            className={cn(
              'text-xs font-mono font-semibold flex items-center justify-end gap-0.5 mt-0.5',
              isPositive ? 'text-[#00E599]' : 'text-[#FF4444]'
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>
              {isPositive ? '+' : ''}
              {item.change_percent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 pt-2 border-t border-[#1A202C]/60 flex items-center justify-between text-[10px] font-mono text-[#6F7887]">
        <span>Source: {item.source}</span>
        {item.is_stale && <span className="text-amber-400">Delayed</span>}
      </div>
    </div>
  )
}

function YieldRow({ rate }: { rate: YieldCurvePoint }) {
  const isChgPositive = rate.change_bps >= 0
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded bg-[#07080A]/60 border border-[#1A202C]/60 text-xs font-mono">
      <span className="font-semibold text-[#F0F4F8]">{rate.tenor}</span>
      <div className="flex items-center gap-3">
        <span className="font-bold text-white">{rate.yield_rate.toFixed(2)}%</span>
        <span
          className={cn(
            'text-[10px] flex items-center gap-0.5 w-14 justify-end font-semibold',
            isChgPositive ? 'text-[#00E599]' : 'text-[#FF4444]'
          )}
        >
          {isChgPositive ? '+' : ''}
          {rate.change_bps.toFixed(1)} bps
        </span>
      </div>
    </div>
  )
}
