'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { List, BarChart2, Globe, Briefcase, HelpCircle, Search } from 'lucide-react'
import { StockPulseLogo } from '@/components/ui/StockPulseLogo'
import { ThemeToggle } from '@/components/features/ThemeToggle'
import { SearchCommand } from '@/components/features/SearchCommand'
import { CurrencySwitcher } from '@/components/features/CurrencySwitcher'
import { LanguageSwitcher } from '@/components/features/LanguageSwitcher'
import { MarketStatusRibbon } from '@/components/features/MarketStatusRibbon'
import { AuthModal } from '@/components/features/AuthModal'
import { TutorialModal } from '@/components/features/TutorialModal'
import { SpotlightTour } from '@/components/features/SpotlightTour'
import { useUIStore } from '@/stores/useUIStore'
import { getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const {
    isTutorialOpen,
    isTourActive,
    openTutorial,
    closeTutorial,
    startSpotlightTour,
    closeTour,
    language,
  } = useUIStore()

  const tDashboard = getTranslation('dashboard', language)
  const tMarkets = getTranslation('markets', language)
  const tPortfolio = getTranslation('portfolio', language)
  const tWatchlist = getTranslation('watchlist', language)
  const tSearch = getTranslation('search', language)
  const tGuide = getTranslation('guide', language)

  return (
    <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#222226]">
      {/* Row 1: Primary Minimalist Header */}
      <div className="border-b border-[#18181b]">
        <div className="container mx-auto px-3 xl:px-4 max-w-7xl">
          <div className="flex h-12 items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white group shrink-0">
              <StockPulseLogo size={22} className="transition-transform group-hover:scale-105" />
              <span className="font-mono font-bold text-xs xl:text-sm tracking-[0.14em] text-[#f4f4f5] uppercase">
                StockPulse
              </span>
            </Link>

            {/* Desktop Nav - Minimalist 10-Screen Suite */}
            <nav className="hidden lg:flex items-center gap-0.5 py-1 text-[11px] xl:text-xs font-sans font-medium tracking-tight shrink-0">
              {[
                { href: '/', label: 'Home' },
                { href: '/portfolio', label: 'Portfolio' },
                { href: '/watchlist', label: 'Watchlists' },
                { href: '/markets', label: 'Markets' },
                { href: '/macro', label: 'Macro' },
                { href: '/news', label: 'News' },
                { href: '/calendar', label: 'Calendar' },
                { href: '/map', label: 'Map' },
                { href: '/screener', label: 'Screener' },
                { href: '/models', label: 'Models' },
              ].map((tab) => {
                const isActive = pathname === tab.href
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      'px-2 2xl:px-2.5 py-1 rounded transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
                      isActive
                        ? 'text-[#f4f4f5] font-semibold border-b-2 border-[#f4f4f5] rounded-b-none'
                        : 'text-[#71717a] hover:text-[#e4e4e7]'
                    )}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <div id="tour-search-command">
                <SearchCommand />
              </div>
              <CurrencySwitcher />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={openTutorial}
                className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded text-xs text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#141418] border border-transparent hover:border-[#222226] transition-colors"
                title="Platform Guide & Tips"
                aria-label="Platform guide"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden 2xl:inline">{tGuide}</span>
              </button>
              <AuthModal />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Live Market Status & FX Telemetry Strip */}
      <MarketStatusRibbon />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#222226] bg-[#09090b]/95 backdrop-blur-md">
        <div className="grid grid-cols-5 items-center h-14 px-1">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors',
              pathname === '/' ? 'text-[#f4f4f5] font-semibold' : 'text-[#71717a] hover:text-[#f4f4f5]'
            )}
          >
            <BarChart2 className="h-4 w-4" />
            <span>{tDashboard}</span>
          </Link>
          <Link
            href="/markets"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors',
              pathname === '/markets' ? 'text-[#f4f4f5] font-semibold' : 'text-[#71717a] hover:text-[#f4f4f5]'
            )}
          >
            <Globe className="h-4 w-4" />
            <span>{tMarkets}</span>
          </Link>
          <Link
            href="/portfolio"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors',
              pathname === '/portfolio' ? 'text-[#f4f4f5] font-semibold' : 'text-[#71717a] hover:text-[#f4f4f5]'
            )}
          >
            <Briefcase className="h-4 w-4" />
            <span>{tPortfolio}</span>
          </Link>
          <Link
            href="/watchlist"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors',
              pathname === '/watchlist' ? 'text-[#f4f4f5] font-semibold' : 'text-[#71717a] hover:text-[#f4f4f5]'
            )}
          >
            <List className="h-4 w-4" />
            <span>{tWatchlist}</span>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('stockpulse:open-search'))}
            className="flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium text-[#71717a] hover:text-[#f4f4f5] transition-colors"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
            <span>{tSearch}</span>
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
