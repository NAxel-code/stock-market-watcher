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
  currency?: 'IDR' | 'USD'
}

export function PaperTradingDesk({
  ticker,
  currentPrice,
  companyName,
  currency = 'USD',
}: PaperTradingDeskProps) {
  const isIdx = isIdxTicker(ticker) || currency === 'IDR'
  const actualCurrency: 'IDR' | 'USD' = isIdx ? 'IDR' : currency

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

  const totalUnrealizedPnl = positions
    .filter((p) => p.currency === actualCurrency)
    .reduce((sum, p) => {
      const grossDiff = (p.currentPrice - p.entryPrice) * p.shares
      const exitFee = Math.round(p.currentPrice * p.shares * 0.0025)
      return sum + (grossDiff - exitFee)
    }, 0)

  return (
    <div className="space-y-4">
      {/* 1. VIRTUAL ACCOUNT TELEMETRY HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 rounded-lg border border-[#161C26] bg-[#0D0F14] p-3.5">
        <div>
          <div className="text-[11px] font-mono text-[#6F7887] uppercase flex items-center gap-1">
            <Wallet className="h-3 w-3 text-[#00B2FF]" />
            <span>Virtual Cash</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#F0F4F8] tabular-nums">
            {formatCurrency(cashBalance, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#6F7887] font-mono">Available Liquidity</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#6F7887] uppercase flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-[#00E599]" />
            <span>Portfolio Equity</span>
          </div>
          <div className="mt-1 font-mono text-base font-bold text-[#F0F4F8] tabular-nums">
            {formatCurrency(totalPortfolioEquity, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#6F7887] font-mono">Cash + Open Positions</div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#6F7887] uppercase flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-[#FFB800]" />
            <span>Unrealized P&L</span>
          </div>
          <div
            className={cn(
              'mt-1 font-mono text-base font-bold tabular-nums',
              totalUnrealizedPnl >= 0 ? 'text-[#00E599]' : 'text-[#FF3B56]'
            )}
          >
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            {formatCurrency(totalUnrealizedPnl, actualCurrency)}
          </div>
          <div className="text-[10px] text-[#6F7887] font-mono">Across Open Positions</div>
        </div>

        <div className="flex flex-col justify-between items-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] font-mono text-[#6F7887] hover:text-[#FF3B56] p-1 rounded transition-colors cursor-pointer"
            title="Reset simulated cash and clear history"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Account</span>
          </button>
          <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161C26] text-[#8C96A5] border border-[#272E3B]">
            Zero Financial Risk
          </div>
        </div>
      </div>

      {/* 2. TAB TOGGLES: ORDER TICKET, ACTIVE POSITIONS, TRADE LOG */}
      <div className="flex items-center gap-2 border-b border-[#161C26] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('ticket')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold',
            activeTab === 'ticket'
              ? 'bg-[#161C26] text-[#00E599] border border-[#00E599]/30'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          Execution Ticket: {ticker}
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold flex items-center gap-1.5',
            activeTab === 'portfolio'
              ? 'bg-[#161C26] text-[#00B2FF] border border-[#00B2FF]/30'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          <span>Open Positions</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#121620] text-[#8C96A5]">
            {positions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-3 py-1.5 rounded transition-all cursor-pointer font-semibold flex items-center gap-1.5',
            activeTab === 'history'
              ? 'bg-[#161C26] text-[#FFB800] border border-[#FFB800]/30'
              : 'text-[#6F7887] hover:text-[#F0F4F8]'
          )}
        >
          <span>Trade History</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#121620] text-[#8C96A5]">
            {history.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ORDER TICKET */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Order Form */}
          <div className="lg:col-span-7 rounded-lg border border-[#161C26] bg-[#0D0F14] p-4 space-y-4">
            {/* BUY / SELL Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={cn(
                  'py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border',
                  side === 'BUY'
                    ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40 shadow-xs'
                    : 'bg-[#07080A] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8]'
                )}
              >
                BUY (Long Entry)
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={cn(
                  'py-2 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer border',
                  side === 'SELL'
                    ? 'bg-[#FF3B56]/15 text-[#FF3B56] border-[#FF3B56]/40 shadow-xs'
                    : 'bg-[#07080A] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8]'
                )}
              >
                SELL (Short / Exit)
              </button>
            </div>

            {/* Order Type: Market vs Limit */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#6F7887] text-[11px]">Type:</span>
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors cursor-pointer',
                  orderType === 'MARKET'
                    ? 'bg-[#161C26] text-[#F0F4F8] font-semibold'
                    : 'text-[#6F7887] hover:text-[#F0F4F8]'
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
                    ? 'bg-[#161C26] text-[#F0F4F8] font-semibold'
                    : 'text-[#6F7887] hover:text-[#F0F4F8]'
                )}
              >
                Limit Order
              </button>
            </div>

            {/* Price Selection (with Fraksi BEI stepping if IDX) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6F7887]">
                  {orderType === 'MARKET' ? 'Market Execution Price' : 'Limit Entry Price'}
                </span>
                {isIdx && (
                  <span className="text-[10px] text-[#00E599]">
                    Fraksi BEI: Rp {getIdxTickSize(effectivePrice)}/tick
                  </span>
                )}
              </div>

              {orderType === 'MARKET' ? (
                <div className="flex items-center justify-between px-3 py-2 rounded bg-[#07080A] border border-[#161C26] font-mono text-sm text-[#F0F4F8] tabular-nums">
                  <span>{formatCurrency(currentPrice, actualCurrency)}</span>
                  <span className="text-[10px] text-[#6F7887]">Live Quote</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTickStep(-1)}
                    className="px-2.5 py-2 rounded bg-[#07080A] border border-[#161C26] text-xs font-mono text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620] cursor-pointer"
                    title="-1 Tick"
                  >
                    -1T
                  </button>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                    step={isIdx ? getIdxTickSize(limitPrice) : 0.01}
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#161C26] font-mono text-sm text-[#F0F4F8] focus:outline-hidden focus:border-[#00B2FF]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTickStep(1)}
                    className="px-2.5 py-2 rounded bg-[#07080A] border border-[#161C26] text-xs font-mono text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620] cursor-pointer"
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
                <span className="text-[#6F7887]">
                  {isIdx ? 'Quantity (Lots @ 100 shares)' : 'Quantity (Shares)'}
                </span>
                <span className="text-[11px] text-[#8C96A5] font-mono">
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
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#161C26] font-mono text-sm text-[#F0F4F8] focus:outline-hidden focus:border-[#00B2FF]"
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
                            ? 'bg-[#161C26] text-[#00B2FF] border-[#00B2FF]/40'
                            : 'bg-[#07080A] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8]'
                        )}
                      >
                        {l} Lot
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleQuickAllocation(25)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#07080A] text-[#FFB800] border border-[#161C26] hover:bg-[#121620] cursor-pointer"
                    >
                      25% Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAllocation(50)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#07080A] text-[#FFB800] border border-[#161C26] hover:bg-[#121620] cursor-pointer"
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
                    className="w-full px-3 py-2 rounded bg-[#07080A] border border-[#161C26] font-mono text-sm text-[#F0F4F8] focus:outline-hidden focus:border-[#00B2FF]"
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
                            ? 'bg-[#161C26] text-[#00B2FF] border-[#00B2FF]/40'
                            : 'bg-[#07080A] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8]'
                        )}
                      >
                        {s} sh
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk & Reward Bracket (TP & SL) */}
            <div className="space-y-2 pt-2 border-t border-[#161C26]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#F0F4F8]">
                  Risk Management Bracket
                </span>
                <button
                  type="button"
                  onClick={handleImportDeskTargets}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#00E599] hover:underline cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Import Desk Targets</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Profit */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#00E599] flex items-center justify-between">
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
                    className="w-full px-2.5 py-1.5 rounded bg-[#07080A] border border-[#161C26] font-mono text-xs text-[#00E599] focus:outline-hidden focus:border-[#00E599]"
                  />
                  <div className="flex gap-1">
                    {[5, 10, 15].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePresetBracket('tp', p)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#07080A] text-[#6F7887] hover:text-[#00E599] border border-[#161C26] cursor-pointer"
                      >
                        +{p}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#FF3B56] flex items-center justify-between">
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
                    className="w-full px-2.5 py-1.5 rounded bg-[#07080A] border border-[#161C26] font-mono text-xs text-[#FF3B56] focus:outline-hidden focus:border-[#FF3B56]"
                  />
                  <div className="flex gap-1">
                    {[3, 5, 7].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePresetBracket('sl', p)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#07080A] text-[#6F7887] hover:text-[#FF3B56] border border-[#161C26] cursor-pointer"
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
                'w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm',
                side === 'BUY'
                  ? 'bg-[#00E599] text-[#07080A] hover:bg-[#00E599]/90 disabled:opacity-50'
                  : 'bg-[#FF3B56] text-white hover:bg-[#FF3B56]/90 disabled:opacity-50'
              )}
            >
              Execute Simulated {side} ({formatCurrency(totalCapitalRequired, actualCurrency)})
            </button>
          </div>

          {/* Telemetry Summary & Active Position Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Order Telemetry Breakdown */}
            <div className="rounded-lg border border-[#161C26] bg-[#0D0F14] p-4 space-y-3 font-mono text-xs">
              <div className="text-[11px] font-semibold text-[#8C96A5] uppercase tracking-wider pb-1 border-b border-[#161C26]">
                Execution Telemetry
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#6F7887]">Gross Order Value:</span>
                  <span className="text-[#F0F4F8] tabular-nums">{formatCurrency(grossCapital, actualCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7887]">Est. Broker Fee ({side === 'BUY' ? '0.15%' : '0.25%'}):</span>
                  <span className="text-[#8C96A5] tabular-nums">{formatCurrency(estimatedFee, actualCurrency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#161C26] font-bold">
                  <span className="text-[#F0F4F8]">Net Capital Required:</span>
                  <span className="text-[#00E599] tabular-nums">{formatCurrency(totalCapitalRequired, actualCurrency)}</span>
                </div>
              </div>

              {riskRewardMetrics && (
                <div className="pt-2 border-t border-[#161C26] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#6F7887]">Risk/Reward Ratio:</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 font-bold">
                      1 : {riskRewardMetrics.ratio}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6F7887]">Potential Profit (TP):</span>
                    <span className="text-[#00E599] tabular-nums">
                      +{formatCurrency(riskRewardMetrics.maxGain, actualCurrency)} ({riskRewardMetrics.potentialGainPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#6F7887]">Max Loss (SL):</span>
                    <span className="text-[#FF3B56] tabular-nums">
                      -{formatCurrency(riskRewardMetrics.maxLoss, actualCurrency)} ({riskRewardMetrics.potentialLossPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Currently Active Position for this symbol (if any) */}
            {activePosition && (
              <div className="rounded-lg border border-[#00B2FF]/30 bg-[#00B2FF]/10 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#00B2FF] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#00B2FF] animate-pulse" />
                    Open Position: {activePosition.ticker}
                  </span>
                  <span className="text-[10px] text-[#6F7887]">
                    {new Date(activePosition.openedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#6F7887]">Shares: </span>
                    <span className="text-[#F0F4F8] tabular-nums">
                      {activePosition.shares.toLocaleString()}
                      {activePosition.lots ? ` (${activePosition.lots} lot)` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6F7887]">Entry: </span>
                    <span className="text-[#F0F4F8] tabular-nums">{formatCurrency(activePosition.entryPrice, actualCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7887]">Current: </span>
                    <span className="text-[#F0F4F8] tabular-nums">{formatCurrency(currentPrice, actualCurrency)}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7887]">P&L: </span>
                    {(() => {
                      const pnl = (currentPrice - activePosition.entryPrice) * activePosition.shares
                      const pnlPct = activePosition.entryPrice > 0 ? (pnl / (activePosition.entryPrice * activePosition.shares)) * 100 : 0
                      return (
                        <span className={cn('font-bold tabular-nums', pnl >= 0 ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl, actualCurrency)} ({pnlPct.toFixed(2)}%)
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleClosePosition(activePosition.id)}
                  className="w-full py-2 rounded bg-[#FF3B56]/20 text-[#FF3B56] hover:bg-[#FF3B56]/30 border border-[#FF3B56]/40 font-mono text-[11px] font-semibold transition-colors cursor-pointer"
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
        <div className="rounded-lg border border-[#161C26] bg-[#0D0F14] p-4">
          {positions.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-[#6F7887]">
              No simulated positions currently open. Place an order via the Execution Ticket.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="border-b border-[#161C26] text-[#6F7887]">
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
                <tbody className="divide-y divide-[#161C26]">
                  {positions.map((pos) => {
                    const diff = (pos.currentPrice - pos.entryPrice) * pos.shares
                    const pnlPct = pos.entryPrice > 0 ? (diff / (pos.entryPrice * pos.shares)) * 100 : 0
                    return (
                      <tr key={pos.id} className="hover:bg-[#121620]">
                        <td className="py-2.5 font-bold text-[#F0F4F8]">{pos.ticker}</td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              pos.side === 'BUY'
                                ? 'bg-[#00E599]/15 text-[#00E599]'
                                : 'bg-[#FF3B56]/15 text-[#FF3B56]'
                            )}
                          >
                            {pos.side}
                          </span>
                        </td>
                        <td className="py-2.5 text-[#8C96A5]">
                          {pos.shares.toLocaleString()} {pos.lots ? `(${pos.lots} L)` : ''}
                        </td>
                        <td className="py-2.5 text-[#F0F4F8] tabular-nums">
                          {formatCurrency(pos.entryPrice, pos.currency)}
                        </td>
                        <td className="py-2.5 text-[#F0F4F8] tabular-nums">
                          {formatCurrency(pos.currentPrice, pos.currency)}
                        </td>
                        <td className="py-2.5 tabular-nums">
                          <span className={diff >= 0 ? 'text-[#00E599] font-semibold' : 'text-[#FF3B56] font-semibold'}>
                            {diff >= 0 ? '+' : ''}{formatCurrency(diff, pos.currency)} ({pnlPct.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.id)}
                            className="px-2 py-1 rounded bg-[#FF3B56]/20 text-[#FF3B56] hover:bg-[#FF3B56]/30 text-[10px] font-semibold cursor-pointer"
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
        <div className="rounded-lg border border-[#161C26] bg-[#0D0F14] p-4">
          {history.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-[#6F7887]">
              No completed paper trades recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="border-b border-[#161C26] text-[#6F7887]">
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
                <tbody className="divide-y divide-[#161C26]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#121620]">
                      <td className="py-2.5 text-[#6F7887]">
                        {new Date(h.closedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 font-bold text-[#F0F4F8]">{h.ticker}</td>
                      <td className="py-2.5">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            h.side === 'BUY'
                              ? 'bg-[#00E599]/15 text-[#00E599]'
                              : 'bg-[#FF3B56]/15 text-[#FF3B56]'
                          )}
                        >
                          {h.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#8C96A5]">{h.shares.toLocaleString()}</td>
                      <td className="py-2.5 text-[#F0F4F8] tabular-nums">
                        {formatCurrency(h.entryPrice, h.currency)}
                      </td>
                      <td className="py-2.5 text-[#F0F4F8] tabular-nums">
                        {formatCurrency(h.exitPrice, h.currency)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={h.realizedPnl >= 0 ? 'text-[#00E599] font-bold' : 'text-[#FF3B56] font-bold'}>
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
