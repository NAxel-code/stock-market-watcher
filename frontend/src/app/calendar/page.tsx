'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar as CalendarIcon, Filter, Clock } from 'lucide-react'
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

  return (
    <div className="space-y-4 font-mono text-[#F0F4F8] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#161C26] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
          CALENDAR / ALL TIMES SGT · TODAY TUE 24 NOV 2026
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8] mt-1">
          Calendar
        </h1>
      </div>

      {/* Quarter Tracker */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#161C26]">
          <div>
            <div className="text-[10px] uppercase text-[#6F7887]">CALENDAR QUARTERS</div>
            <h2 className="text-sm font-bold text-[#F0F4F8]">Quarter tracker</h2>
          </div>
          <span className="text-[11px] font-bold text-[#00E599]">
            Q4 2026 · DAY 55 OF 92 · 37 DAYS LEFT
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
            <div className="font-bold text-[#F0F4F8]">Q1 2026</div>
            <div className="text-[10px] text-[#6F7887]">JAN – MAR</div>
            <div className="mt-1 text-[10px] text-[#8C96A5]">DONE</div>
          </div>
          <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
            <div className="font-bold text-[#F0F4F8]">Q2 2026</div>
            <div className="text-[10px] text-[#6F7887]">APR – JUN</div>
            <div className="mt-1 text-[10px] text-[#8C96A5]">DONE</div>
          </div>
          <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
            <div className="font-bold text-[#F0F4F8]">Q3 2026</div>
            <div className="text-[10px] text-[#6F7887]">JUL – SEP</div>
            <div className="mt-1 text-[10px] text-[#8C96A5]">DONE</div>
          </div>
          <div className="bg-[#161D2B] border border-[#00E599]/40 p-2 rounded shadow-xs">
            <div className="font-bold text-[#00E599]">Q4 2026</div>
            <div className="text-[10px] text-[#8C96A5]">OCT – DEC</div>
            <div className="mt-1 text-[10px] text-[#00E599] font-bold">NOW · 60%</div>
          </div>
          <div className="bg-[#121620] border border-[#161C26] p-2 rounded">
            <div className="font-bold text-[#F0F4F8]">Q1 2027</div>
            <div className="text-[10px] text-[#6F7887]">JAN – MAR</div>
            <div className="mt-1 text-[10px] text-[#6F7887]">TRACK RECORD STARTS 1 JAN</div>
          </div>
        </div>

        <div className="text-[10px] text-[#6F7887] font-sans flex flex-wrap items-center gap-3 pt-1">
          <span>| TODAY</span>
          <span>▮ FED / CENTRAL BANK</span>
          <span>▮ DATA · EARNINGS · DIVIDEND</span>
          <span>▮ HOLIDAY</span>
          <span className="text-[#8C96A5]">EARNINGS SEASON: Q3 SEASON DONE · Q4 SEASON STARTS MID-JAN</span>
        </div>
      </div>

      {/* Next 90 Days Events */}
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#161C26]">
          <div>
            <div className="text-[10px] uppercase text-[#6F7887]">NEXT 90 DAYS</div>
            <h2 className="text-sm font-bold text-[#F0F4F8]">Events</h2>
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
                    ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30 font-bold'
                    : 'bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8]'
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
              <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                <th className="py-2 font-normal">DATE</th>
                <th className="py-2 font-normal">IN</th>
                <th className="py-2 font-normal">MKT</th>
                <th className="py-2 font-normal">TYPE</th>
                <th className="py-2 font-normal">EVENT</th>
                <th className="py-2 text-right font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161C26]/60">
              {EVENTS_90_DAYS.map((ev, i) => (
                <tr key={i} className="hover:bg-[#121620] transition-colors">
                  <td className="py-2.5 font-bold text-[#F0F4F8] whitespace-nowrap">{ev.date}</td>
                  <td className="py-2.5 text-[#00E599] font-semibold whitespace-nowrap">{ev.inDays}</td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161C26] text-[#8C96A5] font-semibold">
                      {ev.market}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#8C96A5] whitespace-nowrap">{ev.type}</td>
                  <td className="py-2.5 font-medium text-[#F0F4F8]">{ev.event}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded border',
                        ev.status === 'CONFIRMED'
                          ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30'
                          : ev.status === 'EST.'
                          ? 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                          : 'bg-[#00B2FF]/15 text-[#00B2FF] border-[#00B2FF]/30'
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
      <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
        <div className="pb-2 border-b border-[#161C26]">
          <div className="text-[10px] uppercase text-[#6F7887]">COMPANY FISCAL CALENDARS</div>
          <h2 className="text-sm font-bold text-[#F0F4F8]">Where each company is</h2>
          <p className="text-[11px] text-[#8C96A5] font-sans mt-0.5">
            Fiscal quarters don&apos;t match calendar quarters. NVDA is already in its fiscal Q4; MSFT is in fiscal Q2.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#161C26] text-[10px] uppercase text-[#6F7887]">
                <th className="py-2 font-normal">TICKER</th>
                <th className="py-2 font-normal">FY ENDS</th>
                <th className="py-2 font-normal">NOW IN</th>
                <th className="py-2 text-right font-normal">NEXT REPORT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161C26]/60">
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
                <tr key={co.ticker} className="hover:bg-[#121620] transition-colors">
                  <td className="py-2 font-bold text-[#F0F4F8]">{co.ticker}</td>
                  <td className="py-2 text-[#8C96A5]">{co.fyEnds}</td>
                  <td className="py-2 text-[#F0F4F8]">{co.nowIn}</td>
                  <td className="py-2 text-right font-bold text-[#00E599]">{co.nextReport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
