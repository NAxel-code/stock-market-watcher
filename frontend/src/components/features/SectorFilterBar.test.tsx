import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SectorFilterBar } from './SectorFilterBar'
import type { StockQuote } from '@/types/stock'

const mockQuotes: StockQuote[] = [
  {
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: 150.0,
    previous_close: 147.0,
    change: 3.0,
    change_percent: 2.04,
    sector: 'Technology',
    currency: 'USD',
    is_stale: false,
  },
  {
    ticker: 'NVDA',
    company_name: 'NVIDIA Corporation',
    current_price: 120.0,
    previous_close: 115.0,
    change: 5.0,
    change_percent: 4.35,
    sector: 'Technology',
    currency: 'USD',
    is_stale: false,
  },
  {
    ticker: 'BBCA.JK',
    company_name: 'Bank Central Asia',
    current_price: 10000.0,
    previous_close: 10100.0,
    change: -100.0,
    change_percent: -0.99,
    sector: 'Financial Services',
    currency: 'IDR',
    is_stale: false,
    is_idx: true,
  },
]

describe('SectorFilterBar component', () => {
  it('renders all default tabs with proper stock counts', () => {
    render(
      <SectorFilterBar
        activeFilter="ALL"
        onSelectFilter={() => {}}
        quotes={mockQuotes}
      />
    )

    expect(screen.getByText('Semua')).toBeInTheDocument()
    expect(screen.getByText('IDX (BEI)')).toBeInTheDocument()
    expect(screen.getByText('US Market')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Financial Services')).toBeInTheDocument()
  })

  it('triggers onSelectFilter with the clicked tab id', () => {
    const handleSelect = vi.fn()
    render(
      <SectorFilterBar
        activeFilter="ALL"
        onSelectFilter={handleSelect}
        quotes={mockQuotes}
      />
    )

    const techTab = screen.getByTestId('filter-tab-SEC:Technology')
    fireEvent.click(techTab)
    expect(handleSelect).toHaveBeenCalledWith('SEC:Technology')

    const idxTab = screen.getByTestId('filter-tab-IDX')
    fireEvent.click(idxTab)
    expect(handleSelect).toHaveBeenCalledWith('IDX')
  })

  it('computes and displays average return per segment correctly', () => {
    render(
      <SectorFilterBar
        activeFilter="ALL"
        onSelectFilter={() => {}}
        quotes={mockQuotes}
      />
    )

    // Technology has AAPL (+2.04%) and NVDA (+4.35%) -> avg = (2.04 + 4.35) / 2 = +3.19%
    const positiveBadges = screen.getAllByText('+3.19%')
    expect(positiveBadges.length).toBeGreaterThanOrEqual(1)

    // IDX has BBCA (-0.99%) -> avg = -0.99%
    const negativeBadges = screen.getAllByText('-0.99%')
    expect(negativeBadges.length).toBeGreaterThanOrEqual(1)
  })
})
