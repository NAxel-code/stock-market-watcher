import { describe, it, expect } from 'vitest'
import {
  computeSMA,
  computeEMA,
  computeBollingerBands,
  computeVWAP,
  type OHLCVPoint,
} from './indicators'

describe('indicators utility', () => {
  const mockPoints: OHLCVPoint[] = Array.from({ length: 30 }, (_, i) => ({
    time: 1700000000 + i * 86400,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 100 + i,
    volume: 1000 + i * 10,
  }))

  it('computes SMA accurately', () => {
    const sma5 = computeSMA(mockPoints, 5)
    expect(sma5.length).toBe(mockPoints.length - 5 + 1)
    // First SMA of [100, 101, 102, 103, 104] => mean = 102
    expect(sma5[0].value).toBe(102)
  })

  it('computes EMA with exponential decay', () => {
    const ema9 = computeEMA(mockPoints, 9)
    expect(ema9.length).toBe(mockPoints.length - 9 + 1)
    // First value should match initial SMA of first 9 points (100 to 108 => 104)
    expect(ema9[0].value).toBe(104)
    // Moving up steadily
    expect(ema9[ema9.length - 1].value).toBeGreaterThan(ema9[0].value)
  })

  it('computes Bollinger Bands with upper, middle, and lower bands', () => {
    const bb = computeBollingerBands(mockPoints, 20, 2)
    expect(bb.middle.length).toBe(mockPoints.length - 20 + 1)
    expect(bb.upper.length).toBe(bb.middle.length)
    expect(bb.lower.length).toBe(bb.middle.length)

    // Upper band should be greater than middle, and middle greater than lower
    for (let i = 0; i < bb.middle.length; i++) {
      expect(bb.upper[i].value).toBeGreaterThan(bb.middle[i].value)
      expect(bb.middle[i].value).toBeGreaterThan(bb.lower[i].value)
    }
  })

  it('computes VWAP accumulating volume-weighted price', () => {
    const vwap = computeVWAP(mockPoints)
    expect(vwap.length).toBe(mockPoints.length)
    // All values must be valid numbers between low and high
    for (const v of vwap) {
      expect(v.value).toBeGreaterThan(90)
      expect(v.value).toBeLessThan(150)
    }
  })
})
