import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DenoisedCorrelationHeatmap } from './DenoisedCorrelationHeatmap'

// Mock hook
vi.mock('@/hooks/useWatchlistCorrelation', () => ({
  useWatchlistCorrelation: vi.fn(),
}))

// Mock store
vi.mock('@/stores/useUIStore', () => ({
  useUIStore: vi.fn(() => ({
    watchlist: ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'BBCA.JK', 'BBRI.JK'],
  })),
}))

import { useWatchlistCorrelation } from '@/hooks/useWatchlistCorrelation'

const mockCorrelationData = {
  tickers: ['AAPL', 'NVDA', 'BBCA.JK', 'BBRI.JK'],
  raw_correlation: [
    [1.0, 0.72, 0.15, 0.18],
    [0.72, 1.0, 0.12, 0.14],
    [0.15, 0.12, 1.0, 0.82],
    [0.18, 0.14, 0.82, 1.0],
  ],
  denoised_correlation: [
    [1.0, 0.65, 0.05, 0.08],
    [0.65, 1.0, 0.04, 0.06],
    [0.05, 0.04, 1.0, 0.78],
    [0.08, 0.06, 0.78, 1.0],
  ],
  lambda_plus: 2.41,
  signal_count: 2,
  noise_count: 2,
  interpretation: 'Filtered 2 noise factors out of 4 total asset dimensions.',
}

describe('DenoisedCorrelationHeatmap component', () => {
  it('renders loading state when correlation is fetching', () => {
    vi.mocked(useWatchlistCorrelation).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isFetching: true,
    } as any)

    render(<DenoisedCorrelationHeatmap />)
    expect(screen.getByText(/Computing Marchenko-Pastur spectral decomposition/i)).toBeInTheDocument()
  })

  it('renders matrix with denoised correlation values and diagnostics', () => {
    vi.mocked(useWatchlistCorrelation).mockReturnValue({
      data: mockCorrelationData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any)

    render(<DenoisedCorrelationHeatmap />)

    // Diagnostics
    expect(screen.getByText(/RMT Portfolio Correlation Matrix/i)).toBeInTheDocument()
    expect(screen.getByText(/2 \/ 4 Factors/i)).toBeInTheDocument()
    expect(screen.getByText(/2 Drivers/i)).toBeInTheDocument()
    expect(screen.getByText('2.41')).toBeInTheDocument()

    // Matrix headers
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NVDA').length).toBeGreaterThan(0)

    // Cell value in denoised mode (symmetric matrix has 2 cells with +0.65)
    expect(screen.getAllByText('+0.65').length).toBe(2)
  })

  it('switches between Denoised and Raw Empirical view', () => {
    vi.mocked(useWatchlistCorrelation).mockReturnValue({
      data: mockCorrelationData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any)

    render(<DenoisedCorrelationHeatmap />)

    // In denoised mode: +0.65 is present (2 symmetric cells), +0.72 is not
    expect(screen.getAllByText('+0.65').length).toBe(2)
    expect(screen.queryByText('+0.72')).not.toBeInTheDocument()

    // Click Raw Empirical toggle
    const rawBtn = screen.getByRole('button', { name: /Raw Empirical/i })
    fireEvent.click(rawBtn)

    // In raw mode: +0.72 is present (2 symmetric cells)
    expect(screen.getAllByText('+0.72').length).toBe(2)
  })

  it('allows collapsing and expanding the matrix', () => {
    vi.mocked(useWatchlistCorrelation).mockReturnValue({
      data: mockCorrelationData,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any)

    render(<DenoisedCorrelationHeatmap />)

    const collapseBtn = screen.getByRole('button', { name: /Collapse/i })
    fireEvent.click(collapseBtn)

    // Matrix should be collapsed
    expect(screen.queryByText(/Raw Empirical/i)).not.toBeInTheDocument()

    // Expand again
    const expandBtn = screen.getByRole('button', { name: /Expand Matrix/i })
    fireEvent.click(expandBtn)
    expect(screen.getByRole('button', { name: /Raw Empirical/i })).toBeInTheDocument()
  })
})
