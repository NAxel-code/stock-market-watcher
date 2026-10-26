'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, X } from 'lucide-react'
import { formatCurrency, formatPercent, getStockCurrency } from '@/lib/formatters'
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
  const stockCurrency = getStockCurrency(quote)

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-[#161C26] bg-[#0D0F14] p-3.5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-[#1F2937] hover:bg-[#10131A] hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]',
        isPositive ? 'hover:border-[#00E599]/30' : 'hover:border-[#FF3B56]/30',
        flashClass
      )}
    >
      {showRemove && onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(quote.ticker) }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-[#6F7887] hover:text-[#FF3B56] p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3B56]"
          aria-label={`Remove ${quote.ticker} from watchlist`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <Link
        href={`/stocks/${quote.ticker}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E599] rounded"
        aria-label={`View details for ${quote.ticker}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm tracking-tight text-[#F0F4F8] group-hover:text-white">{quote.ticker}</span>
              <span
                className={cn(
                  'text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border',
                  stockCurrency === 'IDR'
                    ? 'text-[#00E599] bg-[#00E599]/10 border-[#00E599]/30'
                    : 'text-[#00B2FF] bg-[#00B2FF]/10 border-[#00B2FF]/30'
                )}
                title={`Exchange: ${stockCurrency === 'IDR' ? 'Indonesia (IDX)' : 'United States (US)'}`}
              >
                {stockCurrency === 'IDR' ? 'IDX' : 'US'}
              </span>
              {quote.sector && (
                <span className="text-[9px] font-mono text-[#8C96A5] bg-[#07080A] border border-[#161C26] px-1.5 py-0.2 rounded truncate max-w-[85px]">
                  {quote.sector}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#6F7887] truncate max-w-[130px] mt-0.5">{quote.company_name}</div>
          </div>
          {isPositive
            ? <TrendingUp className="h-3.5 w-3.5 text-[#00E599] shrink-0" />
            : <TrendingDown className="h-3.5 w-3.5 text-[#FF3B56] shrink-0" />
          }
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums tracking-tight text-[#F0F4F8]">
                {formatCurrency(quote.current_price, stockCurrency)}
              </span>
              <span
                className={cn(
                  'text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider',
                  stockCurrency === 'IDR'
                    ? 'text-[#00E599] bg-[#00E599]/10 border-[#00E599]/30'
                    : 'text-[#00B2FF] bg-[#00B2FF]/10 border-[#00B2FF]/30'
                )}
                title={`Currency: ${stockCurrency}`}
              >
                {stockCurrency}
              </span>
            </div>
            <div
              className={cn('text-xs font-mono font-bold tabular-nums mt-0.5', isPositive ? 'text-[#00E599]' : 'text-[#FF3B56]')}
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

        <div className="mt-2.5 pt-2 border-t border-[#161C26] flex items-center justify-between text-[10px] text-[#6F7887] font-mono tabular-nums">
          <span>
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null
              ? `52W Peak: ${quote.distance_from_52w_high > 0 ? '+' : ''}${quote.distance_from_52w_high}%`
              : '—'}
          </span>
          {quote.is_stale && (
            <span className="text-[#FFB800] font-mono text-[9px] bg-[#FFB800]/10 border border-[#FFB800]/30 px-1 py-0.2 rounded">
              Delayed
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
