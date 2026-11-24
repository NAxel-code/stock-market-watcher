'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRightLeft, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { searchTickers } from '@/lib/api'
import { isIdxTicker } from '@/lib/formatters'
import { convertCurrency, formatConvertedPrice } from '@/lib/currency'
import { useUIStore } from '@/stores/useUIStore'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { StockSearchResult } from '@/types/stock'

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const fxRates = useUIStore((s) => s.fxRates)

  // Quick FX Parser
  const fxConversion = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return null

    // Pattern 1: "1000 usd to idr", "50 sgd in idr", "100 usd = sgd"
    const patternAmount = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]{3})\s*(?:to|in|=|->)\s*([a-zA-Z]{3})$/i
    // Pattern 2: "usd to idr", "usd/idr", "sgd in idr"
    const patternPair = /^([a-zA-Z]{3})\s*(?:\/|to|in|=|->)\s*([a-zA-Z]{3})$/i

    let amount = 1
    let fromCurr = ''
    let toCurr = ''

    const matchAmount = trimmed.match(patternAmount)
    if (matchAmount) {
      amount = parseFloat(matchAmount[1])
      fromCurr = matchAmount[2].toUpperCase()
      toCurr = matchAmount[3].toUpperCase()
    } else {
      const matchPair = trimmed.match(patternPair)
      if (matchPair) {
        amount = 1
        fromCurr = matchPair[1].toUpperCase()
        toCurr = matchPair[2].toUpperCase()
      }
    }

    if (!fromCurr || !toCurr) return null

    const result = convertCurrency(amount, fromCurr, toCurr, fxRates)
    if (result === null) return null

    const unitRate = convertCurrency(1, fromCurr, toCurr, fxRates)

    return {
      amount,
      fromCurr,
      toCurr,
      result,
      formattedResult: formatConvertedPrice(result, toCurr),
      unitRateText: unitRate ? `1 ${fromCurr} = ${unitRate >= 100 ? Math.round(unitRate).toLocaleString() : unitRate.toFixed(4)} ${toCurr}` : null,
    }
  }, [query, fxRates])

  // Cmd+K / Ctrl+K shortcut & custom event
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    const openHandler = () => setOpen(true)

    document.addEventListener('keydown', handler)
    window.addEventListener('stockpulse:open-search', openHandler)
    return () => {
      document.removeEventListener('keydown', handler)
      window.removeEventListener('stockpulse:open-search', openHandler)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchTickers(trimmed)
        if (isMounted) setResults(data)
      } catch {
        if (isMounted) setResults([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [query])

  const displayedResults = query.trim() ? results : []

  const handleSelect = useCallback(
    (ticker: string) => {
      setOpen(false)
      setQuery('')
      setResults([])
      router.push(`/stocks/${ticker}`)
    },
    [router]
  )

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-zinc-300 border-zinc-700/80 bg-zinc-900/90 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 w-52 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shadow-xs"
        onClick={() => setOpen(true)}
        aria-label="Search stocks"
      >
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs">Search stocks...</span>
        <kbd className="ml-auto text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden text-zinc-400 hover:text-zinc-100 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={() => setOpen(true)}
        aria-label="Search stocks"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search stocks (e.g. AAPL, BBCA)..."
          value={query}
          onValueChange={(val) => {
            setQuery(val)
            if (!val.trim()) setResults([])
          }}
        />
        <CommandList>
          {fxConversion && (
            <CommandGroup heading="Quick FX Conversion">
              <CommandItem
                value={`fx-${fxConversion.fromCurr}-${fxConversion.toCurr}`}
                onSelect={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(`${fxConversion.result}`)
                  }
                  toast.success(`Copied ${fxConversion.formattedResult} to clipboard!`)
                }}
                className="flex items-center justify-between p-2.5 bg-[#00B2FF]/5 border border-[#00B2FF]/20 rounded-md cursor-pointer hover:bg-[#00B2FF]/10 transition-colors my-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-full bg-[#00B2FF]/15 text-[#00B2FF]">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#F0F4F8]">
                      {fxConversion.amount.toLocaleString()} {fxConversion.fromCurr}
                    </div>
                    {fxConversion.unitRateText && (
                      <div className="text-[10px] font-mono text-[#6F7887]">
                        Rate: {fxConversion.unitRateText}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-[#00E599]">
                    {fxConversion.formattedResult}
                  </div>
                  <div className="text-[10px] text-[#6F7887] font-sans flex items-center justify-end gap-1">
                    <Copy className="h-3 w-3" />
                    <span>Click to copy</span>
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          )}
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && query.length > 0 && !fxConversion && displayedResults.length === 0 && (
            <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
          )}
          {displayedResults.length > 0 && (
            <CommandGroup heading="Stocks">
              {displayedResults.map((result) => {
                const isIdx = isIdxTicker(result.ticker)
                const isSgx = result.ticker.toUpperCase().endsWith('.SI')
                const curr = result.currency || (isIdx ? 'IDR' : (isSgx ? 'SGD' : 'USD'))
                const exch = result.exchange || (isIdx ? 'IDX' : (isSgx ? 'SGX' : 'US'))
                const isOtc = result.is_primary === false || exch.toUpperCase().includes('OTC') || exch.toUpperCase().includes('PNK')

                return (
                  <CommandItem
                    key={result.ticker}
                    value={result.ticker}
                    onSelect={() => handleSelect(result.ticker)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono font-bold text-sm text-zinc-100">{result.ticker}</span>
                      <span className="text-zinc-400 text-sm truncate">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOtc ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/80 uppercase">
                          OTC / ADR
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/70 text-blue-400 border border-blue-800/80 uppercase">
                          PRIMARY
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded border uppercase',
                          isIdx
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                            : isSgx
                            ? 'bg-amber-950/70 text-amber-400 border-amber-800/80'
                            : 'bg-blue-950/70 text-blue-400 border-blue-800/80'
                        )}
                      >
                        {exch} • {curr}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
