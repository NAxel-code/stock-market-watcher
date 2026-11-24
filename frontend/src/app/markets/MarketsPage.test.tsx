import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MarketsPage from './page'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

import { useQuery } from '@tanstack/react-query'

const mockOverviewData = {
  as_of: '2026-11-24T12:00:00Z',
  indices: [
    {
      ticker: '^GSPC',
      name: 'S&P 500',
      category: 'INDEX',
      current_price: 5985.25,
      change: 22.4,
      change_percent: 0.38,
      unit: 'pts',
      as_of: '2026-11-24T12:00:00Z',
      source: 'Cboe / S&P Dow Jones',
      is_stale: false,
    },
    {
      ticker: '^STI',
      name: 'Straits Times Index (SGX)',
      category: 'INDEX',
      current_price: 3745.2,
      change: 14.6,
      change_percent: 0.39,
      unit: 'pts',
      as_of: '2026-11-24T12:00:00Z',
      source: 'SGX / FTSE',
      is_stale: false,
    },
  ],
  etfs: [
    {
      ticker: 'CSPX.L',
      name: 'iShares Core S&P 500 (UCITS)',
      category: 'ETF',
      current_price: 612.3,
      change: 2.4,
      change_percent: 0.39,
      unit: '$',
      as_of: '2026-11-24T12:00:00Z',
      source: 'London Stock Exchange',
      is_stale: false,
    },
  ],
  fx_rates: [
    {
      ticker: 'USDSGD=X',
      name: 'USD / SGD',
      category: 'FX',
      current_price: 1.3465,
      change: -0.0012,
      change_percent: -0.09,
      unit: 'SGD',
      as_of: '2026-11-24T12:00:00Z',
      source: 'MAS / Interbank',
      is_stale: false,
    },
  ],
  sovereign_rates: [
    {
      tenor: '10Y',
      yield_rate: 4.41,
      change_bps: 1.1,
      country: 'US',
      source: 'US Treasury / FRED',
    },
    {
      tenor: '10Y SGS',
      yield_rate: 2.89,
      change_bps: 0.5,
      country: 'SG',
      source: 'MAS Statistics',
    },
  ],
  commodities: [
    {
      ticker: 'COAL-NCF',
      name: 'Newcastle Thermal Coal',
      category: 'COMMODITY',
      current_price: 142.5,
      change: -1.2,
      change_percent: -0.83,
      unit: '$/MT',
      as_of: '2026-11-24T12:00:00Z',
      source: 'World Bank / ICE',
      is_stale: false,
    },
  ],
  unusual_moves: [
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      current_price: 145.2,
      change_percent: 4.5,
      daily_volatility_1y: 2.85,
      z_score_shock: 1.6,
      direction: 'SURGE',
    },
  ],
}

describe('MarketsPage', () => {
  it('renders market intelligence header and sections cleanly', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any)

    render(<MarketsPage />)

    expect(screen.getByText(/Multi-Asset Market Intelligence/i)).toBeInTheDocument()
    expect(screen.getByText('S&P 500')).toBeInTheDocument()
    expect(screen.getByText('CSPX.L')).toBeInTheDocument()
    expect(screen.getByText('USD / SGD')).toBeInTheDocument()
    expect(screen.getByText('Newcastle Thermal Coal')).toBeInTheDocument()
    expect(screen.getByText('NVDA')).toBeInTheDocument()
    expect(screen.getByText('SURGE +1.6σ')).toBeInTheDocument()
  })

  it('filters by category tabs when clicked', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: mockOverviewData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any)

    render(<MarketsPage />)

    const etfsTab = screen.getByRole('button', { name: 'Core ETFs' })
    fireEvent.click(etfsTab)

    expect(screen.getByText('CSPX.L')).toBeInTheDocument()
    // In ETFs tab, indices section header should not be present
    expect(screen.queryByText(/Global & Regional Benchmarks/i)).not.toBeInTheDocument()
  })
})
