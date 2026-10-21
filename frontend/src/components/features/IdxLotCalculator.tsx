'use client'

import React, { useState, useMemo } from 'react'
import { calculateLotValue, calculateEstimatedFee, formatCurrency } from '@/lib/formatters'
import { Calculator, Gauge, Layers, ShieldAlert, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdxLotCalculatorProps {
  currentPrice: number
  ticker: string
  volume?: number
}

type UrgencyLevel = 'aggressive' | 'balanced' | 'passive'

export function IdxLotCalculator({ currentPrice, ticker, volume }: IdxLotCalculatorProps) {
  const [lots, setLots] = useState<number>(1)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [showAlmgrenChriss, setShowAlmgrenChriss] = useState<boolean>(false)
  const [urgency, setUrgency] = useState<UrgencyLevel>('balanced')

  const totalShares = lots * 100
  const grossValue = calculateLotValue(currentPrice, lots)
  const estimatedFee = calculateEstimatedFee(grossValue, tradeType)
  const netTotal = tradeType === 'buy' ? grossValue + estimatedFee : grossValue - estimatedFee

  // Almgren-Chriss Market Impact Model
  const executionModel = useMemo(() => {
    // 20-day Average Daily Volume (ADV) estimate
    const adv = volume && volume > 0 ? volume : 15_000_000
    const participationRate = (totalShares / adv) * 100

    // Temporary slippage multiplier based on urgency
    const urgencyMultiplier =
      urgency === 'aggressive' ? 1.6 : urgency === 'passive' ? 0.6 : 1.0

    // Almgren-Chriss power-law non-linear market impact estimation
    // Slippage percentage = 0.12 * (Shares / (ADV * 0.1))^0.6 * urgencyMultiplier
    const rawSlippagePct =
      0.12 * Math.pow(totalShares / (adv * 0.1), 0.6) * urgencyMultiplier
    const slippagePct = Math.min(Math.max(rawSlippagePct, 0.02), 6.0)

    const slippageCost = Math.round(grossValue * (slippagePct / 100))
    const impactPerShare = Math.round(currentPrice * (slippagePct / 100))
    const trueExecutionCost =
      tradeType === 'buy' ? netTotal + slippageCost : netTotal - slippageCost

    // 4-Slice optimal execution trajectory
    const sliceWeights =
      urgency === 'aggressive'
        ? [0.45, 0.3, 0.15, 0.1]
        : urgency === 'passive'
        ? [0.25, 0.25, 0.25, 0.25]
        : [0.35, 0.28, 0.22, 0.15]

    const slices = sliceWeights.map((w, idx) => ({
      sliceNum: idx + 1,
      shares: Math.round(totalShares * w),
      lots: Math.max(1, Math.round((totalShares * w) / 100)),
      pct: Math.round(w * 100),
    }))

    // Liquidity grade
    let liquidityBadge = {
      label: 'Optimal Liquidity (<0.1% ADV)',
      color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80',
    }
    if (participationRate >= 1.0) {
      liquidityBadge = {
        label: 'High Market Impact (>1.0% ADV)',
        color: 'bg-rose-950/60 text-rose-400 border-rose-800/80',
      }
    } else if (participationRate >= 0.1) {
      liquidityBadge = {
        label: 'Moderate Impact (0.1% - 1.0% ADV)',
        color: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
      }
    }

    return {
      adv,
      participationRate: participationRate.toFixed(3),
      slippagePct: slippagePct.toFixed(2),
      slippageCost,
      impactPerShare,
      trueExecutionCost,
      slices,
      liquidityBadge,
    }
  }, [totalShares, currentPrice, grossValue, netTotal, tradeType, volume, urgency])

  return (
    <div className="rounded-xl border border-zinc-800/90 border-t-zinc-700/50 bg-zinc-900/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-200">
            IDX Lot Calculator: {ticker} (1 Lot = 100 Shares)
          </h3>
        </div>
        <div className="flex rounded-lg bg-zinc-950 border border-zinc-800 p-0.5 text-xs">
          <button
            onClick={() => setTradeType('buy')}
            className={cn(
              'px-3 py-1 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer',
              tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={cn(
              'px-3 py-1 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer',
              tradeType === 'sell' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 block mb-1 font-medium">Number of Lots:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={lots}
              onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-zinc-950 border border-zinc-750 rounded-lg px-3 py-1.5 text-sm font-mono tabular-nums text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-400 font-mono tabular-nums whitespace-nowrap">
              ({totalShares.toLocaleString()} shares)
            </span>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[1, 5, 10, 50, 100].map((quick) => (
              <button
                key={quick}
                onClick={() => setLots(quick)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-mono tabular-nums transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              >
                {quick} lot
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Gross Transaction Value:</span>
            <span className="font-mono tabular-nums text-zinc-100 font-medium">
              {formatCurrency(grossValue, 'IDR')}
            </span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimated Broker Fee ({tradeType === 'buy' ? '0.15%' : '0.25%'}):</span>
            <span className="font-mono tabular-nums text-zinc-300">
              +{formatCurrency(estimatedFee, 'IDR')}
            </span>
          </div>
          <div className="border-t border-zinc-800/80 pt-1.5 flex justify-between font-semibold text-sm">
            <span className="text-zinc-200">Net Total (Nominal):</span>
            <span
              className={cn(
                'font-mono tabular-nums',
                tradeType === 'buy' ? 'text-emerald-400' : 'text-blue-400'
              )}
            >
              {formatCurrency(netTotal, 'IDR')}
            </span>
          </div>
        </div>
      </div>

      {/* Almgren-Chriss Institutional Market Impact Toggle */}
      <div className="pt-2 border-t border-zinc-800/70">
        <button
          type="button"
          onClick={() => setShowAlmgrenChriss((prev) => !prev)}
          className="flex items-center justify-between w-full p-2.5 rounded-lg bg-zinc-950/60 border border-blue-500/20 hover:border-blue-500/40 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Institutional Execution & Slippage Simulator (Almgren-Chriss)</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-mono font-normal">
              Est. Impact: ~{executionModel.slippagePct}%
            </span>
            {showAlmgrenChriss ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showAlmgrenChriss && (
          <div className="mt-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-3.5 text-xs animate-in fade-in-50 duration-200">
            {/* Header description and Liquidity Grade */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-lg">
                The <strong>Almgren-Chriss (2000)</strong> optimal execution model calculates expected price slippage caused by order size relative to daily market liquidity.
              </p>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-mono font-semibold border',
                  executionModel.liquidityBadge.color
                )}
              >
                {executionModel.liquidityBadge.label}
              </span>
            </div>

            {/* Urgency Controls */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <span className="text-zinc-400 font-medium">Execution Urgency:</span>
              <div className="flex gap-1">
                {(['aggressive', 'balanced', 'passive'] as UrgencyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer',
                      urgency === level
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    )}
                  >
                    {level === 'aggressive'
                      ? 'Aggressive (Swift)'
                      : level === 'balanced'
                      ? 'Balanced (Optimal)'
                      : 'Passive (TWAP)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Participation Rate</span>
                <span className="text-sm font-bold text-zinc-100">{executionModel.participationRate}%</span>
                <span className="text-[10px] text-zinc-400 block font-sans">of Daily Volume</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Expected Slippage</span>
                <span className="text-sm font-bold text-amber-400">+{executionModel.slippagePct}%</span>
                <span className="text-[10px] text-zinc-400 block font-sans">~Rp {executionModel.impactPerShare}/sh</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Market Impact Cost</span>
                <span className="text-sm font-bold text-amber-300">
                  {formatCurrency(executionModel.slippageCost, 'IDR')}
                </span>
                <span className="text-[10px] text-zinc-400 block font-sans">Liquidity friction</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">True Exec. Cost (TCO)</span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    tradeType === 'buy' ? 'text-emerald-400' : 'text-blue-400'
                  )}
                >
                  {formatCurrency(executionModel.trueExecutionCost, 'IDR')}
                </span>
                <span className="text-[10px] text-zinc-400 block font-sans">Fee + Slippage</span>
              </div>
            </div>

            {/* 4-Slice Execution Schedule */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Optimal Multi-Slice Execution Schedule (Almgren-Chriss Trajectory):</span>
                <span className="font-mono text-zinc-400">4 Time Intervals</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {executionModel.slices.map((slice) => (
                  <div
                    key={slice.sliceNum}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center space-y-0.5"
                  >
                    <div className="text-[10px] text-blue-400 font-semibold">Slice {slice.sliceNum}</div>
                    <div className="text-xs font-mono font-bold text-zinc-100">{slice.pct}%</div>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {slice.lots.toLocaleString()} lot
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
