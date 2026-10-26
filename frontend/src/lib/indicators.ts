import type { UTCTimestamp } from 'lightweight-charts'

export interface OHLCVPoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface LinePoint {
  time: UTCTimestamp
  value: number
}

/**
 * Compute Simple Moving Average (SMA)
 */
export function computeSMA(points: OHLCVPoint[], windowSize: number): LinePoint[] {
  const result: LinePoint[] = []
  if (points.length < windowSize || windowSize <= 0) return result

  for (let i = windowSize - 1; i < points.length; i++) {
    let sum = 0
    for (let j = 0; j < windowSize; j++) {
      sum += points[i - j].close
    }
    result.push({
      time: points[i].time as UTCTimestamp,
      value: parseFloat((sum / windowSize).toFixed(2)),
    })
  }
  return result
}

/**
 * Compute Exponential Moving Average (EMA)
 * Multiplier = 2 / (windowSize + 1)
 * EMA_today = (Close_today * multiplier) + (EMA_yesterday * (1 - multiplier))
 */
export function computeEMA(points: OHLCVPoint[], windowSize: number): LinePoint[] {
  const result: LinePoint[] = []
  if (points.length < windowSize || windowSize <= 0) return result

  const k = 2 / (windowSize + 1)

  // Seed EMA with initial SMA of first windowSize points
  let initialSum = 0
  for (let i = 0; i < windowSize; i++) {
    initialSum += points[i].close
  }
  let prevEMA = initialSum / windowSize

  result.push({
    time: points[windowSize - 1].time as UTCTimestamp,
    value: parseFloat(prevEMA.toFixed(2)),
  })

  for (let i = windowSize; i < points.length; i++) {
    const currentEMA = points[i].close * k + prevEMA * (1 - k)
    result.push({
      time: points[i].time as UTCTimestamp,
      value: parseFloat(currentEMA.toFixed(2)),
    })
    prevEMA = currentEMA
  }

  return result
}

export interface BollingerBandsResult {
  upper: LinePoint[]
  middle: LinePoint[]
  lower: LinePoint[]
}

/**
 * Compute Bollinger Bands (Period = 20, Multiplier = 2 by default)
 */
export function computeBollingerBands(
  points: OHLCVPoint[],
  period = 20,
  multiplier = 2
): BollingerBandsResult {
  const upper: LinePoint[] = []
  const middle: LinePoint[] = []
  const lower: LinePoint[] = []

  if (points.length < period || period <= 0) {
    return { upper, middle, lower }
  }

  for (let i = period - 1; i < points.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += points[i - j].close
    }
    const sma = sum / period

    let varianceSum = 0
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(points[i - j].close - sma, 2)
    }
    const stdDev = Math.sqrt(varianceSum / period)

    const t = points[i].time as UTCTimestamp
    middle.push({ time: t, value: parseFloat(sma.toFixed(2)) })
    upper.push({ time: t, value: parseFloat((sma + multiplier * stdDev).toFixed(2)) })
    lower.push({ time: t, value: parseFloat((sma - multiplier * stdDev).toFixed(2)) })
  }

  return { upper, middle, lower }
}

/**
 * Compute Volume Weighted Average Price (VWAP)
 * Typical Price = (High + Low + Close) / 3
 * Cumulative (Typical Price * Volume) / Cumulative Volume
 */
export function computeVWAP(points: OHLCVPoint[]): LinePoint[] {
  const result: LinePoint[] = []
  if (points.length === 0) return result

  let cumVolume = 0
  let cumTypicalVolume = 0

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const typicalPrice = (p.high + p.low + p.close) / 3
    const vol = p.volume > 0 ? p.volume : 1

    cumTypicalVolume += typicalPrice * vol
    cumVolume += vol

    if (cumVolume > 0) {
      result.push({
        time: p.time as UTCTimestamp,
        value: parseFloat((cumTypicalVolume / cumVolume).toFixed(2)),
      })
    }
  }

  return result
}
