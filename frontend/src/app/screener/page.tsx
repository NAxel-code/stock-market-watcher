'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

export default function ScreenerPage() {
  const [screen, setScreen] = useState('Beaten-down megacaps')
  const { language } = useUIStore()
  const isId = language === 'id'

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#222226] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a]">
          {isId ? 'SCREENER / PENYARINGAN TERSIMPAN' : 'SCREENER / SAVED SCREEN'}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5]">
            {screen}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#71717a]">{isId ? 'TERSIMPAN:' : 'SAVED:'}</span>
            {['Beaten-down megacaps', 'SG dividend payers', 'ID banks'].map((sc) => (
              <button
                key={sc}
                onClick={() => setScreen(sc)}
                className={cn(
                  'px-2 py-0.5 rounded font-semibold transition-colors',
                  screen === sc
                    ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                    : 'bg-[#0f0f12] text-[#a1a1aa] border border-[#222226] hover:text-[#f4f4f5]'
                )}
              >
                {sc}
              </button>
            ))}
            <button className="px-2 py-0.5 rounded bg-[#0f0f12] text-[#a1a1aa] border border-[#222226] hover:text-[#f4f4f5] flex items-center gap-1">
              <Plus className="h-3 w-3" /> {isId ? 'Filter baru' : 'New screen'}
            </button>
            <Link
              href="/watchlist"
              className="px-2.5 py-0.5 rounded bg-[#f4f4f5] text-[#09090b] hover:bg-white font-bold transition-colors"
            >
              {isId ? 'Tambah semua ke pantauan' : 'Add all to watchlist'}
            </Link>
          </div>
        </div>
      </div>

      {/* Screen Filter Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="bg-[#0f0f12] border border-[#222226] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#71717a]">UNIVERSE</div>
          <div className="font-bold text-[#f4f4f5] mt-0.5">US large caps (16)</div>
        </div>
        <div className="bg-[#0f0f12] border border-[#222226] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#71717a]">MARKET CAP</div>
          <div className="font-bold text-[#f4f4f5] mt-0.5">≥ $1T</div>
        </div>
        <div className="bg-[#0f0f12] border border-[#222226] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#71717a]">FROM 52W HIGH</div>
          <div className="font-bold text-red-400 mt-0.5">≤ −20%</div>
        </div>
        <div className="bg-[#0f0f12] border border-[#222226] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#71717a]">SECTOR</div>
          <div className="font-bold text-[#f4f4f5] mt-0.5">Any</div>
        </div>
        <div className="bg-[#0f0f12] border border-dashed border-[#27272a] p-2.5 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#f4f4f5] cursor-pointer">
          + P/E, yield, 1D…
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase text-[#71717a]">SORTED BY DISTANCE FROM HIGH</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Matches</h2>
          </div>
          <span className="text-[11px] font-bold text-[#a1a1aa]">
            4 OF 16 PASS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">TICKER</th>
                <th className="py-2 font-normal">NAME</th>
                <th className="py-2 font-normal">SECTOR</th>
                <th className="py-2 text-right font-normal">LAST</th>
                <th className="py-2 text-right font-normal">1D</th>
                <th className="py-2 text-right font-normal">FROM 52W HIGH</th>
                <th className="py-2 text-right font-normal">MKT CAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {[
                { ticker: 'NVDA', name: 'NVIDIA', sector: 'Technology', last: '$166.66', change: '+32.77%', fromHigh: '−31.52%', mktCap: '$4.02T' },
                { ticker: 'GOOGL', name: 'Alphabet', sector: 'Communication', last: '$282.46', change: '+6.47%', fromHigh: '−30.87%', mktCap: '$3.47T' },
                { ticker: 'META', name: 'Meta Platforms', sector: 'Communication', last: '$593.61', change: '+5.84%', fromHigh: '−23.88%', mktCap: '$1.52T' },
                { ticker: 'TSLA', name: 'Tesla', sector: 'Consumer cyclical', last: '$392.64', change: '+13.54%', fromHigh: '−21.29%', mktCap: '$1.55T' },
              ].map((m) => (
                <tr key={m.ticker} className="hover:bg-[#141418] transition-colors">
                  <td className="py-2.5 font-bold text-[#f4f4f5]">
                    <Link href={`/stocks/${m.ticker}`} className="hover:underline">{m.ticker}</Link>
                  </td>
                  <td className="py-2.5 text-[#f4f4f5] font-sans">{m.name}</td>
                  <td className="py-2.5 text-[#a1a1aa]">{m.sector}</td>
                  <td className="py-2.5 text-right font-medium text-[#f4f4f5]">{m.last}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-400">{m.change}</td>
                  <td className="py-2.5 text-right font-bold text-red-400">{m.fromHigh}</td>
                  <td className="py-2.5 text-right text-[#f4f4f5]">{m.mktCap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Near Misses Table */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#222226]">
          <div className="text-[10px] uppercase text-[#71717a]">FAILED ONE FILTER</div>
          <h2 className="text-sm font-bold text-[#f4f4f5]">Near misses</h2>
        </div>

        <div className="space-y-1.5 text-xs">
          {[
            { ticker: 'AMD', reason: 'Size $0.76T, under the $1T floor', fromHigh: '−29.94%', mktCap: '$0.76T' },
            { ticker: 'MSFT', reason: 'Only 10.7% below its high (needs 20%)', fromHigh: '−10.65%', mktCap: '$3.71T' },
            { ticker: 'AMZN', reason: 'Only 10.4% below its high (needs 20%)', fromHigh: '−10.36%', mktCap: '$2.78T' },
            { ticker: 'LLY', reason: 'Only 6.6% below its high (needs 20%)', fromHigh: '−6.56%', mktCap: '$1.23T' },
          ].map((nm) => (
            <div key={nm.ticker} className="flex items-center justify-between p-2 rounded bg-[#141418] border border-[#222226]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#f4f4f5]">{nm.ticker}</span>
                <span className="text-[#a1a1aa] font-sans">{nm.reason}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-red-400 font-bold">{nm.fromHigh}</span>
                <span className="text-[#71717a]">{nm.mktCap}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#222226] text-[10px] text-[#71717a]">
          Runs on the 16 US names in the StockPulse API snapshot, 23 Nov 2026. Live version screens full index lists with fundamentals in Phase 3.
        </div>
      </div>
    </div>
  )
}
