import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TutorialModal } from './TutorialModal'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('TutorialModal component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<TutorialModal isOpen={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders title and first step when isOpen is true', () => {
    render(<TutorialModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/StockPulse Platform Guide/i)).toBeInTheDocument()
    expect(screen.getByText(/Instant ticker lookup/i)).toBeInTheDocument()
  })

  it('navigates through steps when clicking Next', () => {
    render(<TutorialModal isOpen={true} onClose={vi.fn()} />)
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextBtn)
    expect(screen.getByText(/Real-time trading status/i)).toBeInTheDocument()
  })

  it('switches to Popular Tickers Cheat Sheet tab and displays stock list', () => {
    render(<TutorialModal isOpen={true} onClose={vi.fn()} />)
    const cheatSheetTab = screen.getByRole('button', { name: /Popular Tickers Cheat Sheet/i })
    fireEvent.click(cheatSheetTab)
    expect(screen.getByText('BBCA.JK')).toBeInTheDocument()
    expect(screen.getByText('NVDA')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)
    const closeBtn = screen.getByRole('button', { name: /Close guide/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
