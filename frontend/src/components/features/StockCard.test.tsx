import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StockCard } from './StockCard'
import type { StockQuote } from '@/types/stock'

const mockPositiveQuote: StockQuote = {
  ticker: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 150.25,
  previous_close: 147.75,
  change: 2.5,
  change_percent: 1.69,
  currency: 'USD',
  is_stale: false,
}

const mockNegativeQuote: StockQuote = {
  ticker: 'TSLA',
  company_name: 'Tesla Inc.',
  current_price: 200.0,
  previous_close: 205.0,
  change: -5.0,
  change_percent: -2.44,
  currency: 'USD',
  is_stale: false,
}

describe('StockCard component', () => {
  it('renders correctly with given quote data', () => {
    render(<StockCard quote={mockPositiveQuote} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument()
    expect(screen.getByText('$150.25')).toBeInTheDocument()
    expect(screen.getByText('+1.69%')).toBeInTheDocument()
  })

  it('renders positive change with green styling', () => {
    render(<StockCard quote={mockPositiveQuote} />)
    const changeEl = screen.getByText('+1.69%')
    expect(changeEl).toHaveClass('text-green-400')
  })

  it('renders negative change with red styling', () => {
    render(<StockCard quote={mockNegativeQuote} />)
    const changeEl = screen.getByText('-2.44%')
    expect(changeEl).toHaveClass('text-red-400')
  })

  it('renders skeleton loader when isLoading is true', () => {
    render(<StockCard isLoading={true} />)
    expect(screen.getByTestId('stock-card-skeleton')).toBeInTheDocument()
  })

  it('renders error message when error prop is provided', () => {
    render(<StockCard error="Failed to fetch stock" />)
    expect(screen.getByText('Failed to fetch stock')).toBeInTheDocument()
  })

  it('renders fallback when quote is missing and not loading', () => {
    render(<StockCard quote={undefined} />)
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('triggers onRemove callback when remove button is clicked', () => {
    const handleRemove = vi.fn()
    render(
      <StockCard
        quote={mockPositiveQuote}
        showRemove={true}
        onRemove={handleRemove}
      />
    )

    const removeBtn = screen.getByRole('button', { name: /remove aapl from watchlist/i })
    expect(removeBtn).toBeInTheDocument()
    fireEvent.click(removeBtn)
    expect(handleRemove).toHaveBeenCalledTimes(1)
    expect(handleRemove).toHaveBeenCalledWith('AAPL')
  })

  it('shows delayed badge when quote is stale', () => {
    const staleQuote = { ...mockPositiveQuote, is_stale: true }
    render(<StockCard quote={staleQuote} />)
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('renders CoinGecko features: sector badge, peak distance, and sparkline', () => {
    const coingeckoQuote: StockQuote = {
      ...mockPositiveQuote,
      sector: 'Technology',
      distance_from_52w_high: -12.5,
      sparkline_7d: [140, 142, 145, 148, 150.25],
    }
    render(<StockCard quote={coingeckoQuote} />)
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Puncak: -12.5%')).toBeInTheDocument()
    expect(screen.getByTestId('sparkline-chart')).toBeInTheDocument()
  })
})
