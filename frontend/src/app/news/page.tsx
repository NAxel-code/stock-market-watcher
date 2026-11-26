'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Newspaper, ExternalLink, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsArticle {
  date: string
  importance: 'HIGH' | 'MED'
  source: string
  tags: string
  title: string
  whyItMatters: string
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    date: '23 NOV',
    importance: 'HIGH',
    source: 'CNBC',
    tags: 'NVDA · TECH',
    title: 'Nvidia reinstates Jensen Huang as CEO; stock jumps about a third',
    whyItMatters: 'Your largest single stock moved +32.8% in a day and is now over the 12% trim line.',
  },
  {
    date: '18 NOV',
    importance: 'HIGH',
    source: 'BANK INDONESIA',
    tags: 'ID · RATES',
    title: 'Bank Indonesia raises the BI-Rate 25 bps to 6.00%',
    whyItMatters: 'Defends the rupiah near 18,245 per dollar; higher rates weigh on Indonesian bank and property stocks.',
  },
  {
    date: '17 NOV',
    importance: 'HIGH',
    source: 'NVIDIA',
    tags: 'NVDA · EARNINGS',
    title: 'Nvidia Q3 FY27 revenue $115.8B, up 103%; guides $130B for Q4',
    whyItMatters: 'Sets the bar for late-January big-tech earnings and AI spending expectations.',
  },
  {
    date: '12 NOV',
    importance: 'MED',
    source: 'FEDERAL RESERVE',
    tags: 'US · RATES',
    title: 'Fed sets its 2027 calendar with seven rate decisions instead of eight',
    whyItMatters: 'All seven 2027 decision dates load straight into the Calendar page.',
  },
  {
    date: 'EARLY NOV',
    importance: 'MED',
    source: 'BPS',
    tags: 'ID · INFLATION',
    title: 'Indonesia October inflation at 3.23% year on year',
    whyItMatters: 'Near the top of BI’s 1.5–3.5% target band, so more rate pressure is possible.',
  },
  {
    date: '28 OCT',
    importance: 'HIGH',
    source: 'FEDERAL RESERVE',
    tags: 'US · RATES',
    title: 'Fed holds the funds rate at 3.75–4.00%',
    whyItMatters: 'No cut this time; next decision lands Thu 10 Dec at 3:00am SGT.',
  },
  {
    date: '28 OCT',
    importance: 'MED',
    source: 'US TREASURY',
    tags: 'US · BONDS',
    title: 'US 10-year Treasury yield closes at 5.03%',
    whyItMatters: 'Higher yields make growth stocks pricier to own and pull money into cash and bonds.',
  },
  {
    date: '14 OCT',
    importance: 'MED',
    source: 'MAS',
    tags: 'SG · FX',
    title: 'MAS issues its October monetary policy statement',
    whyItMatters: 'Sets the S$NEER path that drives SGD against USD; next statement due by 29 Jan.',
  },
]

