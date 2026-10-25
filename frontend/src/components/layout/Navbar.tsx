'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, BarChart2, HelpCircle } from 'lucide-react'
import { StockPulseLogo } from '@/components/ui/StockPulseLogo'
import { ThemeToggle } from '@/components/features/ThemeToggle'
import { SearchCommand } from '@/components/features/SearchCommand'
import { MarketStatusRibbon } from '@/components/features/MarketStatusRibbon'
import { AuthModal } from '@/components/features/AuthModal'
import { TutorialModal } from '@/components/features/TutorialModal'
import { SpotlightTour } from '@/components/features/SpotlightTour'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: BarChart2 },
  { href: '/watchlist', label: 'Watchlist', icon: List },
]

export function Navbar() {
  const pathname = usePathname()
  const {
    isTutorialOpen,
    isTourActive,
    openTutorial,
    closeTutorial,
    startSpotlightTour,
    closeTour,
  } = useUIStore()

  return (
    <header className="sticky top-0 z-50 border-b border-[#1A202C]/80 bg-[#07080A]/90 backdrop-blur-xl">
      {/* Real-Time Market Status Ticker */}
      <MarketStatusRibbon />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white group">
            <StockPulseLogo size={28} className="transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-mono font-black text-sm tracking-widest text-[#F0F4F8] uppercase flex items-center gap-1.5">
                StockPulse
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 tracking-normal font-semibold">
                  PRO
                </span>
              </span>
              <span className="text-[10px] text-[#6F7887] font-mono tracking-tight hidden sm:inline -mt-0.5">
                Market Telemetry & Quant Terminal
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-mono font-medium uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
                  pathname === href
                    ? 'bg-[#121620] text-[#00E599] font-bold border border-[#00E599]/30 shadow-[0_0_12px_rgba(0,229,153,0.1)]'
                    : 'text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]/60'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openTutorial}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 transition"
              title="Platform Guide & Tips"
              aria-label="Platform guide"
            >
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <span className="hidden lg:inline">Guide</span>
            </button>
            <div id="tour-search-command">
              <SearchCommand />
            </div>
            <AuthModal />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-14">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-h-[48px] min-w-[64px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                pathname === href ? 'text-blue-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={openTutorial}
            className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-h-[48px] min-w-[64px] text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Open platform guide"
          >
            <HelpCircle className="h-5 w-5 text-blue-400" />
            <span>Guide</span>
          </button>
        </div>
      </nav>

      {/* Interactive Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={closeTutorial}
        onStartSpotlightTour={startSpotlightTour}
      />

      {/* Interactive Spotlight Tour */}
      <SpotlightTour isActive={isTourActive} onClose={closeTour} />
    </header>
  )
}
