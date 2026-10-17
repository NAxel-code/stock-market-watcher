'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, List, BarChart2, HelpCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/features/ThemeToggle'
import { SearchCommand } from '@/components/features/SearchCommand'
import { MarketStatusRibbon } from '@/components/features/MarketStatusRibbon'
import { AuthModal } from '@/components/features/AuthModal'
import { TutorialModal } from '@/components/features/TutorialModal'
import { SpotlightTour } from '@/components/features/SpotlightTour'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: BarChart2 },
  { href: '/watchlist', label: 'Watchlist', icon: List },
]

export function Navbar() {
  const pathname = usePathname()
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isTourActive, setIsTourActive] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      {/* Real-Time Market Status Ticker */}
      <MarketStatusRibbon />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="hidden sm:inline">StockPulse</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  pathname === href
                    ? 'bg-zinc-800/90 text-zinc-50 font-semibold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
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
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 transition"
              title="Panduan & Trik Penggunaan"
              aria-label="Panduan penggunaan"
            >
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <span className="hidden lg:inline">Panduan</span>
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
            onClick={() => setIsTutorialOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-h-[48px] min-w-[64px] text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Buka panduan penggunaan"
          >
            <HelpCircle className="h-5 w-5 text-blue-400" />
            <span>Panduan</span>
          </button>
        </div>
      </nav>

      {/* Interactive Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartSpotlightTour={() => {
          setIsTutorialOpen(false)
          setIsTourActive(true)
        }}
      />

      {/* Interactive Spotlight Tour */}
      <SpotlightTour isActive={isTourActive} onClose={() => setIsTourActive(false)} />
    </header>
  )
}
