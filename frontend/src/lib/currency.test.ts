import { describe, it, expect } from 'vitest'
import {
  convertCurrency,
  formatConvertedPrice,
  normalizePairKey,
  FALLBACK_FX_RATES,
} from './currency'

describe('currency utilities', () => {
  it('normalizes currency pair keys', () => {
    expect(normalizePairKey('usd/sgd')).toBe('USD/SGD')
    expect(normalizePairKey('usdsgd')).toBe('USD/SGD')
    expect(normalizePairKey('USD_IDR')).toBe('USD/IDR')
  })

  it('returns original amount when target is NATIVE or same currency', () => {
    expect(convertCurrency(100, 'USD', 'NATIVE')).toBe(100)
    expect(convertCurrency(50000, 'IDR', 'IDR')).toBe(50000)
    expect(convertCurrency(65.5, 'SGD', 'SGD')).toBe(65.5)
  })

  it('converts direct pairs correctly', () => {
    const customRates = { 'USD/IDR': 16000, 'USD/SGD': 1.35 }
    // 10 USD -> IDR
    expect(convertCurrency(10, 'USD', 'IDR', customRates)).toBe(160000)
    // 10 USD -> SGD
    expect(convertCurrency(10, 'USD', 'SGD', customRates)).toBe(13.5)
  })

  it('converts inverse pairs correctly', () => {
    const customRates = { 'USD/IDR': 16000 }
    // 32,000 IDR -> USD = 2 USD
    expect(convertCurrency(32000, 'IDR', 'USD', customRates)).toBe(2)
  })

  it('converts cross-rates via triangulation', () => {
    const customRates = {
      'USD/SGD': 1.34,
      'USD/IDR': 16080,
    }
    // 13.4 SGD -> USD is 10 USD -> IDR is 160,800 IDR (without fallback SGD/IDR)
    const converted = convertCurrency(13.4, 'SGD', 'IDR', customRates, false)
    expect(converted).toBeCloseTo(160800, 1)

    // EUR -> USD -> IDR with fallback
    const eurRates = { 'EUR/USD': 1.1, 'USD/IDR': 16000 }
    expect(convertCurrency(10, 'EUR', 'IDR', eurRates, false)).toBeCloseTo(176000, 1)
  })

  it('formats converted prices with currency symbols and approx sign', () => {
    expect(formatConvertedPrice(160800, 'IDR')).toBe('≈ Rp 160.800')
    expect(formatConvertedPrice(49.44, 'USD')).toBe('≈ $49.44')
    expect(formatConvertedPrice(66.5, 'SGD')).toBe('≈ S$ 66.50')
  })

  it('returns null on invalid amounts or unconvertible pairs', () => {
    expect(convertCurrency(NaN, 'USD', 'IDR')).toBeNull()
    expect(convertCurrency(100, 'UNKNOWN', 'XYZ', {})).toBeNull()
  })
})
