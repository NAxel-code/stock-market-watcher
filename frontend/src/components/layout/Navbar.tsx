'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, List, BarChart2 } from 'lucide-react'
import { ThemeToggle } from '@/components/features/ThemeToggle'
import { SearchCommand } from '@/components/features/SearchCommand'
import { MarketStatusRibbon } from '@/components/features/MarketStatusRibbon'
import { AuthModal } from '@/components/features/AuthModal'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Dashboard', icon: BarChart2 },
  { href: '/watchlist', label: 'Watchlist', icon: List },
]

export function Navbar() {
  const pathname = usePathname()

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
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <SearchCommand />
            <AuthModal />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-14">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors',
                pathname === href ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
