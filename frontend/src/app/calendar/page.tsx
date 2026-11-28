'use client'

import React, { useState } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  date: string
  inDays: string
  market: 'US' | 'SG' | 'ID' | 'ALL'
  type: string
  event: string
  status: 'CONFIRMED' | 'EST.' | 'WINDOW' | 'TBC'
}

const EVENTS_90_DAYS: CalendarEvent[] = [
  { date: 'THU 26 NOV', inDays: '2D', market: 'US', type: 'HOLIDAY', event: 'US markets closed Thanksgiving', status: 'CONFIRMED' },
  { date: 'FRI 27 NOV', inDays: '3D', market: 'US', type: 'HOLIDAY', event: 'US early close 1pm ET / 2am Sat SGT', status: 'CONFIRMED' },
  { date: 'TUE 1 DEC', inDays: '7D', market: 'ID', type: 'DATA', event: 'Indonesia CPI (Nov) BPS', status: 'EST.' },
  { date: 'WED 2 DEC', inDays: '8D', market: 'US', type: 'DIVIDEND', event: 'NVDA record date $0.25/share', status: 'CONFIRMED' },
  { date: 'FRI 4 DEC', inDays: '10D', market: 'US', type: 'DATA', event: 'US jobs report (Nov) BLS · 9:30pm', status: 'CONFIRMED' },
  { date: 'THU 10 DEC', inDays: '16D', market: 'US', type: 'FED', event: 'FOMC decision + projections 3:00am', status: 'CONFIRMED' },
  { date: 'THU 10 DEC', inDays: '16D', market: 'US', type: 'DATA', event: 'US CPI (Nov) BLS · 9:30pm', status: 'CONFIRMED' },
  { date: 'TUE 15 DEC', inDays: '21D', market: 'US', type: 'DATA', event: 'US PPI (Nov) BLS · 9:30pm', status: 'CONFIRMED' },
  { date: 'DEC', inDays: '—', market: 'ID', type: 'CENTRAL BANK', event: 'BI board meeting BI-Rate decision', status: 'TBC' },
  { date: 'WED 23 DEC', inDays: '29D', market: 'US', type: 'DIVIDEND', event: 'NVDA dividend paid $0.25/share', status: 'CONFIRMED' },
  { date: 'FRI 25 DEC', inDays: '31D', market: 'ALL', type: 'HOLIDAY', event: 'Christmas US, SGX, IDX closed', status: 'CONFIRMED' },
  { date: 'FRI 8 JAN', inDays: '45D', market: 'US', type: 'DATA', event: 'US jobs report (Dec) BLS · 9:30pm', status: 'CONFIRMED' },
  { date: 'WED 13 JAN', inDays: '50D', market: 'US', type: 'DATA', event: 'US CPI (Dec) BLS · 9:30pm', status: 'CONFIRMED' },
  { date: 'LATE JAN', inDays: '~60D', market: 'US', type: 'EARNINGS', event: 'MSFT, AAPL, META, GOOGL, AMZN Q4 season', status: 'EST.' },
  { date: 'THU 28 JAN', inDays: '65D', market: 'US', type: 'FED', event: 'FOMC decision First of seven in 2027 · 3:00am', status: 'CONFIRMED' },
  { date: 'BY 29 JAN', inDays: '≤66D', market: 'SG', type: 'CENTRAL BANK', event: 'MAS policy statement S$NEER band', status: 'WINDOW' },
  { date: 'LATE FEB', inDays: '~90D', market: 'US', type: 'EARNINGS', event: 'NVDA Q4 FY27 results Plus call', status: 'EST.' },
]

