'use client'

import React, { useState } from 'react'
import { calculateLotValue, calculateEstimatedFee, formatCurrency } from '@/lib/formatters'
import { Calculator } from 'lucide-react'

interface IdxLotCalculatorProps {
  currentPrice: number
  ticker: string
}

export function IdxLotCalculator({ currentPrice, ticker }: IdxLotCalculatorProps) {
  const [lots, setLots] = useState<number>(1)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')

  const totalShares = lots * 100
  const grossValue = calculateLotValue(currentPrice, lots)
  const estimatedFee = calculateEstimatedFee(grossValue, tradeType)
  const netTotal = tradeType === 'buy' ? grossValue + estimatedFee : grossValue - estimatedFee

  return (
    <div className="rounded-xl border border-zinc-800/90 border-t-zinc-700/50 bg-zinc-900/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-200">IDX Lot Calculator: {ticker} (1 Lot = 100 Shares)</h3>
        </div>
        <div className="flex rounded-lg bg-zinc-950 border border-zinc-800 p-0.5 text-xs">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-3 py-1 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              tradeType === 'sell' ? 'bg-rose-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
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
            <span className="text-xs text-zinc-400 font-mono tabular-nums whitespace-nowrap">({totalShares.toLocaleString()} shares)</span>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[1, 5, 10, 50, 100].map((quick) => (
              <button
                key={quick}
                onClick={() => setLots(quick)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-mono tabular-nums transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {quick} lot
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Gross Transaction Value:</span>
            <span className="font-mono tabular-nums text-zinc-100 font-medium">{formatCurrency(grossValue, 'IDR')}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimated Broker Fee ({tradeType === 'buy' ? '0.15%' : '0.25%'}):</span>
            <span className="font-mono tabular-nums text-zinc-300">+{formatCurrency(estimatedFee, 'IDR')}</span>
          </div>
          <div className="border-t border-zinc-800/80 pt-1.5 flex justify-between font-semibold text-sm">
            <span className="text-zinc-200">Net Total:</span>
            <span className={`font-mono tabular-nums ${tradeType === 'buy' ? 'text-emerald-400' : 'text-blue-400'}`}>
              {formatCurrency(netTotal, 'IDR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
