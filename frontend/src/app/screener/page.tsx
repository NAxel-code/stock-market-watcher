'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Filter, SlidersHorizontal, Plus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ScreenerPage() {
  const [screen, setScreen] = useState('Beaten-down megacaps')

  return (
    <div className="space-y-4 font-mono text-[#F0F4F8] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#161C26] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
          SCREENER / SAVED SCREEN
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8]">
            {screen}
          </h1>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#6F7887]">SAVED:</span>
            {['Beaten-down megacaps', 'SG dividend payers', 'ID banks'].map((sc) => (
              <button
                key={sc}
                onClick={() => setScreen(sc)}
                className={cn(
                  'px-2 py-0.5 rounded font-semibold transition-colors',
                  screen === sc
                    ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30 font-bold'
                    : 'bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8]'
                )}
              >
                {sc}
              </button>
            ))}
            <button className="px-2 py-0.5 rounded bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8] flex items-center gap-1">
              <Plus className="h-3 w-3" /> New screen
            </button>
          </div>
        </div>
      </div>

      {/* Screen Filter Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="bg-[#0E121B] border border-[#161C26] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#6F7887]">UNIVERSE</div>
          <div className="font-bold text-[#F0F4F8] mt-0.5">US large caps (16)</div>
        </div>
        <div className="bg-[#0E121B] border border-[#161C26] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#6F7887]">MARKET CAP</div>
          <div className="font-bold text-[#00E599] mt-0.5">≥ $1T</div>
        </div>
        <div className="bg-[#0E121B] border border-[#161C26] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#6F7887]">FROM 52W HIGH</div>
          <div className="font-bold text-[#FF3B56] mt-0.5">≤ −20%</div>
        </div>
        <div className="bg-[#0E121B] border border-[#161C26] p-2.5 rounded">
          <div className="text-[10px] uppercase text-[#6F7887]">SECTOR</div>
          <div className="font-bold text-[#F0F4F8] mt-0.5">Any</div>
        </div>
        <div className="bg-[#0E121B] border border-dashed border-[#232B3A] p-2.5 rounded flex items-center justify-center text-[#8C96A5] hover:text-[#00E599] cursor-pointer">
          + P/E, yield, 1D…
        </div>
      </div>

      {/* Matches Table */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#161C26]">
          <div>
            <div className="text-[10px] uppercase text-[#6F7887]">SORTED BY DISTANCE FROM HIGH</div>
            <h2 className="text-sm font-bold text-[#F0F4F8]">Matches</h2>
          </div>
          <span className="text-[11px] font-bold text-[#00E599]">
            4 OF 16 PASS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                <th className="py-2 font-normal">TICKER</th>
                <th className="py-2 font-normal">NAME</th>
                <th className="py-2 font-normal">SECTOR</th>
                <th className="py-2 text-right font-normal">LAST</th>
                <th className="py-2 text-right font-normal">1D</th>
                <th className="py-2 text-right font-normal">FROM 52W HIGH</th>
                <th className="py-2 text-right font-normal">MKT CAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161C26]/60">
              {[
                { ticker: 'NVDA', name: 'NVIDIA', sector: 'Technology', last: '$166.66', change: '+32.77%', fromHigh: '−31.52%', mktCap: '$4.02T' },
                { ticker: 'GOOGL', name: 'Alphabet', sector: 'Communication', last: '$282.46', change: '+6.47%', fromHigh: '−30.87%', mktCap: '$3.47T' },
                { ticker: 'META', name: 'Meta Platforms', sector: 'Communication', last: '$593.61', change: '+5.84%', fromHigh: '−23.88%', mktCap: '$1.52T' },
                { ticker: 'TSLA', name: 'Tesla', sector: 'Consumer cyclical', last: '$392.64', change: '+13.54%', fromHigh: '−21.29%', mktCap: '$1.55T' },
              ].map((m) => (
                <tr key={m.ticker} className="hover:bg-[#121620] transition-colors">
                  <td className="py-2.5 font-bold text-[#00E599]">
                    <Link href={`/stocks/${m.ticker}`}>{m.ticker}</Link>
                  </td>
                  <td className="py-2.5 text-[#F0F4F8] font-sans">{m.name}</td>
                  <td className="py-2.5 text-[#8C96A5]">{m.sector}</td>
                  <td className="py-2.5 text-right font-medium text-[#F0F4F8]">{m.last}</td>
                  <td className="py-2.5 text-right font-bold text-[#00E599]">{m.change}</td>
                  <td className="py-2.5 text-right font-bold text-[#FF3B56]">{m.fromHigh}</td>
                  <td className="py-2.5 text-right text-[#F0F4F8]">{m.mktCap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Near Misses Table */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#161C26]">
          <div className="text-[10px] uppercase text-[#6F7887]">FAILED ONE FILTER</div>
          <h2 className="text-sm font-bold text-[#F0F4F8]">Near misses</h2>
        </div>

        <div className="space-y-1.5 text-xs">
          {[
            { ticker: 'AMD', reason: 'Size $0.76T, under the $1T floor', fromHigh: '−29.94%', mktCap: '$0.76T' },
            { ticker: 'MSFT', reason: 'Only 10.7% below its high (needs 20%)', fromHigh: '−10.65%', mktCap: '$3.71T' },
            { ticker: 'AMZN', reason: 'Only 10.4% below its high (needs 20%)', fromHigh: '−10.36%', mktCap: '$2.78T' },
            { ticker: 'LLY', reason: 'Only 6.6% below its high (needs 20%)', fromHigh: '−6.56%', mktCap: '$1.23T' },
          ].map((nm) => (
            <div key={nm.ticker} className="flex items-center justify-between p-2 rounded bg-[#121620] border border-[#161C26]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#F0F4F8]">{nm.ticker}</span>
                <span className="text-[#8C96A5] font-sans">{nm.reason}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#FF3B56] font-bold">{nm.fromHigh}</span>
                <span className="text-[#6F7887]">{nm.mktCap}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[#161C26] text-[10px] text-[#6F7887]">
          Runs on the 16 US names in the StockPulse API snapshot, 23 Nov 2026. Live version screens full index lists with fundamentals in Phase 3.
        </div>
      </div>
    </div>
  )
}
