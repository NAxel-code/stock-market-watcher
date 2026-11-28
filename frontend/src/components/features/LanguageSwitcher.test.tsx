import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useUIStore } from '@/stores/useUIStore'

describe('LanguageSwitcher component', () => {
  it('renders EN and ID buttons with EN default', () => {
    useUIStore.setState({ language: 'en' })
    render(<LanguageSwitcher />)

    const enBtn = screen.getByRole('button', { name: 'EN' })
    const idBtn = screen.getByRole('button', { name: 'ID' })

    expect(enBtn).toHaveAttribute('aria-pressed', 'true')
    expect(idBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches language when ID button is clicked', () => {
    useUIStore.setState({ language: 'en' })
    render(<LanguageSwitcher />)

    const idBtn = screen.getByRole('button', { name: 'ID' })
    fireEvent.click(idBtn)

    expect(useUIStore.getState().language).toBe('id')
  })
})
