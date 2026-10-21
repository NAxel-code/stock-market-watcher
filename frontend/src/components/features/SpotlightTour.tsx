'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
    badge: 'Step 1 of 5',
    title: 'Real-Time Market Status (Market Ribbon)',
    description:
      'Monitor active trading hours for Indonesia (IDX: 09:00 - 16:00 WIB) and Wall Street (NYSE/NASDAQ: 21:30 - 04:00 WIB). The system counts down to open/close times and automatically refreshes data every 1 minute during live sessions.',
    hint: '💡 A pulsating green dot indicates an active live trading session.',
  },
  {
    targetId: 'tour-search-command',
    badge: 'Step 2 of 5',
    title: 'Smart Ticker Search (Cmd+K / Ctrl+K)',
    description:
      'Press Cmd+K (Mac) or Ctrl+K (Windows) on any page to open the instant Command Palette. Simply type a ticker symbol or company name.',
    hint: '💡 For Indonesian stocks (IDX), append .JK (e.g., BBCA.JK, BBRI.JK, GOTO.JK). For US stocks, use standard symbols (AAPL, NVDA).',
  },
  {
    targetId: 'tour-market-summary',
    badge: 'Step 3 of 5',
    title: 'Major Indices & Sparklines',
    description:
      'Get an instant pulse on global markets: S&P 500, Nasdaq, Dow Jones, and IHSG (Jakarta Composite Index) complete with intraday sparklines and percentage changes.',
    hint: '💡 Green (+%) indicates market gains, while red (-%) indicates a pullback.',
  },
  {
    targetId: 'tour-sector-filter',
    badge: 'Step 4 of 5',
    title: 'Sector & Exchange Filtering',
    description:
      'Filter your watchlist with a single click: view Indonesian stocks (IDX), US equities, or industry sectors (Technology, Financials, Healthcare, Energy, etc.).',
    hint: "💡 The 'Reset to Default' button restores your watchlist to 32 featured bluechips.",
  },
  {
    targetId: 'tour-stock-grid',
    badge: 'Step 5 of 5',
    title: 'Interactive Stock Cards & Deep Analytics',
    description:
      'Each card shows live prices (USD / IDR), 7-day sparklines, and watchlist bookmarking. Click any card to open full analytics: 1D-1Y Recharts, 52-Week Range Bar, IDX Lot Calculator (1 Lot = 100 shares), and Price Alerts.',
    hint: '💡 Your watchlist is stored automatically and privately in your browser with zero registration required.',
  },
]

interface SpotlightTourProps {
  isActive: boolean
  onClose: () => void
}

export function SpotlightTour({ isActive, onClose }: SpotlightTourProps) {
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Scroll target element into view once when active or step changes
  const scrollToTarget = useCallback(() => {
    if (!isActive) return
    const step = TOUR_STEPS[currentStep]
    const el = document.getElementById(step.targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive, currentStep])

  // Update bounding box coordinates on scroll/resize without re-triggering scroll
  const updateRectOnly = useCallback(() => {
    if (!isActive) {
      setTargetRect(null)
      return
    }
    const step = TOUR_STEPS[currentStep]
    const el = document.getElementById(step.targetId)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [isActive, currentStep])

  useEffect(() => {
    if (isActive) {
      scrollToTarget()
      updateRectOnly()
      const timer = setTimeout(updateRectOnly, 350)
      window.addEventListener('resize', updateRectOnly)
      window.addEventListener('scroll', updateRectOnly)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateRectOnly)
        window.removeEventListener('scroll', updateRectOnly)
      }
    } else {
      setTargetRect(null)
    }
  }, [isActive, currentStep, scrollToTarget, updateRectOnly])

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

  if (!isActive || !mounted) return null

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

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* Dark Translucent Backdrop with Cutout */}
      {targetRect ? (
        <>
          <div
            onClick={onClose}
            className="fixed inset-0 z-40"
            aria-hidden="true"
          />
          <div
            style={{
              top: `${Math.max(0, targetRect.top - 6)}px`,
              left: `${Math.max(0, targetRect.left - 6)}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            }}
            className="fixed pointer-events-none rounded-xl ring-2 sm:ring-4 ring-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.65)] transition-all duration-300 z-40"
          >
            <span className="absolute -top-7 left-2 flex items-center gap-1.5 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
              <Sparkles className="h-3 w-3" />
              <span>{step.badge}</span>
            </span>
          </div>
        </>
      ) : (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300 z-40"
        />
      )}

      {/* Floating Spotlight Card */}
      <div className="fixed inset-x-3 bottom-5 sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:max-w-xl">
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
                aria-label="Close tour"
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
                  aria-label={`Go to step ${idx + 1}`}
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
                Skip
              </button>

              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-xs"
              >
                {currentStep < TOUR_STEPS.length - 1 ? (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Done</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
