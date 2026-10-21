'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X, Compass, BookOpen } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'

export function OnboardingBanner() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const { openTutorial, startSpotlightTour } = useUIStore()

  useEffect(() => {
    setMounted(true)
    try {
      const hasSeen = localStorage.getItem('stockpulse_has_seen_tutorial')
      if (!hasSeen) {
        setVisible(true)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  if (!mounted || !visible) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem('stockpulse_has_seen_tutorial', 'true')
    } catch {
      // Ignore localStorage errors
    }
    setVisible(false)
  }

  const handleStartTour = () => {
    startSpotlightTour()
    handleDismiss()
  }

  const handleOpenTutorial = () => {
    openTutorial()
    handleDismiss()
  }

  return (
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/50 via-zinc-900/70 to-zinc-900/40 p-3 sm:px-4 sm:py-3 text-xs text-zinc-300 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <span className="font-semibold text-zinc-100 mr-1.5">New to StockPulse?</span>
          <span className="text-zinc-400 hidden sm:inline">
            Take a quick 1-minute interactive tour to explore market hours, IDX tickers (<code className="rounded bg-zinc-800 px-1 py-0.5 text-amber-300 font-mono">.JK</code>), and lot calculators.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <button
          type="button"
          onClick={handleStartTour}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500 transition shadow-xs"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Start Spotlight Tour</span>
        </button>
        <button
          type="button"
          onClick={handleOpenTutorial}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Ticker Guide</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