export default function NewsPage() {
  const [filter, setFilter] = useState('All')

  return (
    <div className="space-y-4 font-mono text-[#F0F4F8] pb-16">
      {/* Top Header */}
      <div className="border-b border-[#161C26] pb-3">
        <div className="text-[10px] uppercase font-mono tracking-widest text-[#6F7887]">
          NEWS / HEADLINES AND LINKS ONLY · FULL ARTICLES STAY ON THE SOURCE SITE
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <h1 className="text-xl font-bold tracking-tight text-[#F0F4F8]">
            News
          </h1>
          {/* Lens Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            {['All', 'My holdings', 'Macro and rates', 'Asia', 'Tech', 'Oil and energy', 'Geopolitics', 'Saved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors whitespace-nowrap text-xs font-semibold',
                  filter === tab
                    ? 'bg-[#161D2B] text-[#00E599] border border-[#00E599]/30 font-bold'
                    : 'bg-[#0E121B] text-[#8C96A5] border border-[#161C26] hover:text-[#F0F4F8]'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 2/3 Main Feed, 1/3 Morning Brief & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#161C26]">
            <span className="text-[#6F7887] text-[10px] uppercase tracking-wider">
              LENS: {filter.toUpperCase()} · NEWEST FIRST
            </span>
            <span className="text-[#8C96A5] text-[10px]">
              FEED 8 ITEMS
            </span>
          </div>

          <div className="space-y-3">
            {NEWS_ARTICLES.map((article, idx) => (
              <div
                key={idx}
                className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-2 hover:border-[#232B3A] transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F0F4F8]">{article.date}</span>
                    <span className="text-[#6F7887]">·</span>
                    <span className="text-[#8C96A5]">{article.source} · {article.tags}</span>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.2 rounded font-bold border',
                      article.importance === 'HIGH'
                        ? 'bg-[#FF3B56]/15 text-[#FF3B56] border-[#FF3B56]/30'
                        : 'bg-[#FFB020]/15 text-[#FFB020] border-[#FFB020]/30'
                    )}
                  >
                    {article.importance}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#F0F4F8] hover:text-[#00E599] transition-colors cursor-pointer">
                  {article.title}
                </h3>

                <div className="p-2 rounded bg-[#121620] border border-[#161C26] text-xs font-sans text-[#8C96A5]">
                  <strong className="text-[#00E599] font-mono font-semibold text-[10px]">WHY IT MATTERS · </strong>
                  {article.whyItMatters}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Morning Brief & Sources Pipeline */}
        <div className="space-y-4">
          {/* Morning Brief Card */}
          <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-3">
            <div className="pb-2 border-b border-[#161C26]">
              <div className="text-[10px] uppercase text-[#6F7887]">DAILY BRIEF / TUE 24 NOV · 08:00 SGT</div>
              <h2 className="text-sm font-bold text-[#F0F4F8]">Morning brief</h2>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#00E599] tracking-wider uppercase block mb-1">
                BOTTOM LINE
              </span>
              <p className="text-xs text-[#8C96A5] font-sans leading-relaxed">
                US tech rallied hard on the Nvidia leadership news. Your NVDA weight is now above the 12% trim line. Next big macro date is the FOMC decision on 10 Dec.
              </p>
            </div>

            <div className="pt-2 border-t border-[#161C26]">
              <span className="text-[10px] font-bold text-[#8C96A5] tracking-wider uppercase block mb-1">
                OVERNIGHT
              </span>
              <ul className="text-xs text-[#8C96A5] font-sans space-y-1">
                <li>· NVDA +32.8% after Huang reinstated; Nasdaq +6.95%.</li>
                <li>· USD/IDR steady at 18,245 after BI’s hike last week.</li>
                <li>· US markets shut Thu 26 Nov for Thanksgiving; early close Fri 27 Nov.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-[#161C26]">
              <span className="text-[10px] font-bold text-[#FFB020] tracking-wider uppercase block mb-1">
                ACTION
              </span>
              <p className="text-xs text-[#F0F4F8] font-mono">
                Review NVDA trim (12.6% vs 12% rule).
              </p>
            </div>
          </div>

          {/* Pipeline Card */}
          <div className="bg-[#0E121B] border border-[#161C26] rounded-md p-3.5 space-y-2">
            <div className="pb-1.5 border-b border-[#161C26]">
              <div className="text-[10px] uppercase text-[#6F7887]">PIPELINE</div>
              <h2 className="text-sm font-bold text-[#F0F4F8]">Sources</h2>
            </div>

            <div className="space-y-1 text-xs">
              {[
                { name: 'Federal Reserve press releases (RSS)', status: 'PHASE 1' },
                { name: 'Bank Indonesia press releases', status: 'PHASE 1' },
                { name: 'MAS media releases', status: 'PHASE 1' },
                { name: 'SEC EDGAR filings (8-K, Form 4)', status: 'PHASE 1' },
                { name: 'GDELT topic stream', status: 'PHASE 2' },
                { name: 'AI search agent (Module 2.5b)', status: 'PHASE 2.5' },
                { name: 'Finnhub company news', status: 'PLANNED' },
              ].map((src, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[#161C26]/40 last:border-0">
                  <span className="text-[#8C96A5] truncate pr-2">{src.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#161C26] text-[#6F7887] font-bold shrink-0">
                    {src.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
