'use client'

import React from 'react'

interface SparklineProps {
  data?: number[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data = [],
  width = 96,
  height = 32,
  strokeWidth = 1.75,
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        data-testid="sparkline-empty"
        className={`inline-block opacity-30 ${className}`}
        style={{ width, height }}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#71717a"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </svg>
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min

  // Padding inside the SVG viewBox
  const paddingY = 4
  const usableHeight = height - paddingY * 2

  // Generate path points
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - paddingY - ((val - min) / range) * usableHeight
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
  })

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  const isPositive = data[data.length - 1] >= data[0]
  const strokeColor = isPositive ? '#22c55e' : '#ef4444'

  return (
    <div
      data-testid="sparkline-chart"
      className={`inline-block ${className}`}
      title={`7D Trend (${isPositive ? '+' : ''}${(((data[data.length - 1] - data[0]) / (data[0] || 1)) * 100).toFixed(2)}%)`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
