'use client'

import React from 'react'
import { useUIStore } from '@/stores/useUIStore'

export default function ModelsPage() {
  const { language } = useUIStore()
  const isId = language === 'id'

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#222226] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a]">
          {isId
            ? 'MODEL / TEMPLAT, SINYAL TREN & RISIKO PORTOFOLIO'
            : 'MODELS / TEMPLATES, TREND SIGNALS AND RISK ON YOUR SAMPLE PORTFOLIO'}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5] mt-1">
          {isId ? 'Model dan risiko' : 'Models and risk'}
        </h1>
      </div>

      {/* Templates Table */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase text-[#71717a]">
              {isId ? 'MULAI PORTOFOLIO DARI TEMPLAT' : 'START A PORTFOLIO FROM A TEMPLATE'}
            </div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">{isId ? 'Templat' : 'Templates'}</h2>
          </div>
          <span className="text-[10px] text-[#71717a]">BACKTESTS · PHASE 3.4</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">TEMPLATE</th>
                <th className="py-2 font-normal">MIX</th>
                <th className="py-2 font-normal">REBALANCE</th>
                <th className="py-2 text-right font-normal">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {[
                { name: 'Group five-sleeve', mix: 'CORE 50 · CONVICTION 20 · TREND 15 · LAB 5 · DRY POWDER 10', rebal: 'QUARTERLY' },
                { name: 'VWRA core', mix: 'VWRA 100 (ALL-WORLD UCITS, USD)', rebal: 'NONE' },
                { name: 'CSPX core', mix: 'CSPX 100 (S&P 500 UCITS, USD)', rebal: 'NONE' },
                { name: '60/40 SGD', mix: 'VWRA 60 · SG BONDS (A35) 40', rebal: 'ANNUAL' },
                { name: 'Singapore core', mix: 'ES3 100 (STI ETF, SGD)', rebal: 'NONE' },
                { name: 'Trend sleeve', mix: 'CSPX · VWRA · ES3 · GOLD, EACH ON 10-MONTH RULE', rebal: 'MONTH-END' },
              ].map((t) => (
                <tr key={t.name} className="hover:bg-[#141418] transition-colors">
                  <td className="py-2.5 font-bold text-[#f4f4f5]">{t.name}</td>
                  <td className="py-2.5 text-[#a1a1aa] text-[11px]">{t.mix}</td>
                  <td className="py-2.5 text-[#a1a1aa] font-semibold text-[10px]">{t.rebal}</td>
                  <td className="py-2.5 text-right font-bold text-[#f4f4f5] cursor-pointer hover:underline">
                    USE →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column: Trend Signals & Exposure Concentration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Trend Sleeve Rule */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
          <div className="pb-2 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">TREND SLEEVE RULE / PRICE VS 10-MONTH AVERAGE</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Trend signals</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                  <th className="py-2 font-normal">ASSET</th>
                  <th className="py-2 text-right font-normal">MONTH-END</th>
                  <th className="py-2 text-right font-normal">10M AVG</th>
                  <th className="py-2 text-right font-normal">SIGNAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222226]/70">
                {['S&P 500 (CSPX)', 'All-World (VWRA)', 'Nasdaq 100 (CNDX)', 'STI (ES3)', 'Gold'].map((asset) => (
                  <tr key={asset} className="hover:bg-[#141418]">
                    <td className="py-2 font-medium text-[#f4f4f5]">{asset}</td>
                    <td className="py-2 text-right text-[#71717a]">—</td>
                    <td className="py-2 text-right text-[#71717a]">—</td>
                    <td className="py-2 text-right text-[#71717a]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#222226] text-[10px] text-[#71717a] font-sans">
            Above the average = hold. Below at month-end = move that slice to cash. Needs 10 months of monthly closes (Phase 3.3).
          </div>
        </div>

        {/* Right: Exposure & Concentration */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
          <div className="pb-2 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">EXPOSURE</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Concentration</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">TOP 3</div>
              <div className="text-2xl font-bold text-[#f4f4f5] mt-1">51.6%</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1">VWRA · D05 · NVDA</div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">LARGEST STOCK</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">12.6%</div>
              <div className="text-[10px] text-amber-400 mt-1">NVDA · TRIM AT 12%</div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">US-SITUS</div>
              <div className="text-2xl font-bold text-[#f4f4f5] mt-1">S$57.4k</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1">CAP US$60K · NEEDS FX</div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226] flex flex-col justify-between">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">CURRENCY</div>
              <div className="w-full h-2 rounded bg-[#27272a] overflow-hidden flex my-1.5">
                <div className="bg-[#f4f4f5] h-full" style={{ width: '70%' }} />
                <div className="bg-[#71717a] h-full" style={{ width: '20%' }} />
                <div className="bg-amber-400 h-full" style={{ width: '10%' }} />
              </div>
              <div className="text-[10px] font-bold text-[#a1a1aa]">
                USD 70% · SGD 20% · GOLD 10%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Tests */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#222226]">
          <div className="text-[10px] uppercase text-[#71717a]">FIRST-ORDER: WEIGHT × SHOCK, NO CORRELATIONS</div>
          <h2 className="text-sm font-bold text-[#f4f4f5]">Stress tests ON S$124,800 SAMPLE</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">SCENARIO</th>
                <th className="py-2 font-normal">HITS</th>
                <th className="py-2 text-right font-normal">PORTFOLIO</th>
                <th className="py-2 text-right font-normal">S$</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {[
                { scenario: 'USD/SGD falls 5%', hits: 'All USD assets (70%)', port: '−3.50%', val: '−S$4,368' },
                { scenario: 'Nasdaq falls 20%', hits: 'US single stocks (46%), beta 1', port: '−9.20%', val: '−S$11,482' },
                { scenario: 'SG banks fall 15%', hits: 'D05.SI (15%)', port: '−2.25%', val: '−S$2,808' },
                { scenario: 'Gold falls 10%', hits: 'Gold (10%)', port: '−1.00%', val: '−S$1,248' },
              ].map((st) => (
                <tr key={st.scenario} className="hover:bg-[#141418]">
                  <td className="py-2.5 font-bold text-[#f4f4f5]">{st.scenario}</td>
                  <td className="py-2.5 text-[#a1a1aa]">{st.hits}</td>
                  <td className="py-2.5 text-right font-bold text-red-400">{st.port}</td>
                  <td className="py-2.5 text-right font-bold text-red-400">{st.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-[#222226] text-[10px] text-[#71717a]">
          Weights from the sample portfolio. Templates follow the group strategy doc (five sleeves). Not investment advice.
        </div>
      </div>
    </div>
  )
}
