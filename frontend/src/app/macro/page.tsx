'use client'

import React from 'react'
import { useUIStore } from '@/stores/useUIStore'

export default function MacroPage() {
  const { language } = useUIStore()
  const isId = language === 'id'

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#222226] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a]">
          MACRO / US · SG · ID · JP (PHASE 4)
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5] mt-1">
          {isId ? 'Suku bunga dan makro' : 'Rates and macro'}
        </h1>
      </div>

      {/* Central Banks Policy Table */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#222226]">
          <div className="text-[10px] uppercase text-[#71717a]">{isId ? 'KEBIJAKAN' : 'POLICY'}</div>
          <h2 className="text-sm font-bold text-[#f4f4f5]">{isId ? 'Bank sentral' : 'Central banks'}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">BANK</th>
                <th className="py-2 font-normal">SETTING</th>
                <th className="py-2 font-normal">LAST MOVE</th>
                <th className="py-2 font-normal">NEXT</th>
                <th className="py-2 font-normal">WHAT IT MEANS FOR YOU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              <tr className="hover:bg-[#141418] transition-colors">
                <td className="py-2.5 font-bold text-[#f4f4f5]">US Federal Reserve</td>
                <td className="py-2.5 font-bold text-[#f4f4f5]">3.75–4.00%</td>
                <td className="py-2.5 text-[#a1a1aa]">HELD · 28 OCT</td>
                <td className="py-2.5 text-[#a1a1aa] font-semibold">THU 10 DEC · 3AM</td>
                <td className="py-2.5 text-[#71717a] font-sans">Sets the cost of money for every US stock you hold.</td>
              </tr>
              <tr className="hover:bg-[#141418] transition-colors">
                <td className="py-2.5 font-bold text-[#f4f4f5]">Bank Indonesia</td>
                <td className="py-2.5 font-bold text-[#f4f4f5]">6.00%</td>
                <td className="py-2.5 text-amber-400 font-semibold">+25 BPS · 18 NOV</td>
                <td className="py-2.5 text-[#a1a1aa]">DEC · TBC</td>
                <td className="py-2.5 text-[#71717a] font-sans">Higher rate supports the rupiah, weighs on ID banks.</td>
              </tr>
              <tr className="hover:bg-[#141418] transition-colors">
                <td className="py-2.5 font-bold text-[#f4f4f5]">Monetary Authority of Singapore</td>
                <td className="py-2.5 font-bold text-[#f4f4f5]">S$NEER</td>
                <td className="py-2.5 text-[#a1a1aa]">STATEMENT · 14 OCT</td>
                <td className="py-2.5 text-[#a1a1aa] font-semibold">BY 29 JAN</td>
                <td className="py-2.5 text-[#71717a] font-sans">Steers SGD, not a rate: drives your USD returns in SGD.</td>
              </tr>
              <tr className="hover:bg-[#141418] transition-colors text-[#71717a]">
                <td className="py-2.5 font-bold">Bank of Japan</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">—</td>
                <td className="py-2.5">PHASE 4</td>
                <td className="py-2.5 font-sans">Drives USD/JPY; added with the Japan module.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Yield Curve & Inflation (2-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: US Treasury Yield Curve */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
          <div className="pb-2 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">US TREASURY / PAR YIELDS</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Yield curve TODAY VS 1M AGO</h2>
          </div>

          <div className="p-4 rounded bg-[#141418] border border-[#222226] text-center space-y-2">
            <span className="text-[11px] font-bold text-[#a1a1aa] block">
              Connect Treasury daily par yield curve
            </span>
            <span className="text-[10px] text-[#71717a]">
              FREE XML FEED · PHASE 2.2 · SGS CURVE FROM MAS
            </span>
            <div className="flex justify-between text-xs text-[#a1a1aa] pt-3 border-t border-[#222226]">
              {['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'].map((tenor) => (
                <span key={tenor}>{tenor}</span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-[#222226]">
              <span className="text-[#a1a1aa]">US 10-year Treasury</span>
              <span className="font-bold text-[#f4f4f5]">5.03% <span className="text-[10px] text-[#71717a]">CLOSE 28 OCT</span></span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222226]">
              <span className="text-[#a1a1aa]">US 2-year Treasury</span>
              <span className="text-[#71717a]">CONNECT TREASURY</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222226]">
              <span className="text-[#a1a1aa]">10Y − 2Y spread</span>
              <span className="text-[#71717a]">NEEDS 2Y</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222226]">
              <span className="text-[#a1a1aa]">Singapore 10-year (SGS)</span>
              <span className="text-[#71717a]">CONNECT MAS</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#222226]">
              <span className="text-[#a1a1aa]">SORA (overnight)</span>
              <span className="text-[#71717a]">CONNECT MAS</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#a1a1aa]">Indonesia 10-year</span>
              <span className="text-[#71717a]">CONNECT ADB</span>
            </div>
          </div>
        </div>

        {/* Right: Year on Year Inflation */}
        <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
          <div className="pb-2 border-b border-[#222226]">
            <div className="text-[10px] uppercase text-[#71717a]">YEAR ON YEAR</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Inflation</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">INDONESIA CPI</div>
              <div className="text-2xl font-bold text-[#f4f4f5] mt-1">3.23%</div>
              <div className="text-[10px] text-[#a1a1aa] mt-1 font-sans">
                OCT · BPS · BI TARGET 1.5–3.5%
              </div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">US CPI</div>
              <div className="text-2xl font-bold text-[#a1a1aa] mt-1">—</div>
              <div className="text-[10px] text-[#71717a] mt-1 font-sans">
                NOV PRINT · THU 10 DEC
              </div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">SINGAPORE CORE CPI</div>
              <div className="text-2xl font-bold text-[#a1a1aa] mt-1">—</div>
              <div className="text-[10px] text-[#71717a] mt-1 font-sans">
                CONNECT SINGSTAT
              </div>
            </div>

            <div className="p-3 rounded bg-[#141418] border border-[#222226]">
              <div className="text-[10px] text-[#71717a] uppercase font-bold">JAPAN CPI</div>
              <div className="text-2xl font-bold text-[#a1a1aa] mt-1">—</div>
              <div className="text-[10px] text-[#71717a] mt-1 font-sans">
                PHASE 4
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#222226] text-[10px] text-[#71717a]">
            Sources: Federal Reserve, Bank Indonesia, MAS, BPS, US Treasury. Dash = source not connected yet.
          </div>
        </div>
      </div>
    </div>
  )
}
