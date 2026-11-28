'use client'

import React, { useState, useMemo } from 'react'
import {
  usePaperTradingStore,
  type PaperPosition,
  type PaperTradeHistory,
} from '@/stores/usePaperTradingStore'
import { useStockDesk } from '@/hooks/useStockDesk'
import {
  formatCurrency,
  formatPercent,
  isIdxTicker,
  getIdxTickSize,
  snapToIdxTick,
  stepIdxPrice,
  calculateLotValue,
  calculateEstimatedFee,
} from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  DollarSign,
  Wallet,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'

interface PaperTradingDeskProps {
  ticker: string
  currentPrice: number
  companyName?: string
  currency?: string
  volume?: number
}

export function PaperTradingDesk({
  ticker,
  currentPrice,
  companyName,
  currency = 'USD',
  volume,
}: PaperTradingDeskProps) {
  const isIdx = isIdxTicker(ticker) || currency === 'IDR'
  const actualCurrency: 'IDR' | 'USD' = isIdx ? 'IDR' : 'USD'
  const [showAlmgrenChriss, setShowAlmgrenChriss] = useState<boolean>(false)

  // Store access
  const {
    cashBalanceIDR,
    cashBalanceUSD,
    positions,
    history,
    openPosition,
    closePosition,
    resetAccount,
    getPositionForTicker,
  } = usePaperTradingStore()

  // Desk analysis for smart target import
  const { data: deskData } = useStockDesk(ticker)

  const activePosition = getPositionForTicker(ticker)
  const cashBalance = actualCurrency === 'IDR' ? cashBalanceIDR : cashBalanceUSD

  // Form states
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [limitPrice, setLimitPrice] = useState<number>(() =>
    isIdx ? snapToIdxTick(currentPrice) : currentPrice
  )
  const [lots, setLots] = useState<number>(1)
  const [sharesInput, setSharesInput] = useState<number>(10)
  const [takeProfit, setTakeProfit] = useState<string>('')
  const [stopLoss, setStopLoss] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'ticket' | 'portfolio' | 'history'>('ticket')

  const effectivePrice = orderType === 'MARKET' ? currentPrice : limitPrice
  const totalShares = isIdx ? lots * 100 : sharesInput

  // Calculations
  const grossCapital = effectivePrice * totalShares
  const feeRate = side === 'BUY' ? 0.0015 : 0.0025
  const estimatedFee = Math.round(grossCapital * feeRate)
  const totalCapitalRequired = grossCapital + estimatedFee

  const tpNum = parseFloat(takeProfit) || 0
  const slNum = parseFloat(stopLoss) || 0

  // Risk / Reward Ratio calculation
  const riskRewardMetrics = useMemo(() => {
    if (tpNum <= 0 || slNum <= 0 || effectivePrice <= 0) return null

    const potentialGainPerShare = tpNum - effectivePrice
    const potentialLossPerShare = effectivePrice - slNum

    if (potentialLossPerShare <= 0) return null

    const ratio = potentialGainPerShare / potentialLossPerShare
    const maxGain = potentialGainPerShare * totalShares
    const maxLoss = potentialLossPerShare * totalShares

    return {
      ratio: ratio > 0 ? ratio.toFixed(2) : 'N/A',
      potentialGainPct: ((tpNum - effectivePrice) / effectivePrice) * 100,
      potentialLossPct: ((effectivePrice - slNum) / effectivePrice) * 100,
      maxGain,
      maxLoss,
    }
  }, [tpNum, slNum, effectivePrice, totalShares])

  // Handlers for tick stepping (IDX BEI Fraksi)
  const handleTickStep = (steps: number) => {
    if (!isIdx) {
      setLimitPrice((prev) => Math.max(0.01, parseFloat((prev + steps * 0.5).toFixed(2))))
      return
    }
    setLimitPrice((prev) => stepIdxPrice(prev, steps))
  }

  // Quick lot percentage allocation
  const handleQuickAllocation = (pct: number) => {
    if (effectivePrice <= 0) return
    const allocCash = cashBalance * (pct / 100)
    if (isIdx) {
      const perLotCost = effectivePrice * 100 * (1 + feeRate)
      const calculatedLots = Math.max(1, Math.floor(allocCash / perLotCost))
      setLots(calculatedLots)
    } else {
      const perShareCost = effectivePrice * (1 + feeRate)
      const calculatedShares = Math.max(1, Math.floor(allocCash / perShareCost))
      setSharesInput(calculatedShares)
    }
  }

  // Quick preset percentages for TP / SL
  const handlePresetBracket = (type: 'tp' | 'sl', pct: number) => {
    if (type === 'tp') {
      const target = effectivePrice * (1 + pct / 100)
      setTakeProfit(isIdx ? snapToIdxTick(target, true).toString() : target.toFixed(2))
    } else {
      const stop = effectivePrice * (1 - pct / 100)
      setStopLoss(isIdx ? snapToIdxTick(stop, false).toString() : stop.toFixed(2))
    }
  }

  // Import institutional targets from technical desk
  const handleImportDeskTargets = () => {
    if (!deskData?.trade_plan) {
      toast.error('No institutional desk trade plan available for this symbol')
      return
    }

    const { target_1, stop_loss } = deskData.trade_plan
    if (target_1) {
      setTakeProfit(isIdx ? snapToIdxTick(target_1).toString() : target_1.toFixed(2))
    }
    if (stop_loss) {
      setStopLoss(isIdx ? snapToIdxTick(stop_loss).toString() : stop_loss.toFixed(2))
    }
    toast.success('Imported optimal Target 1 & Stop Loss from Technical Desk!')
  }

  // Submit simulated order
  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault()

    if (totalShares <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    if (effectivePrice <= 0) {
      toast.error('Price must be greater than zero')
      return
    }

    const res = openPosition({
      ticker,
      companyName,
      side,
      shares: totalShares,
      lots: isIdx ? lots : undefined,
      entryPrice: effectivePrice,
      currentPrice,
      takeProfit: tpNum > 0 ? tpNum : undefined,
      stopLoss: slNum > 0 ? slNum : undefined,
      currency: actualCurrency,
    })

    if (res.success) {
      toast.success(res.message)
      setActiveTab('ticket')
    } else {
      toast.error(res.message)
    }
  }

  // Close active position
  const handleClosePosition = (positionId: string) => {
    const res = closePosition(positionId, currentPrice)
    if (res.success) {
      toast.success(res.message)
    } else {
      toast.error(res.message)
    }
  }

  // Reset account confirmation
  const handleReset = () => {
    if (window.confirm('Reset simulated portfolio cash balance and clear all paper trade history?')) {
      resetAccount()
      toast.info('Simulated account reset to initial starting capital.')
    }
  }

  // Overall portfolio telemetry
  const totalOpenPositionValue = positions
    .filter((p) => p.currency === actualCurrency)
    .reduce((sum, p) => sum + p.currentPrice * p.shares, 0)

  const totalPortfolioEquity = cashBalance + totalOpenPositionValue

  // Almgren-Chriss Market Impact Model
  const executionModel = useMemo(() => {
    const adv = volume && volume > 0 ? volume : 15_000_000
    const participationRate = (totalShares / adv) * 100
    const isRetail = lots < 500 && participationRate < 0.1

    // Power-law slippage estimate
    const rawSlippagePct = 0.12 * Math.pow(totalShares / (adv * 0.1), 0.6)
    const slippagePct = Math.min(Math.max(rawSlippagePct, 0.01), 5.0)
    const slippageCost = Math.round(grossCapital * (slippagePct / 100))
    const impactPerShare = Math.round(effectivePrice * (slippagePct / 100))

    return {
      adv,
      participationRate: participationRate.toFixed(3),
      slippagePct: slippagePct.toFixed(2),
      slippageCost,
      impactPerShare,
      isRetail,
    }
  }, [totalShares, grossCapital, effectivePrice, lots, volume])

  const totalUnrealizedPnl = positions
    .filter((p) => p.currency === actualCurrency)
    .reduce((sum, p) => {
      const grossDiff = p.side === 'BUY'
        ? (p.currentPrice - p.entryPrice) * p.shares
        : (p.entryPrice - p.currentPrice) * p.shares
      const exitFeeRate = p.side === 'BUY' ? 0.0025 : 0.0015
      const exitFee = Math.round(p.currentPrice * p.shares * exitFeeRate)
      return sum + (grossDiff - exitFee)
    }, 0)

  return (
    <div className="space-y-4">
      {/* 1. VIRTUAL ACCOUNT TELEMETRY HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 rounded-md border border-[#222226] bg-[#0f0f12] p-3.5">
        <div>
          <div className="text-[11px] font-mono text-[#71717a] uppercase flex items-center gap-1">
            <Wallet className="h-3 w-3 text-[#a1a1aa]" />
            <span>Virtual Cash</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#f4f4f5] tabular-nums">
            {formatCurrency(cashBalance, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono">Available Liquidity</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#71717a] uppercase flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-[#a1a1aa]" />
            <span>Portfolio Equity</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#f4f4f5] tabular-nums">
            {formatCurrency(totalPortfolioEquity, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono">Cash + Open Positions</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#71717a] uppercase flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-[#a1a1aa]" />
            <span>Unrealized P&L</span>
          </div>
          <div
            className={cn(
              'mt-1 font-mono text-base font-bold tabular-nums',
              totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            {formatCurrency(totalUnrealizedPnl, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono">Across Open Positions</div>
        </div>

        <div className="flex flex-col justify-between items-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-mono text-[#71717a] hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
            title="Reset simulated cash and clear history"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Account</span>
          </button>
          <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141418] text-[#a1a1aa] border border-[#222226]">
            Zero Financial Risk
          </div>
        </div>
      </div>

      {/* 2. TAB TOGGLES: ORDER TICKET, ACTIVE POSITIONS, TRADE LOG */}
      <div className="flex items-center gap-2 border-b border-[#222226] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('ticket')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold',
            activeTab === 'ticket'
              ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          Execution Ticket: {ticker}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold flex items-center gap-1.5',
            activeTab === 'portfolio'
              ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          <span>Open Positions</span>
          <span className={cn(
            'px-1.5 py-0.2 text-[10px] rounded-full',
            activeTab === 'portfolio' ? 'bg-[#09090b]/15 text-[#09090b]' : 'bg-[#18181b] text-[#a1a1aa]'
          )}>
            {positions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold flex items-center gap-1.5',
            activeTab === 'history'
              ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
              : 'text-[#71717a] hover:text-[#f4f4f5]'
          )}
        >
          <span>Trade History</span>
          <span className={cn(
            'px-1.5 py-0.2 text-[10px] rounded-full',
            activeTab === 'history' ? 'bg-[#09090b]/15 text-[#09090b]' : 'bg-[#18181b] text-[#a1a1aa]'
          )}>
            {history.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ORDER TICKET */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Order Form */}
          <div className="lg:col-span-7 rounded-md border border-[#222226] bg-[#0f0f12] p-4 space-y-4">
            {/* BUY / SELL Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={cn(
                  'py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border',
                  side === 'BUY'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#09090b] text-[#71717a] border-[#222226] hover:text-[#f4f4f5]'
                )}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={cn(
                  'py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border',
                  side === 'SELL'
                    ? 'bg-red-500/15 text-red-400 border-red-500/40'
                    : 'bg-[#09090b] text-[#71717a] border-[#222226] hover:text-[#f4f4f5]'
                )}
              >
                SELL
              </button>
            </div>

            {/* Order Type: Market vs Limit */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#71717a] text-[11px]">Type:</span>
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors cursor-pointer',
                  orderType === 'MARKET'
                    ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                    : 'text-[#71717a] hover:text-[#f4f4f5]'
                )}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors cursor-pointer',
                  orderType === 'LIMIT'
                    ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                    : 'text-[#71717a] hover:text-[#f4f4f5]'
                )}
              >
                Limit Order
              </button>
            </div>

            {/* Price Selection (with Fraksi BEI stepping if IDX) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#71717a]">
                  {orderType === 'MARKET' ? 'Market Execution Price' : 'Limit Entry Price'}
                </span>
                {isIdx && (
                  <span className="text-[10px] text-[#a1a1aa]">
                    Fraksi BEI: Rp {getIdxTickSize(effectivePrice)}/tick
                  </span>
                )}
              </div>

              {orderType === 'MARKET' ? (
                <div className="flex items-center justify-between px-3 py-2 rounded bg-[#09090b] border border-[#222226] font-mono text-sm text-[#f4f4f5] tabular-nums">
                  <span>{formatCurrency(currentPrice, actualCurrency)}</span>
                  <span className="text-[10px] text-[#71717a]">Live Quote</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTickStep(-1)}
                    className="px-2.5 py-2 rounded bg-[#09090b] border border-[#222226] text-xs font-mono text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#141418] cursor-pointer"
                    title="-1 Tick"
                  >
                    -1T
                  </button>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                    step={isIdx ? getIdxTickSize(limitPrice) : 0.01}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#222226] font-mono text-sm text-[#f4f4f5] focus:outline-hidden focus:border-[#f4f4f5]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTickStep(1)}
                    className="px-2.5 py-2 rounded bg-[#09090b] border border-[#222226] text-xs font-mono text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#141418] cursor-pointer"
                    title="+1 Tick"
                  >
                    +1T
                  </button>
                </div>
              )}
            </div>

            {/* Quantity: Lots for IDX, Shares for US */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#71717a]">
                  {isIdx ? 'Quantity (Lots @ 100 shares)' : 'Quantity (Shares)'}
                </span>
                <span className="text-[11px] text-[#a1a1aa] font-mono">
                  = {totalShares.toLocaleString()} shares
                </span>
              </div>

              {isIdx ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min={1}
                    value={lots}
                    onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#222226] font-mono text-sm text-[#f4f4f5] focus:outline-hidden focus:border-[#f4f4f5]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 5, 10, 25, 50, 100].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLots(l)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border',
                          lots === l
                            ? 'bg-[#f4f4f5] text-[#09090b] border-[#f4f4f5] font-bold'
                            : 'bg-[#09090b] text-[#71717a] border-[#222226] hover:text-[#f4f4f5]'
                        )}
                      >
                        {l} Lot
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleQuickAllocation(25)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#09090b] text-amber-400 border border-[#222226] hover:bg-[#141418] cursor-pointer"
                    >
                      25% Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAllocation(50)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#09090b] text-amber-400 border border-[#222226] hover:bg-[#141418] cursor-pointer"
                    >
                      50% Cash
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="number"
                    min={1}
                    value={sharesInput}
                    onChange={(e) => setSharesInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#222226] font-mono text-sm text-[#f4f4f5] focus:outline-hidden focus:border-[#f4f4f5]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 5, 10, 50, 100].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSharesInput(s)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border',
                          sharesInput === s
                            ? 'bg-[#f4f4f5] text-[#09090b] border-[#f4f4f5] font-bold'
                            : 'bg-[#09090b] text-[#71717a] border-[#222226] hover:text-[#f4f4f5]'
                        )}
                      >
                        {s} sh
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Integrated Almgren-Chriss Market Impact & Lot Execution */}
            {isIdx && (
              <div className="space-y-2 rounded bg-[#09090b] p-2.5 border border-[#222226]">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#a1a1aa] flex items-center gap-1.5 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {executionModel.isRetail ? 'Retail Execution (< 500 lots)' : 'Institutional Execution'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAlmgrenChriss(!showAlmgrenChriss)}
                    className="text-[#f4f4f5] hover:underline text-[10px] cursor-pointer"
                  >
                    {showAlmgrenChriss ? 'Hide Impact Model' : 'Impact Model (Almgren-Chriss)'}
                  </button>
                </div>

                {executionModel.isRetail && !showAlmgrenChriss ? (
                  <div className="text-[10px] text-[#71717a] font-mono">
                    Standard Retail Order ({lots} lot): Zero adverse price impact (Participation: {executionModel.participationRate}% of ADV).
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-[#222226] font-mono text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#141418] p-1.5 rounded border border-[#222226]">
                        <span className="text-[9px] text-[#71717a] block uppercase">Participation Rate</span>
                        <span className="font-bold text-[#f4f4f5]">{executionModel.participationRate}%</span>
                      </div>
                      <div className="bg-[#141418] p-1.5 rounded border border-[#222226]">
                        <span className="text-[9px] text-[#71717a] block uppercase">Est. Slippage Impact</span>
                        <span className="font-bold text-amber-400">~{executionModel.slippagePct}%</span>
                        <span className="text-[9px] text-[#71717a] block">({formatCurrency(executionModel.slippageCost, 'IDR')})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk & Reward Bracket (TP & SL) */}
            <div className="space-y-2 pt-2 border-t border-[#222226]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#f4f4f5]">
                  Risk Management Bracket
                </span>
                <button
                  type="button"
                  onClick={handleImportDeskTargets}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#f4f4f5] hover:underline cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Import Desk Targets</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Profit */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                    <span>Take Profit (TP)</span>
                    {tpNum > effectivePrice && (
                      <span className="text-[10px]">
                        +{(((tpNum - effectivePrice) / effectivePrice) * 100).toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    aria-label="Take Profit Target"
                    placeholder={`e.g. ${isIdx ? (effectivePrice * 1.05).toFixed(0) : (effectivePrice * 1.05).toFixed(2)}`}
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#09090b] border border-[#222226] font-mono text-xs text-emerald-400 focus:outline-hidden focus:border-emerald-400"
                  />
                  <div className="flex gap-1">
                    {[5, 10, 15].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePresetBracket('tp', p)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#09090b] text-[#71717a] hover:text-emerald-400 border border-[#222226] cursor-pointer"
                      >
                        +{p}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-red-400 flex items-center justify-between">
                    <span>Stop Loss (SL)</span>
                    {slNum > 0 && slNum < effectivePrice && (
                      <span className="text-[10px]">
                        -{(((effectivePrice - slNum) / effectivePrice) * 100).toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    aria-label="Stop Loss Target"
                    placeholder={`e.g. ${isIdx ? (effectivePrice * 0.95).toFixed(0) : (effectivePrice * 0.95).toFixed(2)}`}
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#09090b] border border-[#222226] font-mono text-xs text-red-400 focus:outline-hidden focus:border-red-400"
                  />
                  <div className="flex gap-1">
                    {[3, 5, 7].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePresetBracket('sl', p)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#09090b] text-[#71717a] hover:text-red-400 border border-[#222226] cursor-pointer"
                      >
                        -{p}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              onClick={handleExecuteOrder}
              disabled={totalCapitalRequired > cashBalance && side === 'BUY'}
              className={cn(
                'w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer',
                side === 'BUY'
                  ? 'bg-[#f4f4f5] text-[#09090b] hover:bg-white disabled:opacity-50'
                  : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
              )}
            >
              Execute Simulated {side} ({formatCurrency(totalCapitalRequired, actualCurrency)})
            </button>
          </div>

          {/* Telemetry Summary & Active Position Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Order Telemetry Breakdown */}
            <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4 space-y-3 font-mono text-xs">
              <div className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider pb-1 border-b border-[#222226]">
                Execution Telemetry
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#71717a]">Gross Order Value:</span>
                  <span className="text-[#f4f4f5] tabular-nums">{formatCurrency(grossCapital, actualCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717a]">Est. Broker Fee ({side === 'BUY' ? '0.15%' : '0.25%'}):</span>
                  <span className="text-[#a1a1aa] tabular-nums">{formatCurrency(estimatedFee, actualCurrency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#222226] font-bold">
                  <span className="text-[#f4f4f5]">Net Capital Required:</span>
                  <span className="text-[#f4f4f5] tabular-nums">{formatCurrency(totalCapitalRequired, actualCurrency)}</span>
                </div>
              </div>

              {riskRewardMetrics && (
                <div className="pt-2 border-t border-[#222226] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717a]">Risk/Reward Ratio:</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#18181b] text-[#f4f4f5] border border-[#27272a] font-bold">
                      1 : {riskRewardMetrics.ratio}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#71717a]">Potential Profit (TP):</span>
                    <span className="text-emerald-400 tabular-nums">
                      +{formatCurrency(riskRewardMetrics.maxGain, actualCurrency)} ({riskRewardMetrics.potentialGainPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#71717a]">Max Loss (SL):</span>
                    <span className="text-red-400 tabular-nums">
                      -{formatCurrency(riskRewardMetrics.maxLoss, actualCurrency)} ({riskRewardMetrics.potentialLossPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Currently Active Position for this symbol (if any) */}
            {activePosition && (
              <div className="rounded-md border border-[#27272a] bg-[#0f0f12] p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#f4f4f5] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Open Position: {activePosition.ticker}
                  </span>
                  <span className="text-[10px] text-[#71717a]">
                    {new Date(activePosition.openedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#71717a]">Shares: </span>
                    <span className="text-[#f4f4f5] tabular-nums">
                      {activePosition.shares.toLocaleString()}
                      {activePosition.lots ? ` (${activePosition.lots} lot)` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#71717a]">Entry: </span>
                    <span className="text-[#f4f4f5] tabular-nums">{formatCurrency(activePosition.entryPrice, actualCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a]">Current: </span>
                    <span className="text-[#f4f4f5] tabular-nums">{formatCurrency(currentPrice, actualCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[#71717a]">P&L: </span>
                    {(() => {
                      const pnl = activePosition.side === 'BUY'
                        ? (currentPrice - activePosition.entryPrice) * activePosition.shares
                        : (activePosition.entryPrice - currentPrice) * activePosition.shares
                      const pnlPct = activePosition.entryPrice > 0 ? (pnl / (activePosition.entryPrice * activePosition.shares)) * 100 : 0
                      return (
                        <span className={cn('font-bold tabular-nums', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, actualCurrency)} ({pnlPct.toFixed(2)}%)
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleClosePosition(activePosition.id)}
                  className="w-full py-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Close Position (Market Exit at {formatCurrency(currentPrice, actualCurrency)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL OPEN POSITIONS */}
      {activeTab === 'portfolio' && (
        <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
          {positions.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-[#71717a]">
              No simulated positions currently open. Place an order via the Execution Ticket.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="border-b border-[#222226] text-[#71717a]">
                  <tr>
                    <th className="pb-2">Ticker</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Shares / Lots</th>
                    <th className="pb-2">Entry Price</th>
                    <th className="pb-2">Current Price</th>
                    <th className="pb-2">Unrealized P&L</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {positions.map((pos) => {
                    const diff = pos.side === 'BUY'
                      ? (pos.currentPrice - pos.entryPrice) * pos.shares
                      : (pos.entryPrice - pos.currentPrice) * pos.shares
                    const pnlPct = pos.entryPrice > 0 ? (diff / (pos.entryPrice * pos.shares)) * 100 : 0
                    return (
                      <tr key={pos.id} className="hover:bg-[#141418]">
                        <td className="py-2.5 font-bold text-[#f4f4f5]">{pos.ticker}</td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              pos.side === 'BUY'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            )}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 text-[#a1a1aa]">
                          {pos.shares.toLocaleString()} {pos.lots ? `(${pos.lots} L)` : ''}
                        </td>
                        <td className="py-2.5 text-[#f4f4f5] tabular-nums">
                          {formatCurrency(pos.entryPrice, pos.currency)}
                        </td>
                        <td className="py-2.5 text-[#f4f4f5] tabular-nums">
                          {formatCurrency(pos.currentPrice, pos.currency)}
                        </td>
                        <td className="py-2.5 tabular-nums">
                          <span className={diff >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff, pos.currency)} ({pnlPct.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[10px] font-semibold cursor-pointer"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRADE HISTORY */}
      {activeTab === 'history' && (
        <div className="rounded-md border border-[#222226] bg-[#0f0f12] p-4">
          {history.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-[#71717a]">
              No completed paper trades recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="border-b border-[#222226] text-[#71717a]">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Ticker</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Shares</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Exit</th>
                    <th className="pb-2 text-right">Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222226]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#141418]">
                      <td className="py-2.5 text-[#71717a]">
                        {new Date(h.closedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 font-bold text-[#f4f4f5]">{h.ticker}</td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            h.side === 'BUY'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          )}
                        >
                          {h.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#a1a1aa]">{h.shares.toLocaleString()}</td>
                      <td className="py-2.5 text-[#f4f4f5] tabular-nums">
                        {formatCurrency(h.entryPrice, h.currency)}
                      </td>
                      <td className="py-2.5 text-[#f4f4f5] tabular-nums">
                        {formatCurrency(h.exitPrice, h.currency)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={h.realizedPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {h.realizedPnl >= 0 ? '+' : ''}{formatCurrency(h.realizedPnl, h.currency)} ({h.realizedPnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
