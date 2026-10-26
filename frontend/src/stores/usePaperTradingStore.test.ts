import { describe, it, expect, beforeEach } from 'vitest'
import { usePaperTradingStore } from './usePaperTradingStore'

describe('usePaperTradingStore', () => {
  beforeEach(() => {
    usePaperTradingStore.getState().resetAccount()
  })

  it('initializes with default starting balances', () => {
    const state = usePaperTradingStore.getState()
    expect(state.cashBalanceIDR).toBe(100_000_000)
    expect(state.cashBalanceUSD).toBe(10_000)
    expect(state.positions).toEqual([])
    expect(state.history).toEqual([])
  })

  it('opens a simulated BUY position for IDR stock deducting capital and fee', () => {
    const store = usePaperTradingStore.getState()
    const res = store.openPosition({
      ticker: 'BBCA.JK',
      side: 'BUY',
      shares: 1000,
      lots: 10,
      entryPrice: 5000,
      currentPrice: 5000,
      takeProfit: 5500,
      stopLoss: 4700,
      currency: 'IDR',
    })

    expect(res.success).toBe(true)
    const updated = usePaperTradingStore.getState()
    expect(updated.positions.length).toBe(1)
    expect(updated.positions[0].ticker).toBe('BBCA.JK')
    expect(updated.positions[0].lots).toBe(10)
    expect(updated.positions[0].takeProfit).toBe(5500)

    // Gross: 5,000,000, Fee (0.15%): 7,500 => Total: 5,007,500
    expect(updated.cashBalanceIDR).toBe(100_000_000 - 5_007_500)
  })

  it('rejects order if virtual cash is insufficient', () => {
    const store = usePaperTradingStore.getState()
    const res = store.openPosition({
      ticker: 'BBCA.JK',
      side: 'BUY',
      shares: 100_000_000,
      entryPrice: 5000,
      currentPrice: 5000,
      currency: 'IDR',
    })

    expect(res.success).toBe(false)
    expect(res.message).toContain('Insufficient virtual cash')
    expect(usePaperTradingStore.getState().positions.length).toBe(0)
  })

  it('closes a position realizing profit and crediting cash back', () => {
    const store = usePaperTradingStore.getState()
    const openRes = store.openPosition({
      ticker: 'AAPL',
      side: 'BUY',
      shares: 10,
      entryPrice: 200,
      currentPrice: 200,
      currency: 'USD',
    })

    const posId = openRes.positionId!
    // Exit at $220 (+10% gain)
    const closeRes = usePaperTradingStore.getState().closePosition(posId, 220)

    expect(closeRes.success).toBe(true)
    const updated = usePaperTradingStore.getState()
    expect(updated.positions.length).toBe(0)
    expect(updated.history.length).toBe(1)
    expect(updated.history[0].ticker).toBe('AAPL')
    expect(updated.history[0].exitPrice).toBe(220)
    expect(updated.history[0].realizedPnl).toBeGreaterThan(0)
    // Cash balance should now be greater than the initial $10,000 due to profit
    expect(updated.cashBalanceUSD).toBeGreaterThan(10_000)
  })

  it('updates position brackets (TP and SL)', () => {
    const store = usePaperTradingStore.getState()
    const openRes = store.openPosition({
      ticker: 'TLKM.JK',
      side: 'BUY',
      shares: 100,
      entryPrice: 3000,
      currentPrice: 3000,
      currency: 'IDR',
    })

    const posId = openRes.positionId!
    usePaperTradingStore.getState().updatePositionBrackets(posId, 3300, 2900)

    const pos = usePaperTradingStore.getState().positions[0]
    expect(pos.takeProfit).toBe(3300)
    expect(pos.stopLoss).toBe(2900)
  })
})
