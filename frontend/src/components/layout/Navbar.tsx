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
    <header className="sticky top-0 z-50 border-b border-[#1A202C]/80 bg-[#07080A]/90 backdrop-blur-xl">
      {/* Real-Time Market Status Ticker */}
      <MarketStatusRibbon />

      <div className="container mx-auto px-3 xl:px-4 max-w-7xl">
        <div className="flex h-12 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight text-white group shrink-0">
            <StockPulseLogo size={24} className="transition-transform group-hover:scale-105" />
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-xs xl:text-sm tracking-widest text-[#F0F4F8] uppercase">
                StockPulse
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30 tracking-normal font-semibold">
                PRO
              </span>
            </div>
          </Link>

          {/* Desktop Nav - Institutional Quant Terminal Suite (Fits cleanly at >=1024px) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 py-1 text-[11px] xl:text-xs font-mono font-medium tracking-tight shrink-0">
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
                    'px-1.5 xl:px-2 py-1 rounded transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00E599]',
                    isActive
                      ? 'bg-[#121620] text-[#00E599] font-bold border border-[#00E599]/30'
                      : 'text-[#8C96A5] hover:text-[#F0F4F8] hover:bg-[#121620]/60'
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CurrencySwitcher />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={openTutorial}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 border border-zinc-800 transition"
              title="Platform Guide & Tips"
              aria-label="Platform guide"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden 2xl:inline">{tGuide}</span>
            </button>
            <div id="tour-search-command">
              <SearchCommand />
            </div>
            <AuthModal />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Thumb-friendly full control) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/90 bg-[#07080A]/95 backdrop-blur-md">
        <div className="grid grid-cols-5 items-center h-14 px-1">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
              pathname === '/' ? 'text-[#00E599] font-bold' : 'text-[#6F7887] hover:text-[#F0F4F8]'
            )}
          >
            <BarChart2 className="h-4 w-4" />
            <span>{tDashboard}</span>
          </Link>
          <Link
            href="/markets"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
              pathname === '/markets' ? 'text-[#00E599] font-bold' : 'text-[#6F7887] hover:text-[#F0F4F8]'
            )}
          >
            <Globe className="h-4 w-4" />
            <span>{tMarkets}</span>
          </Link>
          <Link
            href="/portfolio"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
              pathname === '/portfolio' ? 'text-[#00E599] font-bold' : 'text-[#6F7887] hover:text-[#F0F4F8]'
            )}
          >
            <Briefcase className="h-4 w-4" />
            <span>{tPortfolio}</span>
          </Link>
          <Link
            href="/watchlist"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599]',
              pathname === '/watchlist' ? 'text-[#00E599] font-bold' : 'text-[#6F7887] hover:text-[#F0F4F8]'
            )}
          >
            <List className="h-4 w-4" />
            <span>{tWatchlist}</span>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('stockpulse:open-search'))}
            className="flex flex-col items-center justify-center gap-0.5 py-1 min-h-[48px] text-[10px] font-medium text-[#6F7887] hover:text-[#00B2FF] transition-colors"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 text-[#00B2FF]" />
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
