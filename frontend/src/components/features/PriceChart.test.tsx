import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PriceChart } from './PriceChart'

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      setData: vi.fn(),
      priceScale: vi.fn(() => ({
        applyOptions: vi.fn(),
      })),
    })),
    applyOptions: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    remove: vi.fn(),
  })),
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
  CandlestickSeries: {},
  BarSeries: {},
  AreaSeries: {},
  LineSeries: {},
  HistogramSeries: {},
}))

// Mock useStockHistory hook
vi.mock('@/hooks/useStockHistory', () => ({
  useStockHistory: vi.fn(() => ({
    data: {
      ticker: 'AAPL',
      period: '1m',
      data: [
        { timestamp: '2026-10-01T00:00:00Z', open: 220, high: 225, low: 219, close: 224, volume: 50000000 },
        { timestamp: '2026-10-02T00:00:00Z', open: 224, high: 228, low: 223, close: 227, volume: 45000000 },
        { timestamp: '2026-10-03T00:00:00Z', open: 227, high: 229, low: 221, close: 222, volume: 55000000 },
        { timestamp: '2026-10-04T00:00:00Z', open: 222, high: 226, low: 220, close: 225, volume: 48000000 },
      ],
    },
    isLoading: false,
    error: null,
  })),
}))

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

describe('PriceChart component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders timeframe selector and chart type buttons', () => {
    render(<PriceChart ticker="AAPL" currency="USD" previousClose={220} />)

    // Timeframe buttons
    expect(screen.getByRole('button', { name: /1D/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1W/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1M/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3M/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1Y/i })).toBeInTheDocument()

    // Chart types
    expect(screen.getByRole('button', { name: /Candle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bar \(OHLC\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Area/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /VaR Risk/i })).toBeInTheDocument()
  })

  it('allows switching between Candle, Bar, and Area chart views', () => {
    render(<PriceChart ticker="AAPL" currency="USD" />)

    const barBtn = screen.getByRole('button', { name: /Bar \(OHLC\)/i })
    fireEvent.click(barBtn)
    expect(barBtn).toHaveClass('bg-zinc-800')

    const areaBtn = screen.getByRole('button', { name: /Area/i })
    fireEvent.click(areaBtn)
    expect(areaBtn).toHaveClass('bg-zinc-800')
  })

  it('switches to VaR Risk view and displays Value at Risk metrics', () => {
    render(<PriceChart ticker="AAPL" currency="USD" />)

    const varBtn = screen.getByRole('button', { name: /VaR Risk/i })
    fireEvent.click(varBtn)

    // Check VaR analytics cards
    expect(screen.getByText(/1-Day 95% VaR/i)).toBeInTheDocument()
    expect(screen.getByText(/1-Day 99% VaR/i)).toBeInTheDocument()
    expect(screen.getByText(/CVaR \(Expected Shortfall\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Annualized Volatility/i)).toBeInTheDocument()
  })

  it('toggles technical indicator overlays (SMA 20, SMA 50, Vol)', () => {
    render(<PriceChart ticker="AAPL" currency="USD" />)

    const sma20Btn = screen.getByRole('button', { name: /SMA 20/i })
    fireEvent.click(sma20Btn)
    expect(sma20Btn).toHaveClass('bg-blue-900/60')

    const sma50Btn = screen.getByRole('button', { name: /SMA 50/i })
    fireEvent.click(sma50Btn)
    expect(sma50Btn).toHaveClass('bg-amber-900/60')

    const volBtn = screen.getByRole('button', { name: /Vol/i })
    fireEvent.click(volBtn) // Toggle off
    expect(volBtn).not.toHaveClass('bg-zinc-800')
  })
})
