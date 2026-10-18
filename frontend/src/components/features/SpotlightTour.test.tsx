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
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('Real-Time Market Status (Market Ribbon)')).toBeInTheDocument()
  })

  it('navigates through steps when clicking Next and Back', () => {
    render(<SpotlightTour isActive={true} onClose={vi.fn()} />)
    
    // Go to step 2
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextBtn)
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    expect(screen.getByText('Smart Ticker Search (Cmd+K / Ctrl+K)')).toBeInTheDocument()

    // Go back to step 1
    const prevBtn = screen.getByRole('button', { name: /Back/i })
    fireEvent.click(prevBtn)
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
  })

  it('calls onClose when clicking Skip or close button', () => {
    const handleClose = vi.fn()
    render(<SpotlightTour isActive={true} onClose={handleClose} />)
    
    const skipBtn = screen.getByRole('button', { name: /Skip/i })
    fireEvent.click(skipBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when finishing all 5 steps', () => {
    const handleClose = vi.fn()
    render(<SpotlightTour isActive={true} onClose={handleClose} />)

    // Click next 4 times to reach step 5
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      const nextBtn = screen.getByRole('button', { name: /Next/i })
      fireEvent.click(nextBtn)
    }

    expect(screen.getByText(`Step ${TOUR_STEPS.length} of ${TOUR_STEPS.length}`)).toBeInTheDocument()

    // Click Done
    const doneBtn = screen.getByRole('button', { name: /Done/i })
    fireEvent.click(doneBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
