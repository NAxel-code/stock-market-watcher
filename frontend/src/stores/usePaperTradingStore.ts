import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isIdxTicker } from '@/lib/formatters'
import { fetchPersistedPaperState, resetPersistedPaperState, savePersistedPaperState } from '@/lib/api'

export interface PaperPosition {
  id: string
  ticker: string
  companyName?: string
  side: 'BUY' | 'SELL'
  shares: number
  lots?: number
  entryPrice: number
  currentPrice: number
  takeProfit?: number
  stopLoss?: number
  currency: 'IDR' | 'USD'
  feePaid: number
  openedAt: string
}

export interface PaperTradeHistory {
  id: string
  ticker: string
  side: 'BUY' | 'SELL'
  shares: number
  lots?: number
  entryPrice: number
  exitPrice: number
  currency: 'IDR' | 'USD'
  realizedPnl: number
  realizedPnlPercent: number
  feePaid: number
  openedAt: string
  closedAt: string
}

interface PaperTradingState {
  cashBalanceIDR: number
  cashBalanceUSD: number
  positions: PaperPosition[]
  history: PaperTradeHistory[]

  // Actions
  openPosition: (params: {
    ticker: string
    companyName?: string
    side: 'BUY' | 'SELL'
    shares: number
    lots?: number
    entryPrice: number
    currentPrice: number
    takeProfit?: number
    stopLoss?: number
    currency?: 'IDR' | 'USD'
  }) => { success: boolean; message: string; positionId?: string }

  closePosition: (positionId: string, exitPrice?: number) => { success: boolean; message: string; pnl?: number }

  updatePositionBrackets: (positionId: string, takeProfit?: number, stopLoss?: number) => void

  updateCurrentPrice: (ticker: string, currentPrice: number) => void

  resetAccount: () => void

  getPositionForTicker: (ticker: string) => PaperPosition | undefined

  syncWithCloud: () => Promise<void>
}

const INITIAL_CASH_IDR = 100_000_000 // Rp 100 Juta
const INITIAL_CASH_USD = 10_000 // $10,000

