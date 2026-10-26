import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isIdxTicker } from '@/lib/formatters'

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
}

const INITIAL_CASH_IDR = 100_000_000 // Rp 100 Juta
const INITIAL_CASH_USD = 10_000 // $10,000

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      cashBalanceIDR: INITIAL_CASH_IDR,
      cashBalanceUSD: INITIAL_CASH_USD,
      positions: [],
      history: [],

      openPosition: (params) => {
        const currency = params.currency || (isIdxTicker(params.ticker) ? 'IDR' : 'USD')
        const grossValue = params.entryPrice * params.shares
        // Standard fee: 0.15% for BUY, 0.25% for SELL
        const feeRate = params.side === 'BUY' ? 0.0015 : 0.0025
        const fee = Math.round(grossValue * feeRate)
        const totalCapitalRequired = grossValue + fee

        const isIDR = currency === 'IDR'
        const currentBalance = isIDR ? get().cashBalanceIDR : get().cashBalanceUSD

        if (params.side === 'BUY' && currentBalance < totalCapitalRequired) {
          return {
            success: false,
            message: `Insufficient virtual cash. Required: ${currency === 'IDR' ? `Rp ${totalCapitalRequired.toLocaleString('id-ID')}` : `$${totalCapitalRequired.toFixed(2)}`}, Available: ${currency === 'IDR' ? `Rp ${currentBalance.toLocaleString('id-ID')}` : `$${currentBalance.toFixed(2)}`}`,
          }
        }

        const newPosition: PaperPosition = {
          id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ticker: params.ticker.toUpperCase(),
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

        return {
          success: true,
          message: `Simulated ${params.side} order executed for ${params.ticker}`,
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
        // Exit broker fee (0.25% for sell exit)
        const exitFee = Math.round(grossExitValue * 0.0025)
        const netExitProceeds = grossExitValue - exitFee

        // Gross entry value
        const grossEntryValue = position.entryPrice * position.shares
        const totalFees = position.feePaid + exitFee

        // Realized PnL = Net Proceeds - (Gross Entry + Entry Fee)
        const realizedPnl = position.side === 'BUY'
          ? (grossExitValue - grossEntryValue) - totalFees
          : (grossEntryValue - grossExitValue) - totalFees

        const realizedPnlPercent = grossEntryValue > 0 ? (realizedPnl / grossEntryValue) * 100 : 0

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
            cashBalanceIDR: s.cashBalanceIDR + netExitProceeds,
            positions: s.positions.filter((p) => p.id !== positionId),
            history: [historyRecord, ...s.history],
          }))
        } else {
          set((s) => ({
            cashBalanceUSD: s.cashBalanceUSD + netExitProceeds,
            positions: s.positions.filter((p) => p.id !== positionId),
            history: [historyRecord, ...s.history],
          }))
        }

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
      },

      getPositionForTicker: (ticker) => {
        const symbol = ticker.toUpperCase()
        return get().positions.find((p) => p.ticker.toUpperCase() === symbol)
      },
    }),
    {
      name: 'stockpulse_paper_trading_v1',
    }
  )
)
