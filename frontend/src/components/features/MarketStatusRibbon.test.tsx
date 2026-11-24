import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MarketStatusRibbon } from './MarketStatusRibbon'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

import { useQuery } from '@tanstack/react-query'

describe('MarketStatusRibbon component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders live ticking local device clock and market status', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        idx: {
          is_open: true,
          session_name: 'Session 2 (Open)',
          current_time_local: '2026-10-21 14:59:58 WIB',
        },
        us: {
          is_open: false,
          session_name: 'Closed',
          current_time_local: '2026-10-21 03:59:58 EDT',
        },
      },
      isLoading: false,
    } as any)

    render(<MarketStatusRibbon />)

    expect(screen.getByText(/IDX \(BEI\):/i)).toBeInTheDocument()
    expect(screen.getByText(/Session 2 \(Open\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Local:/i)).toBeInTheDocument()

    // Fast-forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/Local:/i)).toBeInTheDocument()
  })

  it('renders SGX market status and FX rates ticker when available', () => {
    vi.mocked(useQuery).mockImplementation((options: any) => {
      if (options.queryKey[1] === 'fx') {
        return {
          data: {
            rates: [
              { pair: 'USD/SGD', from_currency: 'USD', to_currency: 'SGD', rate: 1.345, change: 0.002, change_percent: 0.15 },
              { pair: 'USD/IDR', from_currency: 'USD', to_currency: 'IDR', rate: 15950, change: -10, change_percent: -0.06 },
            ],
            as_of: '2026-11-24T00:00:00Z',
          },
          isLoading: false,
        } as any
      }

      return {
        data: {
          idx: { is_open: true, session_name: 'Session 1', current_time_local: '10:00 WIB' },
          us: { is_open: false, session_name: 'Closed', current_time_local: '22:00 EST' },
          sgx: { is_open: true, session_name: 'Morning Session', current_time_local: '11:00 SGT' },
        },
        isLoading: false,
      } as any
    })

    render(<MarketStatusRibbon />)

    expect(screen.getByText(/SGX:/i)).toBeInTheDocument()
    expect(screen.getByText(/Morning Session/i)).toBeInTheDocument()
    expect(screen.getByText('USD/SGD')).toBeInTheDocument()
    expect(screen.getByText('1.3450')).toBeInTheDocument()
    expect(screen.getAllByText('USD/IDR').length).toBeGreaterThanOrEqual(1)
  })
})