function _pushPaperToCloud(state: Pick<PaperTradingState, 'cashBalanceUSD' | 'positions' | 'history'>) {
  if (typeof window === 'undefined') return
  void savePersistedPaperState({
    cash_balance_usd: state.cashBalanceUSD,
    initial_capital_usd: INITIAL_CASH_USD,
    positions: state.positions.map((p) => ({
      id: p.id,
      ticker: p.ticker,
      side: p.side === 'BUY' ? 'LONG' : 'SHORT',
      shares: p.shares,
      entry_price: p.entryPrice,
      current_price: p.currentPrice,
      currency: p.currency,
      take_profit: p.takeProfit ?? null,
      stop_loss: p.stopLoss ?? null,
      opened_at: p.openedAt,
    })),
    trades: state.history.map((h) => ({
      id: h.id,
      ticker: h.ticker,
      side: h.side,
      shares: h.shares,
      price: h.exitPrice,
      currency: h.currency,
      fee: h.feePaid,
      realized_pnl: h.realizedPnl,
      executed_at: h.closedAt,
    })),
  }).catch(() => {})
}

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      cashBalanceIDR: INITIAL_CASH_IDR,
      cashBalanceUSD: INITIAL_CASH_USD,
      positions: [],
      history: [],

      openPosition: (params) => {
        const symbol = params.ticker.toUpperCase()
        const currency = params.currency || (isIdxTicker(symbol) ? 'IDR' : 'USD')
        const isIDR = currency === 'IDR'
        const currentBalance = isIDR ? get().cashBalanceIDR : get().cashBalanceUSD

        // If user is placing a SELL order and already has an open LONG position
        if (params.side === 'SELL') {
          const existingLong = get().positions.find(
            (p) => p.ticker.toUpperCase() === symbol && p.side === 'BUY'
          )

          if (existingLong) {
            // Full position exit
            if (params.shares >= existingLong.shares) {
              return get().closePosition(existingLong.id, params.entryPrice)
            }

            // Partial position trim / partial sell
            const soldShares = params.shares
            const grossExitValue = params.entryPrice * soldShares
            const exitFee = Math.round(grossExitValue * 0.0025)
            const netExitProceeds = grossExitValue - exitFee

            const grossEntryValue = existingLong.entryPrice * soldShares
            const proRataEntryFee = Math.round(existingLong.feePaid * (soldShares / existingLong.shares))
            const totalFees = proRataEntryFee + exitFee

            const realizedPnl = (grossExitValue - grossEntryValue) - totalFees
            const realizedPnlPercent = grossEntryValue > 0 ? (realizedPnl / grossEntryValue) * 100 : 0

            const remainingShares = existingLong.shares - soldShares
            const remainingLots = existingLong.lots
              ? Math.max(1, existingLong.lots - (params.lots || Math.round(soldShares / 100)))
              : undefined

            const historyRecord: PaperTradeHistory = {
              id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              ticker: symbol,
              side: 'BUY',
              shares: soldShares,
              lots: params.lots,
              entryPrice: existingLong.entryPrice,
              exitPrice: params.entryPrice,
              currency: existingLong.currency,
              realizedPnl,
              realizedPnlPercent,
              feePaid: totalFees,
              openedAt: existingLong.openedAt,
              closedAt: new Date().toISOString(),
            }

            if (isIDR) {
              set((s) => ({
                cashBalanceIDR: s.cashBalanceIDR + netExitProceeds,
                positions: s.positions.map((p) =>
                  p.id === existingLong.id
                    ? {
                        ...p,
                        shares: remainingShares,
                        lots: remainingLots,
                        feePaid: p.feePaid - proRataEntryFee,
                      }
                    : p
                ),
                history: [historyRecord, ...s.history],
              }))
            } else {
              set((s) => ({
                cashBalanceUSD: s.cashBalanceUSD + netExitProceeds,
                positions: s.positions.map((p) =>
                  p.id === existingLong.id
                    ? {
                        ...p,
                        shares: remainingShares,
                        lots: remainingLots,
                        feePaid: p.feePaid - proRataEntryFee,
                      }
                    : p
                ),
                history: [historyRecord, ...s.history],
              }))
            }

            return {
              success: true,
              message: `Partially sold ${soldShares.toLocaleString()} shares of ${symbol}. Realized P&L: ${realizedPnl >= 0 ? '+' : ''}${isIDR ? `Rp ${realizedPnl.toLocaleString('id-ID')}` : `$${realizedPnl.toFixed(2)}`}`,
            }
          }
        }

        // Opening a new position (BUY or short SELL)
        const grossValue = params.entryPrice * params.shares
        const feeRate = params.side === 'BUY' ? 0.0015 : 0.0025
        const fee = Math.round(grossValue * feeRate)
        const totalCapitalRequired = grossValue + fee

        if (currentBalance < totalCapitalRequired) {
          return {
            success: false,
            message: `Insufficient virtual cash. Required: ${currency === 'IDR' ? `Rp ${totalCapitalRequired.toLocaleString('id-ID')}` : `$${totalCapitalRequired.toFixed(2)}`}, Available: ${currency === 'IDR' ? `Rp ${currentBalance.toLocaleString('id-ID')}` : `$${currentBalance.toFixed(2)}`}`,
          }
        }

        const newPosition: PaperPosition = {
          id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ticker: symbol,
          companyName: params.companyName,
          side: params.side,
          shares: params.shares,
          lots: params.lots,
          entryPrice: params.entryPrice,
          currentPrice: params.currentPrice || params.entryPrice,
          takeProfit: params.takeProfit,
          stopLoss: params.stopLoss,
          currency,
          feePaid: fee,
          openedAt: new Date().toISOString(),
        }

        if (isIDR) {
          set((state) => ({
            cashBalanceIDR: state.cashBalanceIDR - totalCapitalRequired,
            positions: [newPosition, ...state.positions],
          }))
        } else {
          set((state) => ({
            cashBalanceUSD: state.cashBalanceUSD - totalCapitalRequired,
            positions: [newPosition, ...state.positions],
          }))
        }

        _pushPaperToCloud(get())

        return {
          success: true,
          message: `Simulated ${params.side} order executed for ${symbol}`,
          positionId: newPosition.id,
        }
      },

      closePosition: (positionId, exitPriceOverride) => {
        const state = get()
        const position = state.positions.find((p) => p.id === positionId)

        if (!position) {
          return { success: false, message: 'Position not found' }
        }

        const exitPrice = exitPriceOverride !== undefined ? exitPriceOverride : position.currentPrice
        const isIDR = position.currency === 'IDR'

        const grossExitValue = exitPrice * position.shares
        // Exit fee: 0.25% for selling long position, 0.15% for buying to cover short
        const exitFeeRate = position.side === 'BUY' ? 0.0025 : 0.0015
        const exitFee = Math.round(grossExitValue * exitFeeRate)
        const netExitProceeds = grossExitValue - exitFee

        // Gross entry value and total transaction fees
        const grossEntryValue = position.entryPrice * position.shares
        const totalFees = position.feePaid + exitFee

        // Realized PnL:
        // Long (BUY): (Exit - Entry) - Total Fees
        // Short (SELL): (Entry - Exit) - Total Fees
        const realizedPnl = position.side === 'BUY'
          ? (grossExitValue - grossEntryValue) - totalFees
          : (grossEntryValue - grossExitValue) - totalFees

        const realizedPnlPercent = grossEntryValue > 0 ? (realizedPnl / grossEntryValue) * 100 : 0

        // Cash credited back to account:
        // Long: net exit proceeds
        // Short: returned collateral (grossEntryValue + position.feePaid) + realizedPnl
        const cashCredit = position.side === 'BUY'
          ? netExitProceeds
          : (grossEntryValue + position.feePaid) + realizedPnl

        const historyRecord: PaperTradeHistory = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ticker: position.ticker,
          side: position.side,
          shares: position.shares,
          lots: position.lots,
          entryPrice: position.entryPrice,
          exitPrice,
          currency: position.currency,
          realizedPnl,
          realizedPnlPercent,
          feePaid: totalFees,
          openedAt: position.openedAt,
          closedAt: new Date().toISOString(),
        }

        if (isIDR) {
          set((s) => ({
            cashBalanceIDR: Math.max(0, s.cashBalanceIDR + cashCredit),
            positions: s.positions.filter((p) => p.id !== positionId),
            history: [historyRecord, ...s.history],
          }))
        } else {
          set((s) => ({
            cashBalanceUSD: Math.max(0, s.cashBalanceUSD + cashCredit),
            positions: s.positions.filter((p) => p.id !== positionId),
            history: [historyRecord, ...s.history],
          }))
        }

        _pushPaperToCloud(get())

        return {
          success: true,
          message: `Position closed at ${isIDR ? `Rp ${exitPrice.toLocaleString('id-ID')}` : `$${exitPrice.toFixed(2)}`}. Realized P&L: ${realizedPnl >= 0 ? '+' : ''}${isIDR ? `Rp ${realizedPnl.toLocaleString('id-ID')}` : `$${realizedPnl.toFixed(2)}`}`,
          pnl: realizedPnl,
        }
      },

      updatePositionBrackets: (positionId, takeProfit, stopLoss) => {
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === positionId ? { ...p, takeProfit, stopLoss } : p
          ),
        }))
        _pushPaperToCloud(get())
      },

      updateCurrentPrice: (ticker, currentPrice) => {
        if (!currentPrice || currentPrice <= 0) return
        set((state) => ({
          positions: state.positions.map((p) =>
            p.ticker.toUpperCase() === ticker.toUpperCase()
              ? { ...p, currentPrice }
              : p
          ),
        }))
      },

      resetAccount: () => {
        set({
          cashBalanceIDR: INITIAL_CASH_IDR,
          cashBalanceUSD: INITIAL_CASH_USD,
          positions: [],
          history: [],
        })
        if (typeof window !== 'undefined') {
          void resetPersistedPaperState().catch(() => {})
        }
      },

      getPositionForTicker: (ticker) => {
        const symbol = ticker.toUpperCase()
        return get().positions.find((p) => p.ticker.toUpperCase() === symbol)
      },

      syncWithCloud: async () => {
        try {
          const remote = await fetchPersistedPaperState()
          if (remote && (remote.positions.length > 0 || remote.trades.length > 0)) {
            set({
              cashBalanceUSD: remote.cash_balance_usd,
              positions: remote.positions.map((p) => ({
                id: p.id,
                ticker: p.ticker,
                side: p.side === 'LONG' ? 'BUY' : 'SELL',
                shares: p.shares,
                entryPrice: p.entry_price,
                currentPrice: p.current_price,
                currency: p.currency === 'IDR' ? 'IDR' : 'USD',
                takeProfit: p.take_profit ?? undefined,
                stopLoss: p.stop_loss ?? undefined,
                feePaid: 0,
                openedAt: p.opened_at,
              })),
            })
          }
        } catch {
          // Offline fallback
        }
      },
    }),
    {
      name: 'stockpulse_paper_trading_v1',
    }
  )
)
