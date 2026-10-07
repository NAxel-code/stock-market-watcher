import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './useUIStore'

describe('useUIStore zustand store', () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.setState({
      watchlist: ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL', 'BBCA.JK', 'TLKM.JK', 'GOTO.JK'],
      sidebarOpen: false,
    })
  })

  it('initializes with default watchlist', () => {
    const state = useUIStore.getState()
    expect(state.watchlist).toHaveLength(8)
    expect(state.watchlist).toContain('AAPL')
    expect(state.watchlist).toContain('BBCA.JK')
  })

  it('adds ticker to watchlist without duplicating', () => {
    useUIStore.getState().addToWatchlist('AMZN')
    expect(useUIStore.getState().watchlist).toContain('AMZN')
    expect(useUIStore.getState().watchlist).toHaveLength(9)

    // Attempt duplicate add
    useUIStore.getState().addToWatchlist('AMZN')
    expect(useUIStore.getState().watchlist).toHaveLength(9)
  })

  it('removes ticker from watchlist', () => {
    useUIStore.getState().removeFromWatchlist('AAPL')
    expect(useUIStore.getState().watchlist).not.toContain('AAPL')
    expect(useUIStore.getState().watchlist).toHaveLength(7)
  })

  it('checks isInWatchlist accurately', () => {
    expect(useUIStore.getState().isInWatchlist('MSFT')).toBe(true)
    expect(useUIStore.getState().isInWatchlist('NON_EXISTENT')).toBe(false)
  })

  it('updates sidebar open state', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(false)
    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().sidebarOpen).toBe(true)
  })

  it('resets watchlist to default stocks with resetToDefaultWatchlist', () => {
    useUIStore.getState().resetToDefaultWatchlist()
    const state = useUIStore.getState()
    expect(state.watchlist).toHaveLength(32)
    expect(state.watchlist).toContain('NVDA')
    expect(state.watchlist).toContain('BMRI.JK')
  })
})
