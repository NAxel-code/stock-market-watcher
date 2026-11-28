import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  AUTH_TOKEN_KEY,
  addCloudWatchlistTicker,
  ensureClientWorkspaceId,
  fetchAlerts,
  fetchCloudWatchlist,
  fetchTriggeredAlerts,
  removeCloudWatchlistTicker,
  syncCloudWatchlist,
} from '@/lib/api'
import type { PriceAlert } from '@/types/stock'
import type { DisplayCurrency } from '@/lib/currency'
import { FALLBACK_FX_RATES } from '@/lib/currency'
import type { Language } from '@/lib/i18n'

export type TimezoneMode = 'LOCAL' | 'WIB' | 'SGT' | 'EST' | 'UTC'
export type StreamConnectionStatus = 'connecting' | 'live' | 'polling'

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
  display_name?: string | null
}

interface UIStore {
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  setAuthSession: (token: string | null, user: UserProfile | null) => Promise<void>
  watchlist: string[]
  addToWatchlist: (ticker: string) => Promise<void> | void
  removeFromWatchlist: (ticker: string) => Promise<void> | void
  resetToDefaultWatchlist: () => void
  isInWatchlist: (ticker: string) => boolean
  syncWatchlistWithCloud: () => Promise<void>
  syncAlertsWithCloud: () => Promise<void>
  alerts: PriceAlert[]
  triggeredAlerts: PriceAlert[]
  setAlerts: (alerts: PriceAlert[]) => void
  setTriggeredAlerts: (alerts: PriceAlert[]) => void
  addTriggeredAlert: (alert: PriceAlert) => void
  addAlert: (alert: PriceAlert) => void
  removeAlert: (alertId: string) => void
  streamStatus: StreamConnectionStatus
  setStreamStatus: (status: StreamConnectionStatus) => void
  lastStreamTickAt: string | null
  setLastStreamTickAt: (ts: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isTutorialOpen: boolean
  openTutorial: () => void
  closeTutorial: () => void
  isTourActive: boolean
  startSpotlightTour: () => void
  closeTour: () => void
  displayCurrency: DisplayCurrency
  setDisplayCurrency: (currency: DisplayCurrency) => void
  fxRates: Record<string, number>
  setFXRates: (rates: Record<string, number>) => void
  language: Language
  setLanguage: (language: Language) => void
  timezoneMode: TimezoneMode
  setTimezoneMode: (mode: TimezoneMode) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => {
        set({ user })
        if (user) {
          void get().syncWatchlistWithCloud()
          void get().syncAlertsWithCloud()
        }
      },
      setAuthSession: async (token, user) => {
        if (typeof window !== 'undefined') {
          try {
            if (token) {
              window.localStorage.setItem(AUTH_TOKEN_KEY, token)
            } else {
              window.localStorage.removeItem(AUTH_TOKEN_KEY)
            }
          } catch {
            // Ignore storage errors
          }
        }
        set({ user })
        if (user && token) {
          await Promise.all([get().syncWatchlistWithCloud(), get().syncAlertsWithCloud()])
        }
      },
      watchlist: DEFAULT_WATCHLIST,
      resetToDefaultWatchlist: () => {
        set({ watchlist: DEFAULT_WATCHLIST })
        if (typeof window !== 'undefined') {
          ensureClientWorkspaceId()
          void syncCloudWatchlist(DEFAULT_WATCHLIST).catch(() => {})
        }
      },
      addToWatchlist: (ticker) => {
        const current = get().watchlist
        if (current.includes(ticker)) return

        const updated = [...current, ticker]
        set({ watchlist: updated })

        if (typeof window !== 'undefined') {
          ensureClientWorkspaceId()
          void addCloudWatchlistTicker(ticker).catch(() => {})
        }

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

        if (typeof window !== 'undefined') {
          ensureClientWorkspaceId()
          void removeCloudWatchlistTicker(ticker).catch(() => {})
        }

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
        if (typeof window !== 'undefined') {
          ensureClientWorkspaceId()
        }
        try {
          const cloudState = await fetchCloudWatchlist()
          if (cloudState && cloudState.tickers.length > 0) {
            const merged = Array.from(new Set([...cloudState.tickers, ...get().watchlist]))
            set({ watchlist: merged })
            if (merged.length > cloudState.tickers.length) {
              await syncCloudWatchlist(merged).catch(() => {})
            }
          } else {
            await syncCloudWatchlist(get().watchlist).catch(() => {})
          }
        } catch {
          // Offline / test environment fallback
        }

        const user = get().user
        if (!user || !isSupabaseConfigured) return

        try {
          const { data, error } = await supabase
            .from('watchlists')
            .select('ticker')
            .eq('user_id', user.id)

          if (!error && data && data.length > 0) {
            const cloudTickers = data.map((d) => d.ticker)
            const merged = Array.from(new Set([...get().watchlist, ...cloudTickers]))
            set({ watchlist: merged })
          }
        } catch {
          // Fallback silently to local watchlist
        }
      },
      syncAlertsWithCloud: async () => {
        try {
          const [allAlerts, triggered] = await Promise.all([
            fetchAlerts(),
            fetchTriggeredAlerts(),
          ])
          set({ alerts: allAlerts, triggeredAlerts: triggered })
        } catch {
          // Offline fallback
        }
      },
      alerts: [],
      triggeredAlerts: [],
      setAlerts: (alerts) => set({ alerts }),
      setTriggeredAlerts: (triggeredAlerts) => set({ triggeredAlerts }),
      addTriggeredAlert: (alert) =>
        set((state) => ({
          triggeredAlerts: [alert, ...state.triggeredAlerts.filter((a) => a.id !== alert.id)].slice(0, 50),
          alerts: state.alerts.map((a) => (a.id === alert.id ? { ...a, ...alert, is_active: false } : a)),
        })),
      addAlert: (alert) =>
        set((state) => ({
          alerts: [...state.alerts.filter((a) => a.id !== alert.id), alert],
        })),
      removeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        })),
      streamStatus: 'polling',
      setStreamStatus: (streamStatus) => set({ streamStatus }),
      lastStreamTickAt: null,
      setLastStreamTickAt: (lastStreamTickAt) => set({ lastStreamTickAt }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      isTutorialOpen: false,
      openTutorial: () => set({ isTutorialOpen: true, isTourActive: false }),
      closeTutorial: () => set({ isTutorialOpen: false }),
      isTourActive: false,
      startSpotlightTour: () => set({ isTourActive: true, isTutorialOpen: false }),
      closeTour: () => set({ isTourActive: false }),
      displayCurrency: 'NATIVE',
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      fxRates: FALLBACK_FX_RATES,
      setFXRates: (rates) => set((state) => ({ fxRates: { ...state.fxRates, ...rates } })),
      language: 'en',
      setLanguage: (language) => set({ language }),
      timezoneMode: 'LOCAL',
      setTimezoneMode: (timezoneMode) => set({ timezoneMode }),
    }),
    {
      name: 'stockpulse-ui-store',
      partialize: (state) => ({
        user: state.user,
        watchlist: state.watchlist,
        alerts: state.alerts,
        triggeredAlerts: state.triggeredAlerts,
        sidebarOpen: state.sidebarOpen,
        displayCurrency: state.displayCurrency,
        language: state.language,
        timezoneMode: state.timezoneMode,
      }),
    }
  )
)
