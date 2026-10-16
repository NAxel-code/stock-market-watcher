'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { StockSearchResult } from '@/types/stock'

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
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
        <span className="text-xs">Cari saham...</span>
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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search stocks (e.g. AAPL, BBCA)..."
          value={query}
          onValueChange={(val) => {
            setQuery(val)
            if (!val.trim()) setResults([])
          }}
        />
        <CommandList>
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && query.length > 0 && displayedResults.length === 0 && (
            <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
          )}
          {displayedResults.length > 0 && (
            <CommandGroup heading="Stocks">
              {displayedResults.map((result) => {
                const isIdx = isIdxTicker(result.ticker)
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
                      <span
                        className={cn(
                          'text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded border',
                          isIdx
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                            : 'bg-blue-950/70 text-blue-400 border-blue-800/80'
                        )}
                      >
                        {isIdx ? 'IDX • IDR' : 'US • USD'}
                      </span>
                      <span className="text-xs text-zinc-500 hidden sm:inline">{result.exchange}</span>
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
