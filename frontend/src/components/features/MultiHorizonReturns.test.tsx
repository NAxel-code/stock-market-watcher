import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MultiHorizonReturns } from './MultiHorizonReturns'
import type { HistoryPoint } from '@/types/stock'

describe('MultiHorizonReturns component', () => {
  it('renders all 4 horizons with 24h change and dashes when history is empty', () => {
    render(<MultiHorizonReturns currentPrice={150} dayChangePercent={2.5} />)

    expect(screen.getByText(/24 Jam/i)).toBeInTheDocument()
    expect(screen.getByText('+2.50%')).toBeInTheDocument()
    expect(screen.getByText(/7 Hari/i)).toBeInTheDocument()
    expect(screen.getByText(/30 Hari/i)).toBeInTheDocument()
    expect(screen.getByText(/1 Tahun/i)).toBeInTheDocument()

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3)
  })

  it('calculates returns for 7D, 30D, and 1Y when history data is available', () => {
    // Generate 60 history points
    const history: HistoryPoint[] = Array.from({ length: 60 }).map((_, i) => ({
      timestamp: `2026-01-${String(i + 1).padStart(2, '0')}`,
      open: 100,
      high: 110,
      low: 90,
      close: 100, // baseline
      volume: 1000,
    }))

    // Index 0 (1y ago): close = 50 -> from 50 to 100 = +100.00%
    history[0].close = 50

    // Index (60 - 21 = 39) (30d ago): close = 80 -> from 80 to 100 = +25.00%
    history[39].close = 80

    // Index (60 - 5 = 55) (7d ago): close = 90 -> from 90 to 100 = +11.11%
    history[55].close = 90

    render(
      <MultiHorizonReturns
        currentPrice={100}
        dayChangePercent={1.5}
        history1y={history}
      />
    )

    expect(screen.getByText('+1.50%')).toBeInTheDocument()
    expect(screen.getByText('+11.11%')).toBeInTheDocument()
    expect(screen.getByText('+25.00%')).toBeInTheDocument()
    expect(screen.getByText('+100.00%')).toBeInTheDocument()
  })
})
