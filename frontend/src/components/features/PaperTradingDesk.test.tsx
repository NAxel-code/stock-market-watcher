import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaperTradingDesk } from './PaperTradingDesk'
import { usePaperTradingStore } from '@/stores/usePaperTradingStore'

// Mock useStockDesk hook
vi.mock('@/hooks/useStockDesk', () => ({
  useStockDesk: () => ({
    data: {
      trade_plan: {
        entry: 5000,
        target_1: 5500,
        target_2: 6000,
        stop_loss: 4700,
        risk_reward: 2.5,
      },
    },
    isLoading: false,
    isError: false,
  }),
}))

describe('PaperTradingDesk component', () => {
  beforeEach(() => {
    usePaperTradingStore.getState().resetAccount()
    vi.clearAllMocks()
  })

  it('renders virtual cash balance and execution ticket', () => {
    render(
      <PaperTradingDesk
        ticker="BBCA.JK"
        currentPrice={5000}
        companyName="Bank Central Asia"
        currency="IDR"
      />
    )

    expect(screen.getByText('Virtual Cash')).toBeInTheDocument()
    expect(
      screen.getAllByText((content) => content.includes('100.000.000')).length
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Execution Ticket: BBCA\.JK/)).toBeInTheDocument()
  })

  it('switches between BUY and SELL order side', () => {
    render(
      <PaperTradingDesk
        ticker="BBCA.JK"
        currentPrice={5000}
        companyName="Bank Central Asia"
        currency="IDR"
      />
    )

    const sellButton = screen.getByRole('button', { name: /SELL/i })
    fireEvent.click(sellButton)
    expect(screen.getByText(/Execute Simulated SELL/i)).toBeInTheDocument()

    const buyButton = screen.getByRole('button', { name: /BUY/i })
    fireEvent.click(buyButton)
    expect(screen.getByText(/Execute Simulated BUY/i)).toBeInTheDocument()
  })

  it('imports desk targets when clicking Import Desk Targets button', () => {
    render(
      <PaperTradingDesk
        ticker="BBCA.JK"
        currentPrice={5000}
        companyName="Bank Central Asia"
        currency="IDR"
      />
    )

    const importBtn = screen.getByRole('button', { name: /Import Desk Targets/i })
    fireEvent.click(importBtn)

    // TP input should now contain 5500
    const tpInput = screen.getByLabelText(/Take Profit Target/i) as HTMLInputElement
    expect(tpInput.value).toBe('5500')

    const slInput = screen.getByLabelText(/Stop Loss Target/i) as HTMLInputElement
    expect(slInput.value).toBe('4700')
  })

  it('executes simulated order and adds position to portfolio', () => {
    render(
      <PaperTradingDesk
        ticker="BBCA.JK"
        currentPrice={5000}
        companyName="Bank Central Asia"
        currency="IDR"
      />
    )

    const submitBtn = screen.getByRole('button', { name: /Execute Simulated BUY/i })
    fireEvent.click(submitBtn)

    // Position should be present in store
    const positions = usePaperTradingStore.getState().positions
    expect(positions.length).toBe(1)
    expect(positions[0].ticker).toBe('BBCA.JK')
    expect(positions[0].entryPrice).toBe(5000)
  })
})
