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
    expect(screen.getByText(/Panduan Penggunaan StockPulse/i)).toBeInTheDocument()
    expect(screen.getByText(/Pencarian kilat saham/i)).toBeInTheDocument()
  })

  it('navigates through steps when clicking Lanjut', () => {
    render(<TutorialModal isOpen={true} onClose={vi.fn()} />)
    const lanjutBtn = screen.getByRole('button', { name: /Lanjut/i })
    fireEvent.click(lanjutBtn)
    expect(screen.getByText(/Pantau jam perdagangan BEI/i)).toBeInTheDocument()
  })

  it('switches to Kamus Ticker tab and displays stock list', () => {
    render(<TutorialModal isOpen={true} onClose={vi.fn()} />)
    const cheatSheetTab = screen.getByRole('button', { name: /Kamus Ticker Populer/i })
    fireEvent.click(cheatSheetTab)
    expect(screen.getByText('BBCA.JK')).toBeInTheDocument()
    expect(screen.getByText('NVDA')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(<TutorialModal isOpen={true} onClose={handleClose} />)
    const closeBtn = screen.getByRole('button', { name: /Tutup panduan/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
