import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { PriceAlert } from '@/types/stock'

export const DEFAULT_WATCHLIST = [
  // US Market Top Traded (16 stocks)
  'AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD',
  'NFLX', 'JPM', 'V', 'WMT', 'DIS', 'XOM', 'JNJ', 'LLY',
  // IDX (BEI) Top Traded & LQ45 (16 stocks)
  'BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'BBNI.JK', 'TLKM.JK', 'ASII.JK', 'GOTO.JK', 'ADRO.JK',
  'ANTM.JK', 'BUMI.JK', 'PGAS.JK', 'PTBA.JK', 'ICBP.JK', 'INDF.JK', 'AMRT.JK', 'UNVR.JK',
]

export interface UserProfile {
  id: string
  email?: string
}

interface UIStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  watchlist: string[]
  addToWatchlist: (ticker: string) => Promise<void> | void
  removeFromWatchlist: (ticker: string) => Promise<void> | void
  resetToDefaultWatchlist: () => void
  isInWatchlist: (ticker: string) => boolean
  syncWatchlistWithCloud: () => Promise<void>
  alerts: PriceAlert[]
  setAlerts: (alerts: PriceAlert[]) => void
  addAlert: (alert: PriceAlert) => void
  removeAlert: (alertId: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => {
        set({ user })
        if (user) {
          get().syncWatchlistWithCloud()
        }
      },
      watchlist: DEFAULT_WATCHLIST,
      resetToDefaultWatchlist: () => set({ watchlist: DEFAULT_WATCHLIST }),
      addToWatchlist: (ticker) => {
        const current = get().watchlist
        if (current.includes(ticker)) return

        const updated = [...current, ticker]
        set({ watchlist: updated })

        // If authenticated and Supabase configured, sync to database
        const user = get().user
        if (user && isSupabaseConfigured) {
          supabase
            .from('watchlists')
            .upsert({ user_id: user.id, ticker })
            .then()
        }
      },
      removeFromWatchlist: (ticker) => {
        const updated = get().watchlist.filter((t) => t !== ticker)
        set({ watchlist: updated })

        const user = get().user
        if (user && isSupabaseConfigured) {
          supabase
            .from('watchlists')
            .delete()
            .match({ user_id: user.id, ticker })
            .then()
        }
      },
      isInWatchlist: (ticker) => get().watchlist.includes(ticker),
      syncWatchlistWithCloud: async () => {
        const user = get().user
        if (!user || !isSupabaseConfigured) return

        try {
          const { data, error } = await supabase
            .from('watchlists')
            .select('ticker')
            .eq('user_id', user.id)

          if (!error && data && data.length > 0) {
            const cloudTickers = data.map((d) => d.ticker)
            // Merge with local watchlist
            const merged = Array.from(new Set([...get().watchlist, ...cloudTickers]))
            set({ watchlist: merged })
          }
        } catch {
          // Fallback silently to local watchlist
        }
      },
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts.filter((a) => a.id !== alert.id), alert],
        })),
      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        })),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'stockpulse-ui-store',
    }
  )
)
