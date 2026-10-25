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
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 rounded-lg border border-[#161C26] bg-[#0D0F14] p-3 sm:px-4 sm:py-3 text-xs text-[#8C96A5]">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/25">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <span className="font-mono font-bold text-[#F0F4F8] mr-1.5 uppercase text-[11px]">System Walkthrough //</span>
          <span className="text-[#6F7887] hidden sm:inline">
            Explore real-time trading telemetry, IDX tickers (<code className="rounded bg-[#07080A] px-1 py-0.5 text-[#00E599] font-mono border border-[#161C26]">.JK</code>), and quantitative desk calculators.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <button
          type="button"
          onClick={handleStartTour}
          className="flex items-center gap-1.5 rounded-md bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 hover:bg-[#00E599]/25 px-3 py-1.5 font-mono text-xs font-bold transition-all"
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Launch Tour</span>
        </button>
        <button
          type="button"
          onClick={handleOpenTutorial}
          className="flex items-center gap-1.5 rounded-md border border-[#161C26] bg-[#07080A] px-2.5 py-1.5 font-mono text-xs font-medium text-[#8C96A5] hover:text-[#F0F4F8] hover:border-[#232B3A] transition-all"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Guide</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="grid h-7 w-7 place-items-center rounded-md text-[#6F7887] hover:bg-[#121620] hover:text-[#F0F4F8] transition"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
