import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { IdxLotCalculator } from './IdxLotCalculator'

describe('IdxLotCalculator component', () => {
  it('renders lot calculation with default 1 lot (100 shares)', () => {
    render(<IdxLotCalculator currentPrice={6000} ticker="BBCA.JK" />)
    expect(screen.getByText(/IDX Lot Calculator/)).toBeInTheDocument()
    expect(screen.getByText(/\(100 shares\)/)).toBeInTheDocument()
  })

  it('updates total calculation when clicking quick lot buttons', () => {
    render(<IdxLotCalculator currentPrice={6000} ticker="BBCA.JK" />)
    const quickBtn = screen.getByRole('button', { name: /10 lot/i })
    fireEvent.click(quickBtn)
    expect(screen.getByText(/\(1,000 shares\)/)).toBeInTheDocument()
  })

  it('toggles Almgren-Chriss execution and market impact simulator', () => {
    render(<IdxLotCalculator currentPrice={6000} ticker="BBCA.JK" volume={50_000_000} />)

    const toggleBtn = screen.getByRole('button', { name: /Institutional Execution & Slippage Simulator/i })
    expect(toggleBtn).toBeInTheDocument()

    // Click to open simulator
    fireEvent.click(toggleBtn)

    expect(screen.getByText(/Almgren-Chriss \(2000\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Optimal Liquidity/i)).toBeInTheDocument()
    expect(screen.getByText(/Execution Urgency:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Balanced \(Optimal\)/i })).toBeInTheDocument()

    // Switch urgency to aggressive
    const aggressiveBtn = screen.getByRole('button', { name: /Aggressive \(Swift\)/i })
    fireEvent.click(aggressiveBtn)
    expect(aggressiveBtn).toHaveClass('bg-blue-600')
  })
})
