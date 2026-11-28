'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ensureClientWorkspaceId } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import { useLiveQuoteStream } from '@/hooks/useLiveQuoteStream'

function LiveStreamCoordinator() {
  const watchlist = useUIStore((s) => s.watchlist)
  const syncWatchlistWithCloud = useUIStore((s) => s.syncWatchlistWithCloud)
  const syncAlertsWithCloud = useUIStore((s) => s.syncAlertsWithCloud)

  useEffect(() => {
    ensureClientWorkspaceId()
    void syncWatchlistWithCloud()
    void syncAlertsWithCloud()
  }, [syncWatchlistWithCloud, syncAlertsWithCloud])

  // Stream top 12 watchlist tickers globally for real-time ticks & 24/7 alert push notifications
  useLiveQuoteStream(watchlist.slice(0, 12), true)

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LiveStreamCoordinator />
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
