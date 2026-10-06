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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Kalkulator Lot Saham IDX: {ticker} (1 Lot = 100 Lembar)</h3>
        </div>
        <div className="flex rounded-lg bg-zinc-800 p-0.5 text-xs">
          <button
            onClick={() => setTradeType('buy')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              tradeType === 'buy' ? 'bg-green-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Beli (Buy)
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              tradeType === 'sell' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Jual (Sell)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Jumlah Lot:</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={lots}
              onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-zinc-500 whitespace-nowrap">({totalShares.toLocaleString()} lembar)</span>
          </div>

          <div className="flex gap-1.5 mt-2">
            {[1, 5, 10, 50, 100].map((quick) => (
              <button
                key={quick}
                onClick={() => setLots(quick)}
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
              >
                {quick} lot
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Nilai Transaksi Kotor:</span>
            <span className="font-mono text-zinc-200">{formatCurrency(grossValue, 'IDR')}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimasi Fee Broker ({tradeType === 'buy' ? '0.15%' : '0.25%'}):</span>
            <span className="font-mono text-zinc-300">+{formatCurrency(estimatedFee, 'IDR')}</span>
          </div>
          <div className="border-t border-zinc-800 pt-1.5 flex justify-between font-semibold text-sm">
            <span>Total Bersih:</span>
            <span className={`font-mono ${tradeType === 'buy' ? 'text-green-400' : 'text-blue-400'}`}>
              {formatCurrency(netTotal, 'IDR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
