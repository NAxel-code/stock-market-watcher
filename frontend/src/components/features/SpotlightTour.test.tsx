import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SpotlightTour, TOUR_STEPS } from './SpotlightTour'

describe('SpotlightTour component', () => {
  it('does not render when isActive is false', () => {
    const { container } = render(<SpotlightTour isActive={false} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders step 1 title and badge when isActive is true', () => {
    render(<SpotlightTour isActive={true} onClose={vi.fn()} />)
    expect(screen.getByText('Langkah 1 dari 5')).toBeInTheDocument()
    expect(screen.getByText('Pita Status Pasar Real-Time (Market Ribbon)')).toBeInTheDocument()
  })

  it('navigates through steps when clicking Lanjut and Sebelumnya', () => {
    render(<SpotlightTour isActive={true} onClose={vi.fn()} />)
    
    // Go to step 2
    const lanjutBtn = screen.getByRole('button', { name: /Lanjut/i })
    fireEvent.click(lanjutBtn)
    expect(screen.getByText('Langkah 2 dari 5')).toBeInTheDocument()
    expect(screen.getByText('Pencarian Cerdas Ticker (Cmd+K / Ctrl+K)')).toBeInTheDocument()

    // Go back to step 1
    const prevBtn = screen.getByRole('button', { name: /Sebelumnya/i })
    fireEvent.click(prevBtn)
    expect(screen.getByText('Langkah 1 dari 5')).toBeInTheDocument()
  })

  it('calls onClose when clicking Lewati or close button', () => {
    const handleClose = vi.fn()
    render(<SpotlightTour isActive={true} onClose={handleClose} />)
    
    const lewatiBtn = screen.getByRole('button', { name: /Lewati/i })
    fireEvent.click(lewatiBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when finishing all 5 steps', () => {
    const handleClose = vi.fn()
    render(<SpotlightTour isActive={true} onClose={handleClose} />)

    // Click next 4 times to reach step 5
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      const lanjutBtn = screen.getByRole('button', { name: /Lanjut/i })
      fireEvent.click(lanjutBtn)
    }

    expect(screen.getByText(`Langkah ${TOUR_STEPS.length} dari ${TOUR_STEPS.length}`)).toBeInTheDocument()

    // Click Selesai
    const selesaiBtn = screen.getByRole('button', { name: /Selesai/i })
    fireEvent.click(selesaiBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
