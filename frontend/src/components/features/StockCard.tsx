'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, X } from 'lucide-react'
import { formatCurrency, formatPercent, getStockCurrency } from '@/lib/formatters'
import { convertCurrency, formatConvertedPrice } from '@/lib/currency'
import { useUIStore } from '@/stores/useUIStore'
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
  const { displayCurrency, fxRates } = useUIStore()

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

  const isConverted = displayCurrency !== 'NATIVE' && displayCurrency !== stockCurrency
  const convertedAmount = isConverted
    ? convertCurrency(quote.current_price, stockCurrency, displayCurrency, fxRates)
    : null
  const convertedPriceStr = convertedAmount !== null && isConverted
    ? formatConvertedPrice(convertedAmount, displayCurrency)
    : null

  const exchangeLabel = stockCurrency === 'IDR' ? 'IDX' : stockCurrency === 'SGD' ? 'SGX' : 'US'

  return (
    <div
      className={cn(
        'group relative rounded-md border border-[#222226] bg-[#0f0f12] p-3.5 transition-all duration-200',
        'hover:border-[#3f3f46] hover:bg-[#141418]',
        flashClass
      )}
    >
      {showRemove && onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(quote.ticker) }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-[#71717a] hover:text-red-400 p-1 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
          aria-label={`Remove ${quote.ticker} from watchlist`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <Link
        href={`/stocks/${quote.ticker}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4f4f5] rounded"
        aria-label={`View details for ${quote.ticker}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm tracking-tight text-[#f4f4f5] group-hover:text-white">{quote.ticker}</span>
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#27272a] bg-[#141418] text-[#a1a1aa]"
                title={`Exchange: ${exchangeLabel}`}
              >
                {exchangeLabel}
              </span>
              {quote.sector && (
                <span className="text-[9px] font-mono text-[#71717a] bg-[#09090b] border border-[#222226] px-1.5 py-0.2 rounded truncate max-w-[85px]">
                  {quote.sector}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#71717a] truncate max-w-[130px] mt-0.5">{quote.company_name}</div>
          </div>
          {isPositive
            ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            : <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0" />
          }
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-bold font-mono tabular-nums tracking-tight text-[#f4f4f5]">
                {formatCurrency(quote.current_price, stockCurrency)}
              </span>
              {convertedPriceStr && (
                <span className="text-xs font-mono font-medium text-[#a1a1aa] tracking-tight bg-[#141418] px-1 py-0.5 rounded border border-[#222226]">
                  {convertedPriceStr}
                </span>
              )}
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#27272a] bg-[#141418] text-[#a1a1aa] uppercase tracking-wider"
                title={`Currency: ${stockCurrency}`}
              >
                {stockCurrency}
              </span>
            </div>
            <div
              className={cn('text-xs font-mono font-bold tabular-nums mt-0.5', isPositive ? 'text-emerald-400' : 'text-red-400')}
              aria-label={`Change: ${formatPercent(quote.change_percent)}`}
            >
              {formatPercent(quote.change_percent)}
            </div>
          </div>
          {quote.sparkline_7d && quote.sparkline_7d.length >= 2 && (
            <div className="flex flex-col items-end pb-1" title="7-Day Price Trend">
              <span className="text-[8px] font-mono text-[#71717a] font-semibold -mb-0.5">7D</span>
              <Sparkline data={quote.sparkline_7d} width={76} height={24} />
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#222226] flex items-center justify-between text-[10px] text-[#71717a] font-mono tabular-nums">
          <span>
            {quote.distance_from_52w_high !== undefined && quote.distance_from_52w_high !== null
              ? `52W Peak: ${quote.distance_from_52w_high > 0 ? '+' : ''}${quote.distance_from_52w_high}%`
              : '—'}
          </span>
          {quote.is_stale && (
            <span className="text-amber-400 font-mono text-[9px] bg-amber-500/10 border border-amber-500/30 px-1 py-0.2 rounded">
              Delayed
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
