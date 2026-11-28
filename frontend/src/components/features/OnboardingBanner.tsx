'use client'

import React, { useState, useEffect, useSyncExternalStore } from 'react'
import { Sparkles, X, Compass, BookOpen } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'

const emptySubscribe = () => () => {}

export function OnboardingBanner() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [visible, setVisible] = useState(false)
  const { openTutorial, startSpotlightTour } = useUIStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const hasSeen = localStorage.getItem('stockpulse_has_seen_tutorial')
        if (!hasSeen) {
          setVisible(true)
        }
      } catch {
        // Ignore localStorage errors
      }
    }, 0)
    return () => clearTimeout(timer)
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
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-md border border-[#222226] bg-[#0f0f12] p-3 sm:px-4 sm:py-3 text-xs text-[#a1a1aa]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[#18181b] text-[#f4f4f5] border border-[#27272a]">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <span className="font-mono font-bold text-[#f4f4f5] mr-1.5 uppercase text-[11px]">System Walkthrough //</span>
          <span className="text-[#71717a] hidden sm:inline">
            Explore real-time trading telemetry, IDX tickers (<code className="rounded bg-[#09090b] px-1 py-0.5 text-[#f4f4f5] font-mono border border-[#222226]">.JK</code>), and quantitative desk calculators.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <button
          type="button"
          onClick={handleStartTour}
          className="flex items-center gap-1.5 rounded bg-[#f4f4f5] text-[#09090b] hover:bg-white px-3 py-1.5 font-mono text-xs font-bold transition-all"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Launch Tour</span>
        </button>
        <button
          type="button"
          onClick={handleOpenTutorial}
          className="flex items-center gap-1.5 rounded border border-[#222226] bg-[#141418] px-2.5 py-1.5 font-mono text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] hover:border-[#3f3f46] transition-all"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Guide</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="grid h-7 w-7 place-items-center rounded text-[#71717a] hover:bg-[#141418] hover:text-[#f4f4f5] transition"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
