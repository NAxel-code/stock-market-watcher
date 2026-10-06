import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FiftyTwoWeekRangeBar } from './FiftyTwoWeekRangeBar'

describe('FiftyTwoWeekRangeBar component', () => {
  it('renders low, high, and percentage position correctly', () => {
    render(<FiftyTwoWeekRangeBar low={100} high={200} current={150} currency="USD" />)
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByText(/52W Range \(50%\)/)).toBeInTheDocument()
  })

  it('renders nothing when range is invalid', () => {
    const { container } = render(<FiftyTwoWeekRangeBar low={200} high={100} current={150} />)
    expect(container.firstChild).toBeNull()
  })
})
