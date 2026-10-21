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

  it('renders live ticking Jakarta clock and market status', () => {
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
    expect(screen.getByText(/Jakarta:/i)).toBeInTheDocument()

    // Fast-forward 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/Jakarta:/i)).toBeInTheDocument()
  })
})
