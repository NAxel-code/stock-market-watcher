import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { IdxLotCalculator } from './IdxLotCalculator'

describe('IdxLotCalculator component', () => {
  it('renders lot calculation with default 1 lot (100 shares)', () => {
    render(<IdxLotCalculator currentPrice={6000} ticker="BBCA.JK" />)
    expect(screen.getByText(/Kalkulator Lot Saham IDX/)).toBeInTheDocument()
    expect(screen.getByText(/\(100 lembar\)/)).toBeInTheDocument()
  })

  it('updates total calculation when clicking quick lot buttons', () => {
    render(<IdxLotCalculator currentPrice={6000} ticker="BBCA.JK" />)
    const quickBtn = screen.getByRole('button', { name: /10 lot/i })
    fireEvent.click(quickBtn)
    expect(screen.getByText(/\(1,000 lembar\)/)).toBeInTheDocument()
  })
})
