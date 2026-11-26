'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeatmapTile {
  ticker: string
  name: string
  sector: string
  change1D: number
  price: string
  fromHigh: string
  marketCap: string
  shareOfMap: string
}

const HEATMAP_DATA: HeatmapTile[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', change1D: 32.77, price: '$166.66', fromHigh: '−31.52%', marketCap: '$4.02T', shareOfMap: '14.1%' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', change1D: 3.11, price: '$499.59', fromHigh: '−10.65%', marketCap: '$3.71T', shareOfMap: '13.0%' },
  { ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology', change1D: 1.84, price: '$348.87', fromHigh: '−3.32%', marketCap: '$5.20T', shareOfMap: '18.2%' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', change1D: 8.72, price: '$148.20', fromHigh: '−29.94%', marketCap: '$0.76T', shareOfMap: '2.7%' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication', change1D: 6.47, price: '$282.46', fromHigh: '−30.87%', marketCap: '$3.47T', shareOfMap: '12.1%' },
  { ticker: 'META', name: 'Meta Platforms Inc', sector: 'Communication', change1D: 5.84, price: '$593.61', fromHigh: '−23.88%', marketCap: '$1.52T', shareOfMap: '5.3%' },
  { ticker: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer cyclical', change1D: 4.30, price: '$257.45', fromHigh: '−10.36%', marketCap: '$2.78T', shareOfMap: '9.7%' },
  { ticker: 'TSLA', name: 'Tesla Inc', sector: 'Consumer cyclical', change1D: 13.54, price: '$392.64', fromHigh: '−21.29%', marketCap: '$1.55T', shareOfMap: '5.4%' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co', sector: 'Financials', change1D: 3.08, price: '$245.80', fromHigh: '−4.20%', marketCap: '$0.68T', shareOfMap: '2.4%' },
  { ticker: 'V', name: 'Visa Inc', sector: 'Financials', change1D: 2.25, price: '$312.40', fromHigh: '−5.10%', marketCap: '$0.62T', shareOfMap: '2.2%' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare', change1D: 2.33, price: '$890.10', fromHigh: '−6.56%', marketCap: '$1.23T', shareOfMap: '4.3%' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', change1D: 0.27, price: '$158.40', fromHigh: '−8.10%', marketCap: '$0.38T', shareOfMap: '1.3%' },
  { ticker: 'WMT', name: 'Walmart Inc', sector: 'Consumer defensive', change1D: 0.68, price: '$92.15', fromHigh: '−2.10%', marketCap: '$0.74T', shareOfMap: '2.6%' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', change1D: -1.03, price: '$118.50', fromHigh: '−7.40%', marketCap: '$0.52T', shareOfMap: '1.8%' },
]

export default function MarketMapPage() {
  const [selectedTicker, setSelectedTicker] = useState('NVDA')
  const [market, setMarket] = useState<'US' | 'ID' | 'SG'>('US')
  const [mode, setMode] = useState<'1D' | 'FROM HIGH'>('1D')

  const selected = HEATMAP_DATA.find((t) => t.ticker === selectedTicker) || HEATMAP_DATA[0]

  return (
    <div className="space-y-4 font-mono text-[#F0F4F8] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#161C26] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
          MARKET MAP / US LARGE CAPS · 16 NAMES · SIZE = MARKET CAP
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8]">
            Market map
          </h1>

          <div className="flex items-center gap-3 text-xs">
            {/* Market Tabs */}
            <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded border border-[#161C26]">
              {(['US', 'ID', 'SG'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition-colors',
                    market === m ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30' : 'text-[#6F7887]'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1 bg-[#0E121B] p-1 rounded border border-[#161C26]">
              {(['1D', 'FROM HIGH'] as const).map((md) => (
                <button
                  key={md}
                  onClick={() => setMode(md)}
                  className={cn(
                    'px-2 py-0.5 rounded font-bold transition-colors',
                    mode === md ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30' : 'text-[#6F7887]'
                  )}
                >
                  {md}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Treemap (2/3) + Drilldown & Sectors (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Treemap Visualization */}
        <div className="lg:col-span-2 bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
          <div className="text-[10px] uppercase text-[#6F7887] flex flex-wrap gap-4">
            <span>TECHNOLOGY</span>
            <span>COMMUNICATION</span>
            <span>CONSUMER CYCLICAL</span>
            <span>HEALTHCARE</span>
            <span>FINANCIALS</span>
            <span>CONSUMER DEFENSIVE</span>
            <span>ENERGY</span>
          </div>

          {/* Treemap Tiles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-96">
            {HEATMAP_DATA.map((tile) => {
              const isPos = tile.change1D >= 0
              const isSelected = tile.ticker === selectedTicker
              return (
                <div
                  key={tile.ticker}
                  onClick={() => setSelectedTicker(tile.ticker)}
                  className={cn(
                    'p-2.5 rounded border transition-all cursor-pointer flex flex-col justify-between',
                    isSelected
                      ? 'ring-2 ring-[#00E599] shadow-lg'
                      : 'hover:border-[#232B3A]',
                    tile.change1D >= 10
                      ? 'bg-emerald-950/40 border-emerald-800/60'
                      : tile.change1D >= 3
                      ? 'bg-emerald-950/25 border-emerald-900/40'
                      : tile.change1D >= 0
                      ? 'bg-[#121620] border-[#161C26]'
                      : 'bg-red-950/30 border-red-900/40'
                  )}
                >
                  <div>
                    <div className="font-bold text-[#F0F4F8] text-sm">{tile.ticker}</div>
                    <div className="text-[9px] text-[#6F7887] truncate">{tile.sector}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F0F4F8]">{tile.price}</div>
                    <div className={cn('text-xs font-bold', isPos ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
                      {isPos ? '+' : ''}{tile.change1D.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center justify-between text-[10px] text-[#6F7887] pt-2 border-t border-[#161C26]">
            <span>≤−3% · −1.5 · −0.5 · 0 · +0.5 · +1.5 · ≥+3%</span>
            <span>TILE SIZE = MARKET CAP</span>
          </div>
        </div>

        {/* Selected Tile Card & Sector Breakdown */}
        <div className="space-y-4">
          {/* Selected Ticker Detail */}
          <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
            <div>
              <div className="text-[10px] uppercase text-[#6F7887]">{selected.sector.toUpperCase()}</div>
              <div className="flex items-center justify-between mt-0.5">
                <h2 className="text-lg font-bold text-[#F0F4F8]">{selected.ticker}</h2>
                <span className="text-xs text-[#8C96A5] font-sans">{selected.name}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#161C26]">
                <span className="text-[#8C96A5]">Last Price</span>
                <span className="font-bold text-[#F0F4F8]">{selected.price} <strong className="text-[#00E599]">+{selected.change1D}%</strong></span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#161C26]">
                <span className="text-[#8C96A5]">From 52W high</span>
                <span className="font-bold text-[#FF3B56]">{selected.fromHigh}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#161C26]">
                <span className="text-[#8C96A5]">Market cap</span>
                <span className="font-bold text-[#F0F4F8]">{selected.marketCap}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8C96A5]">Share of map</span>
                <span className="font-bold text-[#00E599]">{selected.shareOfMap}</span>
              </div>
            </div>

            <Link
              href={`/stocks/${selected.ticker}`}
              className="mt-2 block w-full text-center py-2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 hover:bg-[#00E599]/25 font-bold text-xs transition-colors"
            >
              OPEN STOCK PAGE →
            </Link>
          </div>

          {/* Cap-Weighted Sectors */}
          <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-2 text-xs">
            <div className="pb-1.5 border-b border-[#161C26]">
              <div className="text-[10px] uppercase text-[#6F7887]">CAP-WEIGHTED 1D</div>
              <h3 className="font-bold text-[#F0F4F8]">Sectors</h3>
            </div>

            <div className="space-y-1.5">
              {[
                { sector: 'Technology', move: '+11.74%', pos: true },
                { sector: 'Consumer cyclical', move: '+7.61%', pos: true },
                { sector: 'Communication', move: '+5.93%', pos: true },
                { sector: 'Financials', move: '+2.69%', pos: true },
                { sector: 'Healthcare', move: '+1.62%', pos: true },
                { sector: 'Consumer defensive', move: '+0.68%', pos: true },
                { sector: 'Energy', move: '−1.03%', pos: false },
              ].map((s) => (
                <div key={s.sector} className="flex justify-between py-0.5">
                  <span className="text-[#8C96A5]">{s.sector}</span>
                  <span className={cn('font-bold', s.pos ? 'text-[#00E599]' : 'text-[#FF3B56]')}>
                    {s.move}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#161C26] text-[10px] text-[#6F7887]">
              15 of 16 names up. Without NVDA, the cap-weighted move would be +4.09%.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
