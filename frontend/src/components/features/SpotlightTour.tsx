'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Compass,
  Lightbulb,
} from 'lucide-react'

export interface TourStep {
  targetId: string
  badge: string
  title: string
  description: string
  hint: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-market-status',
    badge: 'Langkah 1 dari 5',
    title: 'Pita Status Pasar Real-Time (Market Ribbon)',
    description:
      'Pantau jam perdagangan aktif bursa Indonesia (BEI/IDX: 09:00 - 16:00 WIB) dan Wall Street (NYSE/NASDAQ: 21:30 - 04:00 WIB). Sistem menghitung mundur jam buka/tutup dan menyegarkan data otomatis setiap 1 menit saat pasar beroperasi.',
    hint: '💡 Titik hijau berkedip menandakan sesi perdagangan sedang berlangsung secara langsung (live session).',
  },
  {
    targetId: 'tour-search-command',
    badge: 'Langkah 2 dari 5',
    title: 'Pencarian Cerdas Ticker (Cmd+K / Ctrl+K)',
    description:
      'Tekan pintasan Cmd+K (Mac) atau Ctrl+K (Windows) di halaman mana saja untuk memanggil Command Palette pencarian instan. Cukup ketik simbol ticker atau nama emiten.',
    hint: '💡 Untuk saham Indonesia (BEI), gunakan format akhiran .JK (misal: BBCA.JK, BBRI.JK, GOTO.JK). Saham US cukup ketik simbol biasa (AAPL, NVDA).',
  },
  {
    targetId: 'tour-market-summary',
    badge: 'Langkah 3 dari 5',
    title: 'Ringkasan Indeks Utama & Sparkline',
    description:
      'Lihat barometer pergerakan bursa dunia dalam sekejap: S&P 500, Nasdaq, Dow Jones, dan IHSG (Jakarta Composite Index) lengkap dengan grafik sparkline tren harian dan persentase perubahan.',
    hint: '💡 Warna hijau (+%) menandakan bursa menguat, sedangkan merah (-%) menandakan bursa terkoreksi.',
  },
  {
    targetId: 'tour-sector-filter',
    badge: 'Langkah 4 dari 5',
    title: 'Filter Sektor & Klasifikasi Bursa',
    description:
      'Saring daftar pantauan dengan satu klik: tampilkan hanya saham Indonesia (IDX), saham US, atau persektor industri (Teknologi, Finansial, Kesehatan, Energi, dll).',
    hint: "💡 Tombol 'Reset Unggulan' mengembalikan daftar pantauan ke 32 saham teraktif rekomendasi pasar.",
  },
  {
    targetId: 'tour-stock-grid',
    badge: 'Langkah 5 dari 5',
    title: 'Kartu Saham Interaktif & Analitik Detail',
    description:
      'Setiap kartu menampilkan harga real-time (USD / IDR), grafik mini tren, dan tombol bookmark Watchlist. Klik kartu saham mana pun untuk membuka halaman analitik lengkap: Grafik Recharts 1D-1Y, Rentang 52 Minggu, Simulasi Kalkulator Lot BEI (1 Lot = 100 lembar), dan Price Alert.',
    hint: '💡 Seluruh watchlist disimpan otomatis dan privat di perangkat browser Anda tanpa wajib mendaftar akun.',
  },
]

interface SpotlightTourProps {
  isActive: boolean
  onClose: () => void
}

export function SpotlightTour({ isActive, onClose }: SpotlightTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const updateTargetRect = useCallback(() => {
    if (!isActive) return
    const step = TOUR_STEPS[currentStep]
    const el = document.getElementById(step.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
      }, 350)
    } else {
      setTargetRect(null)
    }
  }, [isActive, currentStep])

  useEffect(() => {
    if (isActive) {
      updateTargetRect()
      window.addEventListener('resize', updateTargetRect)
      window.addEventListener('scroll', updateTargetRect)
      return () => {
        window.removeEventListener('resize', updateTargetRect)
        window.removeEventListener('scroll', updateTargetRect)
      }
    } else {
      setTargetRect(null)
    }
  }, [isActive, currentStep, updateTargetRect])

  // Keyboard Navigation: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isActive) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1)
        } else {
          try {
            localStorage.setItem('stockpulse_has_seen_tour', 'true')
          } catch {
            // ignore
          }
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep, onClose])

  if (!isActive) return null

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      try {
        localStorage.setItem('stockpulse_has_seen_tour', 'true')
      } catch {
        // ignore
      }
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const step = TOUR_STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* Dark Translucent Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Spotlight Luminous Cutout & Ring */}
      {targetRect && (
        <div
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="absolute pointer-events-none rounded-xl ring-2 ring-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.45)] transition-all duration-300"
        />
      )}

      {/* Floating Spotlight Card */}
      <div className="absolute inset-x-3 bottom-5 sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:max-w-xl">
        <div className="rounded-2xl border border-zinc-700/90 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 text-zinc-100">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-400 border border-blue-500/20">
              {step.badge}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup tur"
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{step.title}</span>
          </h3>
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">
            {step.description}
          </p>

          {/* Pro Tip Box */}
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-[11px] text-zinc-300">
            {step.hint}
          </div>

          {/* Card Footer: Step Dots and Buttons */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === idx
                      ? 'w-6 bg-blue-500'
                      : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Ke langkah ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Lewati
              </button>

              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs"
              >
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <>
                    <span>Lanjut</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Selesai</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
