'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
  RotateCcw,
  Layers,
  Globe2,
  Coins,
  Cloud,
} from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import {
  analyzeCustomPortfolio,
  deletePersistedHolding,
  ensureClientWorkspaceId,
  fetchDefaultPortfolio,
  fetchPersistedHoldings,
  resetPersistedHoldings,
  upsertPersistedHolding,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import type {
  PortfolioHoldingItem,
  PortfolioAnalysisResponse,
} from '@/types/stock'

type AllocationTab = 'SECTOR' | 'COUNTRY' | 'CURRENCY'

const STORAGE_KEY = 'stockpulse_portfolio_holdings'

let fallbackSeq = 0
function createHoldingId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pos-${crypto.randomUUID().slice(0, 8)}`
  }
  fallbackSeq += 1
  return `pos-${fallbackSeq}`
}

export default function PortfolioPage() {
  const { language, displayCurrency, user } = useUIStore()
  const baseCurrency = displayCurrency === 'NATIVE' ? 'SGD' : displayCurrency

  const [holdings, setHoldings] = useState<PortfolioHoldingItem[]>([])
  const [analysis, setAnalysis] = useState<PortfolioAnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloudSynced, setIsCloudSynced] = useState(false)
  const [allocationTab, setAllocationTab] = useState<AllocationTab>('SECTOR')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // New position form state
  const [newTicker, setNewTicker] = useState('')
  const [newName, setNewName] = useState('')
  const [newExchange, setNewExchange] = useState('US')
  const [newShares, setNewShares] = useState('')
  const [newCostBasis, setNewCostBasis] = useState('')
  const [newCurrency, setNewCurrency] = useState('USD')
  const [newSector] = useState('Technology')
  const [newCountry, setNewCountry] = useState('US')

  const runAnalysis = useCallback(async (items: PortfolioHoldingItem[], curr: string) => {
    try {
      const resp = await analyzeCustomPortfolio(items, curr)
      setAnalysis(resp)
    } catch (err) {
      console.error('Failed to analyze portfolio:', err)
    }
  }, [])

  // 1. Initial Load & Cloud Sync
  useEffect(() => {
    let active = true
    async function loadInitial() {
      ensureClientWorkspaceId()
      setIsLoading(true)
      try {
        let initialHoldings: PortfolioHoldingItem[]
        try {
          initialHoldings = await fetchPersistedHoldings()
          if (active) setIsCloudSynced(true)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialHoldings))
        } catch {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            initialHoldings = JSON.parse(saved)
          } else {
            initialHoldings = await fetchDefaultPortfolio()
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialHoldings))
          }
          if (active) setIsCloudSynced(false)
        }
        if (!active) return
        setHoldings(initialHoldings)
        const resp = await analyzeCustomPortfolio(initialHoldings, baseCurrency)
        if (active) setAnalysis(resp)
      } catch (err) {
        console.error('Failed to load portfolio:', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadInitial()
    return () => {
      active = false
    }
  }, [user?.id]) // Reload from cloud when user signs in/out

  // 2. Re-analyze when Base Currency changes
  useEffect(() => {
    if (holdings.length === 0) return
    let active = true
    analyzeCustomPortfolio(holdings, baseCurrency)
      .then((resp) => {
        if (active) setAnalysis(resp)
      })
      .catch((err) => {
        console.error('Failed to analyze portfolio:', err)
      })
    return () => {
      active = false
    }
  }, [baseCurrency, holdings])

  // 3. Actions: Add Position
  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTicker || !newShares || !newCostBasis) return

    const uniqueId = createHoldingId()

    const newHolding: PortfolioHoldingItem = {
      id: uniqueId,
      ticker: newTicker.trim().toUpperCase(),
      company_name: newName.trim() || newTicker.trim().toUpperCase(),
      exchange: newExchange,
      asset_type: 'EQUITY',
      shares: parseFloat(newShares),
      lot_size: newExchange === 'IDX' ? 100 : 1,
      cost_basis: parseFloat(newCostBasis),
      currency: newCurrency,
      purchase_date: new Date().toISOString().split('T')[0],
      sector: newSector,
      country: newCountry,
      fees: 0,
      notes: 'User logged lot',
    }

    const updated = [newHolding, ...holdings]
    setHoldings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setIsAddModalOpen(false)
    resetForm()
    void upsertPersistedHolding(newHolding).then(() => setIsCloudSynced(true)).catch(() => {})
    await runAnalysis(updated, baseCurrency)
  }

  // 4. Actions: Delete Position
  const handleDeletePosition = async (id: string) => {
    const updated = holdings.filter((h) => h.id !== id)
    setHoldings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    void deletePersistedHolding(id).catch(() => {})
    await runAnalysis(updated, baseCurrency)
  }

  // 5. Actions: Reset to Default Institutional Model Portfolio
  const handleResetToDefault = async () => {
    setIsLoading(true)
    try {
      let defaults: PortfolioHoldingItem[]
      try {
        defaults = await resetPersistedHoldings()
        setIsCloudSynced(true)
      } catch {
        defaults = await fetchDefaultPortfolio()
      }
      setHoldings(defaults)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      await runAnalysis(defaults, baseCurrency)
    } catch (err) {
      console.error('Failed to reset portfolio:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setNewTicker('')
    setNewName('')
    setNewShares('')
    setNewCostBasis('')
  }

  const isProfit = (analysis?.unrealized_pnl_base ?? 0) >= 0

  return (
    <div className="min-h-screen bg-[#07080A] text-[#F0F4F8] pb-24 md:pb-16">
      {/* Top Header */}
      <section className="border-b border-[#161C26] bg-[#07080A]/95 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
                PORTFOLIO / {baseCurrency} BASE / SAMPLE HOLDINGS
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h1 className="text-xl md:text-2xl font-bold font-mono tracking-tight text-[#F0F4F8]">
                  Portfolio
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 font-semibold uppercase">
                  Institutional Multi-Asset Portfolio
                </span>
                {isCloudSynced && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#00B2FF]/10 text-[#00B2FF] border border-[#00B2FF]/30 font-semibold uppercase">
                    <Cloud className="h-3 w-3" />
                    Cloud Synced
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                <span className="text-[#6F7887]">VIEW:</span>
                <span className="px-2 py-0.5 rounded bg-[#161D2B] text-[#00E599] font-bold border border-[#00E599]/30">
                  My portfolio
                </span>
                <span className="px-2 py-0.5 rounded text-[#6F7887] hover:text-[#F0F4F8] cursor-pointer">
                  Group model
                </span>
                <span className="px-2 py-0.5 rounded text-[#6F7887] hover:text-[#F0F4F8] cursor-pointer">
                  Paper lab
                </span>
              </div>
            </div>

            {/* Quick Actions & Timeframe */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded border border-[#161C26] text-xs font-mono">
                {['1D', '1W', '1M', 'YTD', '1Y'].map((tf, i) => (
                  <span
                    key={tf}
                    className={cn(
                      'px-2 py-0.5 rounded font-semibold cursor-pointer',
                      i === 0 ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30' : 'text-[#6F7887]'
                    )}
                  >
                    {tf}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161C26]/60 hover:bg-[#161C26] text-xs font-mono border border-[#232B3A] text-[#8C96A5] hover:text-[#F0F4F8] transition-all"
                title="Restore 5-sleeve institutional model portfolio"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Model Demo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00E599] hover:bg-[#00c784] text-black text-xs font-mono font-bold transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>{language === 'id' ? 'Tambah Lot' : 'Add Position'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="container mx-auto px-4 max-w-7xl py-6 space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-[#6F7887] font-mono gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-[#00E599]" />
            <p className="text-xs">Computing performance attribution and tax liabilities...</p>
          </div>
        )}

        {analysis && !isLoading && (
          <>
            {/* 1. TOP SUMMARY CARDS (PERFORMANCE ATTRIBUTION & DIVIDENDS) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Value */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C96A5]">
                    VALUE
                  </span>
                  <span className="text-[#00E599] text-[10px] font-bold bg-[#00E599]/10 px-1.5 py-0.2 rounded border border-[#00E599]/20">
                    ↗ +2.6% 1D
                  </span>
                </div>
                <p className="text-2xl font-bold font-mono text-[#F0F4F8]">
                  {baseCurrency}{' '}
                  {analysis.total_value_base.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <div className="text-[10px] font-mono text-[#6F7887] mt-1.5 pt-1.5 border-t border-[#161C26]">
                  {holdings.length} holdings · USD, SGD, XAU
                </div>
              </div>

              {/* Total Return */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C96A5]">
                    TOTAL RETURN
                  </span>
                  <span className="text-[#8C96A5] text-[10px] font-medium font-mono">
                    +2.3 PTS
                  </span>
                </div>
                <p className={cn('text-2xl font-bold font-mono', isProfit ? 'text-[#00E599]' : 'text-[#FF4444]')}>
                  {isProfit ? '+' : ''}{analysis.unrealized_pnl_percent.toFixed(1)}%
                </p>
                <div className="text-[10px] font-mono text-[#6F7887] mt-1.5 pt-1.5 border-t border-[#161C26]">
                  Benchmark VWRA +6.1%
                </div>
              </div>

              {/* Performance Attribution: From Stocks */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C96A5]">
                    FROM STOCKS
                  </span>
                  <span className="text-[9px] font-mono text-[#00E599] font-semibold">Attribution</span>
                </div>
                <p className="text-2xl font-bold font-mono text-[#00E599]">
                  +{((analysis.total_stock_move_pnl_base / (analysis.total_cost_base || 1)) * 100).toFixed(1)}%
                </p>
                <div className="text-[10px] font-mono text-[#6F7887] mt-1.5 pt-1.5 border-t border-[#161C26] truncate">
                  Performance Attribution · Stock alpha
                </div>
              </div>

              {/* Performance Attribution: From FX */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C96A5]">
                    FROM FX
                  </span>
                  <span className="text-[9px] font-mono text-[#FF4444] font-semibold">↘ FX</span>
                </div>
                <p className={cn('text-2xl font-bold font-mono', analysis.total_fx_move_pnl_base >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]')}>
                  {analysis.total_fx_move_pnl_base >= 0 ? '+' : ''}
                  {((analysis.total_fx_move_pnl_base / (analysis.total_cost_base || 1)) * 100).toFixed(1)}%
                </p>
                <div className="text-[10px] font-mono text-[#6F7887] mt-1.5 pt-1.5 border-t border-[#161C26] truncate">
                  USD/SGD impact over period
                </div>
              </div>
            </section>

            {/* TWO-COLUMN CHARTS: PERFORMANCE VS BENCHMARK & FIVE-SLEEVE TARGETS */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Chart: Value vs Benchmark */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                    PERFORMANCE / INDEXED TO 100
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <h3 className="text-sm font-bold font-mono text-[#F0F4F8]">Value vs benchmark</h3>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#00E599]" />
                        <span className="text-[#F0F4F8] font-bold">PORTFOLIO</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#00B2FF]" />
                        <span className="text-[#8C96A5]">VWRA</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* SVG Performance Chart */}
                <div className="my-4 h-36 w-full flex flex-col justify-end">
                  <svg className="w-full h-28 overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#161C26" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#161C26" strokeDasharray="3 3" />
                    {/* VWRA Benchmark Line (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#00B2FF"
                      strokeWidth="2"
                      points="0,60 50,56 100,52 150,48 200,45 250,42 300,38"
                    />
                    {/* Portfolio Line (Green) */}
                    <polyline
                      fill="none"
                      stroke="#00E599"
                      strokeWidth="2.5"
                      points="0,60 50,52 100,44 150,38 200,32 250,26 300,16"
                    />
                  </svg>
                  <div className="flex justify-between text-[10px] font-mono text-[#6F7887] border-t border-[#161C26] pt-1">
                    <span>JAN</span>
                    <span>MAR</span>
                    <span>MAY</span>
                    <span>JUL</span>
                    <span>SEP</span>
                    <span>NOV</span>
                  </div>
                </div>
              </div>

              {/* Right Chart: Five-Sleeve Targets */}
              <div className="p-3.5 rounded-md bg-[#0E121B] border border-[#161C26] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#6F7887]">
                    STRATEGY / FIVE-SLEEVE TARGETS
                  </div>
                  <h3 className="text-sm font-bold font-mono text-[#F0F4F8] mt-0.5">Sleeves vs target</h3>
                </div>

                <div className="space-y-2.5 my-2 text-xs font-mono">
                  {/* Sleeve 1: Core */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#F0F4F8] font-medium">Core (UCITS index ETFs)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#F0F4F8]">24% / 50%</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FF3B56]/15 text-[#FF3B56] border border-[#FF3B56]/30">
                          −26 PTS UNDER · REBALANCE
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#161C26] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00E599] rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>

                  {/* Sleeve 2: Conviction */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#F0F4F8] font-medium">Conviction (5–8 stocks)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#F0F4F8]">61% / 20%</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30">
                          +41 PTS OVER · REBALANCE
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#161C26] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFB020] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Sleeve 3: Trend */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#F0F4F8] font-medium">Trend (10-month MA ETFs)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#F0F4F8]">0% / 15%</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FF3B56]/15 text-[#FF3B56] border border-[#FF3B56]/30">
                          −15 PTS UNDER · REBALANCE
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#161C26] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF3B56] rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>

                  {/* Sleeve 4: Trading lab */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#F0F4F8] font-medium">Trading lab</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#F0F4F8]">0% / 5%</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#161C26] text-[#8C96A5]">
                          −5 PTS UNDER
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#161C26] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8C96A5] rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>

                  {/* Sleeve 5: Dry powder */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[#F0F4F8] font-medium">Dry powder (cash, T-bills)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#F0F4F8]">5% / 10%</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[#161C26] text-[#8C96A5]">
                          −5 PTS UNDER
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-[#161C26] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00B2FF] rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. US ESTATE-TAX TRACKER & INSTITUTIONAL RISK RULES */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* US Estate Tax Tracker ($60k limit) */}
              <div
                className={cn(
                  'p-4 rounded-lg border flex flex-col justify-between col-span-1 lg:col-span-2',
                  analysis.risk.us_estate_tax_alert
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : 'bg-[#0C0E14] border-[#1A202C]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {analysis.risk.us_estate_tax_alert ? (
                        <ShieldAlert className="h-5 w-5 text-amber-400" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-[#00E599]" />
                      )}
                      <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                        {language === 'id'
                          ? 'Pajak Waris Saham AS (US Estate Tax · $60,000 Limit)'
                          : 'US Situs Estate-Tax Tracker (Non-Resident Alien $60k Limit)'}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded border font-semibold',
                        analysis.risk.us_estate_tax_alert
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                          : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      )}
                    >
                      {analysis.risk.us_estate_tax_alert ? 'OVER $60K EXEMPTION' : 'WITHIN $60K SAFE ZONE'}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#6F7887] mt-2">
                    {analysis.risk.us_estate_tax_message}
                  </p>
                </div>

                {/* Progress bar toward $60k limit */}
                <div className="mt-4 pt-3 border-t border-[#1A202C]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#6F7887]">US Situs Equities Exposure:</span>
                    <span className="font-bold text-white">
                      US$ {analysis.risk.us_estate_tax_exposure_usd.toLocaleString()} / US$ 60,000
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#1A202C] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-500',
                        analysis.risk.us_estate_tax_alert ? 'bg-amber-400' : 'bg-[#00E599]'
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          (analysis.risk.us_estate_tax_exposure_usd / analysis.risk.us_estate_tax_limit_usd) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Governance & Risk Caps (8% Warning, 12% Trim) */}
              <div className="p-4 rounded-lg bg-[#0C0E14] border border-[#1A202C] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                      {language === 'id' ? 'Batas Risiko (8% Cap / 12% Trim)' : 'Position Caps & Risk Metrics'}
                    </h3>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {analysis.risk.position_cap_warnings.length > 0 ? (
                      analysis.risk.position_cap_warnings.map((warn, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono px-2 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-amber-300"
                        >
                          {warn}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-mono text-emerald-400">
                        ✓ All positions within institutional 8% concentration limit.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1A202C]/60 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#6F7887] text-[10px]">Beta (vs Benchmark)</span>
                    <p className="font-bold text-white">{analysis.risk.portfolio_beta.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[#6F7887] text-[10px]">Annualized Volatility</span>
                    <p className="font-bold text-white">{analysis.risk.annualized_volatility.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. ALLOCATION BREAKDOWNS (SECTOR / COUNTRY / CURRENCY) */}
            <section className="p-4 rounded-lg bg-[#0C0E14] border border-[#1A202C] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-[#00E599]" />
                  <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-white">
                    {language === 'id' ? 'Alokasi Portofolio' : 'Asset Allocation Breakdown'}
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-[#07080A] p-1 rounded-md border border-[#1A202C]">
                  <button
                    type="button"
                    onClick={() => setAllocationTab('SECTOR')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-mono rounded transition-all',
                      allocationTab === 'SECTOR'
                        ? 'bg-[#1A202C] text-[#00E599] font-bold'
                        : 'text-[#6F7887] hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Sector
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationTab('COUNTRY')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-mono rounded transition-all',
                      allocationTab === 'COUNTRY'
                        ? 'bg-[#1A202C] text-[#00E599] font-bold'
                        : 'text-[#6F7887] hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Globe2 className="h-3 w-3" /> Country
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationTab('CURRENCY')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-mono rounded transition-all',
                      allocationTab === 'CURRENCY'
                        ? 'bg-[#1A202C] text-[#00E599] font-bold'
                        : 'text-[#6F7887] hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3" /> Currency
                    </span>
                  </button>
                </div>
              </div>

              {/* Progress Bar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(
                  allocationTab === 'SECTOR'
                    ? analysis.allocation.by_sector
                    : allocationTab === 'COUNTRY'
                    ? analysis.allocation.by_country
                    : analysis.allocation.by_currency
                ).map(([key, weight]) => (
                  <div key={key} className="p-2.5 rounded bg-[#07080A]/60 border border-[#1A202C]/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-white">{key}</span>
                      <span className="text-[#00E599] font-bold">{weight.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1A202C] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00E599] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, weight)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. HOLDINGS DESK (RESPONSIVE TABLE FOR DESKTOP / CARDS FOR MOBILE) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#00C2FF]" />
                  <h3 className="font-mono font-bold text-sm tracking-wider uppercase text-white">
                    {language === 'id' ? 'Daftar Posisi Saham & ETF' : 'Holdings & Lot Execution Records'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#6F7887]">
                  {analysis.holdings.length} {language === 'id' ? 'Aset Terdaftar' : 'Tracked Holdings'}
                </span>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-[#1A202C] bg-[#0C0E14]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1A202C] bg-[#07080A]/80 text-[10px] font-mono text-[#6F7887] uppercase tracking-wider">
                      <th className="py-3 px-4">Instrument</th>
                      <th className="py-3 px-3 text-right">Shares / Lots</th>
                      <th className="py-3 px-3 text-right">Cost Basis</th>
                      <th className="py-3 px-3 text-right">Current Price</th>
                      <th className="py-3 px-4 text-right">Current Value ({baseCurrency})</th>
                      <th className="py-3 px-3 text-right">Stock Move</th>
                      <th className="py-3 px-3 text-right">FX Move</th>
                      <th className="py-3 px-4 text-right">Total P&L</th>
                      <th className="py-3 px-3 text-center">Weight</th>
                      <th className="py-3 px-3 text-center">Tax Notes</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A202C]/60 text-xs font-mono">
                    {analysis.holdings.map((p) => {
                      const posProfit = p.unrealized_pnl_base >= 0
                      return (
                        <tr key={p.holding.id} className="hover:bg-[#1A202C]/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{p.holding.ticker}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1A202C] text-[#6F7887]">
                                {p.holding.exchange}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#6F7887] truncate max-w-[150px]">
                              {p.holding.company_name}
                            </p>
                          </td>

                          <td className="py-3 px-3 text-right text-white">
                            {p.holding.shares.toLocaleString()}
                          </td>

                          <td className="py-3 px-3 text-right text-[#6F7887]">
                            {p.holding.currency} {p.holding.cost_basis.toLocaleString()}
                          </td>

                          <td className="py-3 px-3 text-right text-white font-semibold">
                            {p.holding.currency} {p.current_price.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right text-white font-bold">
                            {baseCurrency} {p.current_value_base.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td
                            className={cn(
                              'py-3 px-3 text-right font-semibold',
                              p.stock_return_pct >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'
                            )}
                          >
                            {p.stock_return_pct >= 0 ? '+' : ''}
                            {p.stock_return_pct.toFixed(2)}%
                          </td>

                          <td
                            className={cn(
                              'py-3 px-3 text-right font-semibold',
                              p.fx_return_pct >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'
                            )}
                          >
                            {p.fx_return_pct >= 0 ? '+' : ''}
                            {p.fx_return_pct.toFixed(2)}%
                          </td>

                          <td
                            className={cn(
                              'py-3 px-4 text-right font-bold',
                              posProfit ? 'text-[#00E599]' : 'text-[#FF4444]'
                            )}
                          >
                            {posProfit ? '+' : ''}
                            {p.unrealized_pnl_percent.toFixed(2)}%
                            <div className="text-[10px] font-normal text-[#6F7887]">
                              {posProfit ? '+' : ''}
                              {baseCurrency} {p.unrealized_pnl_base.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold',
                                p.is_above_12pct_trim
                                  ? 'bg-red-950/60 text-red-400 border border-red-800'
                                  : p.is_above_8pct_cap
                                  ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                                  : 'text-white'
                              )}
                            >
                              {p.weight_percent.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {p.us_withholding_tax_applied ? (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40"
                                title="30% US Withholding Tax on Dividends"
                              >
                                30% WHT
                              </span>
                            ) : p.holding.country === 'IE' ? (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40"
                                title="Irish UCITS: 0% US Estate Tax, 15% Internal WHT"
                              >
                                UCITS 0% ET
                              </span>
                            ) : (
                              <span className="text-[9px] text-[#6F7887]">0% WHT</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePosition(p.holding.id)}
                              className="p-1 rounded text-[#6F7887] hover:text-red-400 hover:bg-red-950/30 transition-all"
                              title="Delete position"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {analysis.holdings.map((p) => {
                  const posProfit = p.unrealized_pnl_base >= 0
                  return (
                    <div
                      key={p.holding.id}
                      className="p-3.5 rounded-lg bg-[#0C0E14] border border-[#1A202C] space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">{p.holding.ticker}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1A202C] text-[#6F7887]">
                              {p.holding.exchange}
                            </span>
                            {p.us_withholding_tax_applied && (
                              <span className="text-[9px] px-1 rounded bg-amber-950/40 text-amber-300">
                                30% WHT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6F7887] font-mono mt-0.5">{p.holding.company_name}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePosition(p.holding.id)}
                          className="p-1 rounded text-[#6F7887] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#1A202C]/60">
                        <div>
                          <span className="text-[10px] text-[#6F7887]">Holdings</span>
                          <p className="font-semibold text-white">
                            {p.holding.shares.toLocaleString()} @ {p.holding.currency} {p.holding.cost_basis}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#6F7887]">Current Value ({baseCurrency})</span>
                          <p className="font-bold text-white">
                            {baseCurrency} {p.current_value_base.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#1A202C]/60">
                        <div>
                          <span className="text-[10px] text-[#6F7887]">Stock / FX Return</span>
                          <p className="font-semibold">
                            <span className={p.stock_return_pct >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'}>
                              {p.stock_return_pct >= 0 ? '+' : ''}
                              {p.stock_return_pct.toFixed(1)}%
                            </span>{' '}
                            /{' '}
                            <span className={p.fx_return_pct >= 0 ? 'text-[#00E599]' : 'text-[#FF4444]'}>
                              {p.fx_return_pct >= 0 ? '+' : ''}
                              {p.fx_return_pct.toFixed(1)}%
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#6F7887]">Total P&L</span>
                          <p className={cn('font-bold', posProfit ? 'text-[#00E599]' : 'text-[#FF4444]')}>
                            {posProfit ? '+' : ''}
                            {p.unrealized_pnl_percent.toFixed(2)}% ({baseCurrency} {p.unrealized_pnl_base.toFixed(0)})
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {/* 5. ADD POSITION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-[#0C0E14] border border-[#1A202C] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1A202C] pb-3">
              <h3 className="font-mono font-bold text-sm uppercase text-white">
                {language === 'id' ? 'Tambah Posisi Saham / ETF' : 'Add Position Lot'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#6F7887] hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPosition} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#6F7887] block mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. NVDA, D05.SI, BBCA.JK, CSPX.L"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                  required
                />
              </div>

              <div>
                <label className="text-[#6F7887] block mb-1">Company / ETF Name</label>
                <input
                  type="text"
                  placeholder="e.g. NVIDIA Corporation"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6F7887] block mb-1">Exchange</label>
                  <select
                    value={newExchange}
                    onChange={(e) => {
                      setNewExchange(e.target.value)
                      if (e.target.value === 'SGX') {
                        setNewCurrency('SGD')
                        setNewCountry('SG')
                      } else if (e.target.value === 'IDX') {
                        setNewCurrency('IDR')
                        setNewCountry('ID')
                      } else if (e.target.value === 'LSE') {
                        setNewCurrency('USD')
                        setNewCountry('IE')
                      } else {
                        setNewCurrency('USD')
                        setNewCountry('US')
                      }
                    }}
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                  >
                    <option value="US">US (NYSE / NASDAQ)</option>
                    <option value="SGX">SGX (Singapore)</option>
                    <option value="IDX">IDX (Indonesia)</option>
                    <option value="LSE">LSE (London UCITS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#6F7887] block mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="IDR">IDR (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#6F7887] block mb-1">Shares Count</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 100"
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[#6F7887] block mb-1">Cost Basis per Share</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 115.00"
                    value={newCostBasis}
                    onChange={(e) => setNewCostBasis(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#1A202C] text-white focus:outline-none focus:border-[#00E599]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1A202C]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-[#1A202C] text-[#6F7887] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#00E599] text-black font-bold hover:bg-[#00c784]"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
