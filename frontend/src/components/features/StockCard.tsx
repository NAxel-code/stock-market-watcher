'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, X } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline } from '@/components/features/Sparkline'
import type { StockQuote } from '@/types/stock'

interface StockCardProps {
  quote?: StockQuote
  isLoading?: boolean
  error?: string
  onRemove?: (ticker: string) => void
  showRemove?: boolean
}

export function StockCard({ quote, isLoading, error, onRemove, showRemove }: StockCardProps) {
  const [flashClass, setFlashClass] = useState('')
  const prevPriceRef = useRef<number | undefined>(undefined)

  const currentPrice = quote?.current_price

  // Flash animation on price change
  useEffect(() => {
    if (currentPrice === undefined) return
    const prev = prevPriceRef.current
    if (prev !== undefined && prev !== currentPrice) {
      const cls = currentPrice > prev ? 'flash-green' : 'flash-red'
      setFlashClass(cls)
      const timer = setTimeout(() => setFlashClass(''), 600)
      return () => clearTimeout(timer)
    }
    prevPriceRef.current = currentPrice
  }, [currentPrice])

  if (isLoading) {
    return (
      <div data-testid="stock-card-skeleton" className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <Skeleton className="h-4 w-16 bg-zinc-700" />
        <Skeleton className="h-6 w-24 bg-zinc-700" />
        <Skeleton className="h-4 w-20 bg-zinc-700" />
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-zinc-900 p-4">
        <p className="text-xs text-red-400">{error ?? 'Failed to load'}</p>
      </div>
    )
  }

  const isPositive = quote.change_percent >= 0

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/30',
        flashClass
      )}
    >
      {showRemove && onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(quote.ticker) }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
          aria-label={`Remove ${quote.ticker} from watchlist`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <Link href={`/stocks/${quote.ticker}`} className="block" aria-label={`View details for ${quote.ticker}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm">{quote.ticker}</span>
              {quote.sector && (
                <span className="text-[9px] text-blue-400 bg-blue-950/40 border border-blue-900/50 px-1 py-0.5 rounded font-medium truncate max-w-[85px]">
                  {quote.sector}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500 truncate max-w-[130px]">{quote.company_name}</div>
          </div>
          {isPositive
            ? <TrendingUp className="h-4 w-4 text-green-400" />
            : <TrendingDown className="h-4 w-4 text-red-400" />
          }
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xl font-bold font-mono">
              {formatCurrency(quote.current_price, quote.currency)}
            </div>
            <div
              className={cn('text-sm font-medium mt-0.5', isPositive ? 'text-green-400' : 'text-red-400')}
              aria-label={`Change: ${formatPercent(quote.change_percent)}`}
            >
              {formatPercent(quote.change_percent)}
            </div>
          </div>
          {quote.sparkline_7d && quote.sparkline_7d.length >= 2 && (
            <div className="pb-1">
              <Sparkline data={quote.sparkline_7d} width={76} height={26} />
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null
              ? `Puncak: ${quote.distance_from_52w_high > 0 ? '+' : ''}${quote.distance_from_52w_high}%`
              : '—'}
          </span>
          {quote.is_stale && (
            <span className="text-amber-400">Delayed</span>
          )}
        </div>
      </Link>
    </div>
  )
}