export default function CalendarPage() {
  const [filter, setFilter] = useState('ALL')
  const { language } = useUIStore()
  const isId = language === 'id'

  return (
    <div className="space-y-4 font-mono text-[#f4f4f5] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#222226] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#71717a]">
          {isId
            ? 'KALENDER / WAKTU DALAM SGT · HARI INI SEL 24 NOV 2026'
            : 'CALENDAR / ALL TIMES SGT · TODAY TUE 24 NOV 2026'}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5] mt-1">
          {isId ? 'Kalender' : 'Calendar'}
        </h1>
      </div>

      {/* Quarter Tracker */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase text-[#71717a]">{isId ? 'KUARTAL KALENDER' : 'CALENDAR QUARTERS'}</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">{isId ? 'Pelacak kuartal' : 'Quarter tracker'}</h2>
          </div>
          <span className="text-[11px] font-bold text-[#a1a1aa]">
            Q4 2026 · DAY 55 OF 92 · 37 DAYS LEFT
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-[#141418] border border-[#222226] p-2 rounded">
            <div className="font-bold text-[#a1a1aa]">Q1 2026</div>
            <div className="text-[10px] text-[#71717a]">JAN – MAR</div>
            <div className="mt-1 text-[10px] text-[#71717a]">DONE</div>
          </div>
          <div className="bg-[#141418] border border-[#222226] p-2 rounded">
            <div className="font-bold text-[#a1a1aa]">Q2 2026</div>
            <div className="text-[10px] text-[#71717a]">APR – JUN</div>
            <div className="mt-1 text-[10px] text-[#71717a]">DONE</div>
          </div>
          <div className="bg-[#141418] border border-[#222226] p-2 rounded">
            <div className="font-bold text-[#a1a1aa]">Q3 2026</div>
            <div className="text-[10px] text-[#71717a]">JUL – SEP</div>
            <div className="mt-1 text-[10px] text-[#71717a]">DONE</div>
          </div>
          <div className="bg-[#f4f4f5] border border-[#f4f4f5] p-2 rounded">
            <div className="font-bold text-[#09090b]">Q4 2026</div>
            <div className="text-[10px] text-[#52525b]">OCT – DEC</div>
            <div className="mt-1 text-[10px] text-[#09090b] font-bold">NOW · 60%</div>
          </div>
          <div className="bg-[#141418] border border-[#222226] p-2 rounded">
            <div className="font-bold text-[#f4f4f5]">Q1 2027</div>
            <div className="text-[10px] text-[#71717a]">JAN – MAR</div>
            <div className="mt-1 text-[10px] text-[#71717a]">TRACK RECORD STARTS 1 JAN</div>
          </div>
        </div>

        <div className="text-[10px] text-[#71717a] font-sans flex flex-wrap items-center gap-3 pt-1">
          <span>| TODAY</span>
          <span>▮ FED / CENTRAL BANK</span>
          <span>▮ DATA · EARNINGS · DIVIDEND</span>
          <span>▮ HOLIDAY</span>
          <span className="text-[#a1a1aa]">EARNINGS SEASON: Q3 SEASON DONE · Q4 SEASON STARTS MID-JAN</span>
        </div>
      </div>

      {/* Next 90 Days Events */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#222226]">
          <div>
            <div className="text-[10px] uppercase text-[#71717a]">NEXT 90 DAYS</div>
            <h2 className="text-sm font-bold text-[#f4f4f5]">Events</h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            {['ALL', 'FED + CB', 'DATA', 'EARNINGS', 'DIVIDENDS', 'HOLIDAYS'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={cn(
                  'px-2 py-0.5 rounded transition-colors whitespace-nowrap text-xs font-semibold',
                  filter === cat
                    ? 'bg-[#f4f4f5] text-[#09090b] font-bold'
                    : 'bg-[#0f0f12] text-[#a1a1aa] border border-[#222226] hover:text-[#f4f4f5]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">DATE</th>
                <th className="py-2 font-normal">IN</th>
                <th className="py-2 font-normal">MKT</th>
                <th className="py-2 font-normal">TYPE</th>
                <th className="py-2 font-normal">EVENT</th>
                <th className="py-2 text-right font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {EVENTS_90_DAYS.map((ev, i) => (
                <tr key={i} className="hover:bg-[#141418] transition-colors">
                  <td className="py-2.5 font-bold text-[#f4f4f5] whitespace-nowrap">{ev.date}</td>
                  <td className="py-2.5 text-[#a1a1aa] font-semibold whitespace-nowrap">{ev.inDays}</td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#18181b] border border-[#27272a] text-[#a1a1aa] font-semibold">
                      {ev.market}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#a1a1aa] whitespace-nowrap">{ev.type}</td>
                  <td className="py-2.5 font-medium text-[#f4f4f5]">{ev.event}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                        ev.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : ev.status === 'EST.'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a]'
                      )}
                    >
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Fiscal Calendars */}
      <div className="bg-[#0f0f12] border border-[#222226] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#222226]">
          <div className="text-[10px] uppercase text-[#71717a]">COMPANY FISCAL CALENDARS</div>
          <h2 className="text-sm font-bold text-[#f4f4f5]">Where each company is</h2>
          <p className="text-[11px] text-[#a1a1aa] font-sans mt-0.5">
            Fiscal quarters don&apos;t match calendar quarters. NVDA is already in its fiscal Q4; MSFT is in fiscal Q2.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] uppercase text-[#71717a]">
                <th className="py-2 font-normal">TICKER</th>
                <th className="py-2 font-normal">FY ENDS</th>
                <th className="py-2 font-normal">NOW IN</th>
                <th className="py-2 text-right font-normal">NEXT REPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]/70">
              {[
                { ticker: 'NVDA', fyEnds: 'LATE JAN', nowIn: 'FQ4 FY27', nextReport: 'LATE FEB · EST.' },
                { ticker: 'MSFT', fyEnds: '30 JUN', nowIn: 'FQ2 FY27', nextReport: 'LATE JAN · EST.' },
                { ticker: 'AAPL', fyEnds: 'LATE SEP', nowIn: 'FQ1 FY27', nextReport: 'LATE JAN · EST.' },
                { ticker: 'GOOGL', fyEnds: '31 DEC', nowIn: 'Q4 2026', nextReport: 'EARLY FEB · EST.' },
                { ticker: 'META', fyEnds: '31 DEC', nowIn: 'Q4 2026', nextReport: 'LATE JAN · EST.' },
                { ticker: 'AMZN', fyEnds: '31 DEC', nowIn: 'Q4 2026', nextReport: 'EARLY FEB · EST.' },
                { ticker: 'D05.SI', fyEnds: '31 DEC', nowIn: 'Q4 2026', nextReport: 'FEB · EST.' },
                { ticker: 'BBCA.JK', fyEnds: '31 DEC', nowIn: 'Q4 2026', nextReport: 'LATE JAN · EST.' },
              ].map((co) => (
                <tr key={co.ticker} className="hover:bg-[#141418] transition-colors">
                  <td className="py-2 font-bold text-[#f4f4f5]">{co.ticker}</td>
                  <td className="py-2 text-[#a1a1aa]">{co.fyEnds}</td>
                  <td className="py-2 text-[#f4f4f5]">{co.nowIn}</td>
                  <td className="py-2 text-right font-bold text-[#a1a1aa]">{co.nextReport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
