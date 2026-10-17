'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Search,
  Clock,
  Calculator,
  Bell,
  HelpCircle,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  ArrowRight,
  Sparkles,
  Compass,
} from 'lucide-react'

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onStartSpotlightTour?: () => void
}

interface Step {
  id: number
  title: string
  badge: string
  Icon: React.ComponentType<{ className?: string }>
  headline: string
  description: string
  tips: string[]
  accentBg: string
  accentIcon: string
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'Cari Ticker (Cmd+K)',
    badge: 'Langkah 1',
    Icon: Search,
    headline: 'Pencarian kilat saham Wall Street (US) & Bursa Efek Indonesia (IDX)',
    description:
      'Tekan pintasan keyboard Cmd+K (Mac) atau Ctrl+K (Windows) di mana saja untuk membuka pencarian cerdas. Ketik nama perusahaan atau simbol ticker saham.',
    tips: [
      'Saham IDX (Indonesia): Gunakan format akhiran .JK (contoh: BBCA.JK, BBRI.JK, TLKM.JK, GOTO.JK).',
      'Saham US: Cukup ketik simbol reguler tanpa akhiran (contoh: AAPL, NVDA, TSLA, MSFT).',
      'Pencarian mendukung autocomplete ticker teraktif pasar.',
    ],
    accentBg: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30',
    accentIcon: 'bg-blue-600 text-white',
  },
  {
    id: 2,
    title: 'Status Pasar Real-Time',
    badge: 'Langkah 2',
    Icon: Clock,
    headline: 'Pantau jam perdagangan BEI & New York secara langsung',
    description:
      'Pita status di bagian atas layar (Market Status Ribbon) selalu mengabarkan apakah bursa sedang aktif atau tutup, lengkap dengan hitung mundur sesi berikutnya.',
    tips: [
      'Bursa IDX (Jakarta): Sesi 1 (09:00 - 12:00 WIB), Sesi 2 (13:30 - 16:00 WIB).',
      'Bursa US (New York): 21:30 - 04:00 WIB (atau 20:30 WIB saat Daylight Saving).',
      'Data saham otomatis disegarkan setiap 1 menit saat jam bursa buka dan 15 menit saat tutup.',
    ],
    accentBg: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30',
    accentIcon: 'bg-amber-600 text-white',
  },
  {
    id: 3,
    title: 'Kalkulator Lot BEI',
    badge: 'Langkah 3',
    Icon: Calculator,
    headline: 'Hitung modal beli per lot (100 lembar) dan estimasi fee sekuritas',
    description:
      'Di pasar modal Indonesia, transaksi saham wajib dalam satuan lot. Pada setiap halaman detail saham IDX, tersedia kalkulator cerdas untuk simulasi dana.',
    tips: [
      '1 Lot = 100 lembar saham (otomatis mengalikan harga pasar aktif).',
      'Termasuk estimasi biaya transaksi sekuritas & BEI (~0.15% beli, ~0.25% jual).',
      'Tombol cepat 1, 5, 10, hingga 50 lot untuk estimasi instan.',
    ],
    accentBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30',
    accentIcon: 'bg-emerald-600 text-white',
  },
  {
    id: 4,
    title: 'Watchlist & Price Alert',
    badge: 'Langkah 4',
    Icon: Bell,
    headline: 'Simpan portofolio pantauan dan pasang alarm target harga',
    description:
      'Bangun daftar pantauan favoritmu tanpa harus login. Klik ikon bookmark pada kartu saham untuk menyimpannya di Watchlist perambanmu.',
    tips: [
      'Watchlist tersimpan otomatis di localStorage perangkat secara aman dan privat.',
      'Fitur Price Alert: Pasang target harga tembus atas (take profit) atau bawah (cut loss).',
      'Grafik interaktif Recharts: Ganti rentang waktu 1 Hari, 1 Minggu, 1 Bulan, 3 Bulan, hingga 1 Tahun.',
    ],
    accentBg: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/30',
    accentIcon: 'bg-purple-600 text-white',
  },
]

