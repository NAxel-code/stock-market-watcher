import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchCommand } from './SearchCommand'
import { useUIStore } from '@/stores/useUIStore'

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock searchTickers
vi.mock('@/lib/api', () => ({
  searchTickers: vi.fn().mockResolvedValue([
    {
      ticker: 'D05.SI',
      name: 'DBS Group Holdings Ltd',
      exchange: 'SES',
      type: 'S',
      currency: 'SGD',
      is_primary: true,
    },
    {
      ticker: 'BBCA.JK',
      name: 'Bank Central Asia Tbk',
      exchange: 'JKT',
      type: 'S',
      currency: 'IDR',
      is_primary: true,
    },
  ]),
}))

describe('SearchCommand component', () => {
  beforeEach(() => {
    useUIStore.setState({
      fxRates: {
        'USD/IDR': 16000,
        'USD/SGD': 1.34,
        'SGD/IDR': 11940,
      },
    })
  })

  it('renders search button and opens dialog on click', () => {
    render(<SearchCommand />)

    const searchButtons = screen.getAllByRole('button', { name: /Search stocks/i })
    expect(searchButtons.length).toBeGreaterThan(0)

    fireEvent.click(searchButtons[0])
    expect(screen.getByPlaceholderText(/Search stocks/i)).toBeInTheDocument()
  })

  it('opens dialog via stockpulse:open-search custom event', () => {
    render(<SearchCommand />)

    act(() => {
      window.dispatchEvent(new CustomEvent('stockpulse:open-search'))
    })

    expect(screen.getByPlaceholderText(/Search stocks/i)).toBeInTheDocument()
  })

  it('parses currency conversion input and displays Quick FX Conversion', async () => {
    render(<SearchCommand />)

    act(() => {
      window.dispatchEvent(new CustomEvent('stockpulse:open-search'))
    })

    const input = screen.getByPlaceholderText(/Search stocks/i)
    fireEvent.change(input, { target: { value: '1000 usd to idr' } })

    expect(screen.getByText(/Quick FX Conversion/i)).toBeInTheDocument()
    expect(screen.getByText('1,000 USD')).toBeInTheDocument()
    expect(screen.getByText(/Rp 16\.000\.000/i)).toBeInTheDocument()
  })
})
