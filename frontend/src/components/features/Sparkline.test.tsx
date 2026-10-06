import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sparkline } from './Sparkline'

describe('Sparkline component', () => {
  it('renders empty fallback when data is missing or has less than 2 items', () => {
    const { rerender } = render(<Sparkline data={[]} />)
    expect(screen.getByTestId('sparkline-empty')).toBeInTheDocument()

    rerender(<Sparkline data={[100]} />)
    expect(screen.getByTestId('sparkline-empty')).toBeInTheDocument()
  })

  it('renders green path when trend is upward', () => {
    const data = [100, 102, 105, 108, 110]
    render(<Sparkline data={data} />)

    const chart = screen.getByTestId('sparkline-chart')
    expect(chart).toBeInTheDocument()

    const path = chart.querySelector('path')
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('stroke', '#22c55e')
  })

  it('renders red path when trend is downward', () => {
    const data = [110, 108, 105, 102, 95]
    render(<Sparkline data={data} />)

    const chart = screen.getByTestId('sparkline-chart')
    expect(chart).toBeInTheDocument()

    const path = chart.querySelector('path')
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute('stroke', '#ef4444')
  })

  it('applies custom dimensions', () => {
    const data = [100, 110]
    render(<Sparkline data={data} width={120} height={40} />)

    const chart = screen.getByTestId('sparkline-chart')
    const svg = chart.querySelector('svg')
    expect(svg).toHaveAttribute('width', '120')
    expect(svg).toHaveAttribute('height', '40')
  })
})
