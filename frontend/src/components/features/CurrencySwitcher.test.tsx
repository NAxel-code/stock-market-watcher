import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CurrencySwitcher } from './CurrencySwitcher'
import { useUIStore } from '@/stores/useUIStore'

describe('CurrencySwitcher component', () => {
  it('renders default Native currency button', () => {
    useUIStore.setState({ displayCurrency: 'NATIVE' })
    render(<CurrencySwitcher />)

    expect(screen.getByRole('button', { name: /Currency Selector/i })).toBeInTheDocument()
    expect(screen.getByText('Native')).toBeInTheDocument()
  })

  it('opens menu and selects SGD currency', () => {
    useUIStore.setState({ displayCurrency: 'NATIVE' })
    render(<CurrencySwitcher />)

    const toggleBtn = screen.getByRole('button', { name: /Currency Selector/i })
    fireEvent.click(toggleBtn)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    const sgdOption = screen.getByRole('option', { name: /SGD/i })
    fireEvent.click(sgdOption)

    expect(useUIStore.getState().displayCurrency).toBe('SGD')
  })
})
