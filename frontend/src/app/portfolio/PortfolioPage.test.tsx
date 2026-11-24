import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortfolioPage from './page'

const { mockAnalysis } = vi.hoisted(() => ({
  mockAnalysis: {
    base_currency: 'SGD',
    as_of: '2026-11-24T12:00:00Z',
    total_cost_base: 85000.0,
    total_value_base: 104500.0,
    unrealized_pnl_base: 19500.0,
    unrealized_pnl_percent: 22.94,
    total_stock_move_pnl_base: 16200.0,
    total_fx_move_pnl_base: 3300.0,
    total_annual_dividend_gross_base: 2850.0,
    total_annual_dividend_net_base: 2250.0,
    holdings: [
      {
        holding: {
          id: '1',
          ticker: 'NVDA',
          company_name: 'NVIDIA Corporation',
          exchange: 'US',
          asset_type: 'EQUITY',
          shares: 100,
          lot_size: 1,
          cost_basis: 115.0,
          currency: 'USD',
          country: 'US',
          sector: 'Technology',
          fees: 0,
        },
        current_price: 145.0,
        current_value_native: 14500.0,
        current_value_base: 19517.0,
        cost_value_base: 15352.0,
        unrealized_pnl_base: 4165.0,
        unrealized_pnl_percent: 27.13,
        weight_percent: 18.68,
        stock_return_pct: 26.09,
        fx_return_pct: 0.82,
        stock_alpha_contribution_base: 4005.0,
        fx_contribution_base: 160.0,
        est_annual_dividend_gross: 45.0,
        est_annual_dividend_net: 31.5,
        us_withholding_tax_applied: true,
        is_us_situs: true,
        is_above_8pct_cap: true,
        is_above_12pct_trim: true,
      },
    ],
    allocation: {
      by_sector: { Technology: 100.0 },
      by_country: { US: 100.0 },
      by_currency: { USD: 100.0 },
    },
    risk: {
      portfolio_beta: 1.04,
      annualized_volatility: 14.8,
      max_drawdown: -9.4,
      sharpe_ratio: 1.65,
      position_cap_warnings: ['NVDA weight 18.7% exceeds 8% concentration cap'],
      us_estate_tax_exposure_usd: 14500.0,
      us_estate_tax_limit_usd: 60000.0,
      us_estate_tax_alert: false,
      us_estate_tax_message: 'OK: US situs assets ($14,500) are within the $60,000 threshold ($45,500 buffer remaining).',
    },
    benchmark_comparison: {},
  },
}))

vi.mock('@/lib/api', () => ({
  fetchDefaultPortfolio: vi.fn().mockResolvedValue([
    {
      id: '1',
      ticker: 'NVDA',
      company_name: 'NVIDIA Corporation',
      exchange: 'US',
      asset_type: 'EQUITY',
      shares: 100,
      lot_size: 1,
      cost_basis: 115.0,
      currency: 'USD',
      country: 'US',
      sector: 'Technology',
      fees: 0,
    },
  ]),
  analyzeCustomPortfolio: vi.fn().mockResolvedValue(mockAnalysis),
}))

describe('PortfolioPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders institutional portfolio metrics and attribution', async () => {
    render(<PortfolioPage />)

    await waitFor(() => {
      expect(screen.getByText(/Institutional Multi-Asset Portfolio/i)).toBeInTheDocument()
      expect(screen.getAllByText('NVDA').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/Performance Attribution/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/US Situs Estate-Tax Tracker/i)).toBeInTheDocument()
      expect(screen.getAllByText('30% WHT').length).toBeGreaterThanOrEqual(1)
    })
  })
})