const TICKER_CHEAT_SHEET = [
  {
    market: 'IDX (Indonesia)',
    stocks: [
      { ticker: 'BBCA.JK', name: 'Bank Central Asia', sector: 'Financials' },
      { ticker: 'BBRI.JK', name: 'Bank Rakyat Indonesia', sector: 'Financials' },
      { ticker: 'BMRI.JK', name: 'Bank Mandiri', sector: 'Financials' },
      { ticker: 'TLKM.JK', name: 'Telkom Indonesia', sector: 'Telecom' },
      { ticker: 'ASII.JK', name: 'Astra International', sector: 'Automotive' },
      { ticker: 'ICBP.JK', name: 'Indofood CBP', sector: 'Consumer' },
    ],
  },
  {
    market: 'US (Wall Street)',
    stocks: [
      { ticker: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors' },
      { ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corp', sector: 'Software & Cloud' },
      { ticker: 'GOOGL', name: 'Alphabet / Google', sector: 'Internet Services' },
      { ticker: 'TSLA', name: 'Tesla Inc', sector: 'EV & Robotics' },
      { ticker: 'AMZN', name: 'Amazon.com', sector: 'E-Commerce' },
    ],
  },
]

export function TutorialModal({ isOpen, onClose, onStartSpotlightTour }: TutorialModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tour' | 'cheatSheet'>('tour')
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('stockpulse_has_seen_tutorial', 'true')
      } catch {
        // Ignore storage error
      }
    }
    onClose()
  }

  const handleSelectTicker = (ticker: string) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('stockpulse_has_seen_tutorial', 'true')
      } catch {
        // Ignore storage error
      }
    }
    onClose()
    router.push(`/stocks/${ticker}`)
  }

  const step = STEPS[currentStep]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleFinish()
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 id="tutorial-dialog-title" className="text-base font-bold text-zinc-100 leading-tight">
                Panduan Penggunaan StockPulse
              </h2>
              <p className="text-xs text-zinc-400">Kuasai fitur pemantauan saham US & IDX dalam 4 langkah</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            aria-label="Tutup panduan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('tour')}
            className={`flex items-center gap-2 border-b-2 px-4 pb-2.5 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'tour'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>Tur Cepat (4 Fitur)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cheatSheet')}
            className={`flex items-center gap-2 border-b-2 px-4 pb-2.5 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'cheatSheet'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span>Kamus Ticker Populer</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'tour' ? (
            <div className="space-y-5">
              {/* Step Navigation Pills */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 px-1 text-xs font-semibold transition ${
                      currentStep === idx
                        ? 'bg-blue-600 text-white shadow-xs'
                        : currentStep > idx
                        ? 'bg-blue-950/40 text-blue-300 border border-blue-800/60'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span className="hidden sm:inline truncate">{s.title}</span>
                  </button>
                ))}
              </div>

              {/* Step Card */}
              <div
                className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${step.accentBg} p-5`}
              >
                <div className="flex items-start gap-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${step.accentIcon} shadow-sm`}>
                    <step.Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-200 uppercase tracking-wider">
                      {step.badge}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-100">{step.headline}</h3>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1">{step.description}</p>
                  </div>
                </div>

                {/* Highlight Tips */}
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-400" />
                    <span>Poin Penting:</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {step.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300 leading-relaxed">
                <span className="font-semibold text-blue-400">Petunjuk Format Ticker:</span> Saham Indonesia (BEI) memerlukan akhiran <code className="rounded bg-zinc-800 px-1 py-0.5 text-amber-300 font-mono">.JK</code>. Klik ticker di bawah untuk langsung menuju grafik & detail analitiknya.
              </div>

              {TICKER_CHEAT_SHEET.map((group) => (
                <div key={group.market} className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {group.market}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.stocks.map((stock) => (
                      <button
                        key={stock.ticker}
                        type="button"
                        onClick={() => handleSelectTicker(stock.ticker)}
                        className="flex items-center justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-3 text-left transition hover:border-blue-500/50 hover:bg-zinc-800/80 group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition">
                              {stock.ticker}
                            </span>
                            <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                              {stock.sector}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{stock.name}</p>
                        </div>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-900/60 px-5 py-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-200">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Jangan tampilkan otomatis lagi</span>
          </label>

          <div className="flex items-center gap-2">
            {onStartSpotlightTour && (
              <button
                type="button"
                onClick={() => {
                  handleFinish()
                  onStartSpotlightTour()
                }}
                className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 text-xs font-semibold transition"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Mulai Tur Spotlight</span>
              </button>
            )}

            {activeTab === 'tour' && currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>
            )}

            {activeTab === 'tour' && currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs"
              >
                <span>Lanjut</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs"
              >
                <Check className="h-4 w-4" />
                <span>Mulai Jelajah</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
