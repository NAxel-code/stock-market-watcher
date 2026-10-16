import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatIndexPoints,
  getStockCurrency,
  formatPercent,
  formatVolume,
  formatMarketCap,
  isMarketOpen,
  isIdxTicker,
  calculateLotValue,
  calculateEstimatedFee,
} from './formatters'

describe('formatters utility', () => {
  it('formats USD currency correctly', () => {
    expect(formatCurrency(150.25)).toBe('$150.25')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats IDR currency correctly for Indonesian market', () => {
    const formatted = formatCurrency(6100, 'IDR')
    expect(formatted).toContain('6.100')
  })

  it('formats market index points without dollar or rupiah symbols', () => {
    expect(formatIndexPoints(7739.35)).toBe('7,739.35')
    expect(formatIndexPoints(5185.11)).toBe('5,185.11')
    expect(formatIndexPoints(26511.29)).toBe('26,511.29')
  })

  it('resolves stock currency correctly for US and IDX', () => {
    expect(getStockCurrency('BBCA.JK')).toBe('IDR')
    expect(getStockCurrency({ ticker: 'PGAS.JK' })).toBe('IDR')
    expect(getStockCurrency({ ticker: 'BBRI.JK', currency: 'IDR' })).toBe('IDR')
    expect(getStockCurrency('AAPL')).toBe('USD')
    expect(getStockCurrency({ ticker: 'TSLA' })).toBe('USD')
    expect(getStockCurrency(null)).toBe('USD')
  })

  it('formats percent changes with correct sign', () => {
    expect(formatPercent(2.5)).toBe('+2.50%')
    expect(formatPercent(-1.25)).toBe('-1.25%')
    expect(formatPercent(0)).toBe('+0.00%')
  })

  it('formats volume with abbreviations', () => {
    expect(formatVolume(1500000000)).toBe('1.5B')
    expect(formatVolume(25000000)).toBe('25.0M')
    expect(formatVolume(5000)).toBe('5.0K')
    expect(formatVolume(500)).toBe('500')
  })

  it('formats market cap', () => {
    expect(formatMarketCap(2.5e12)).toBe('$2.50T')
    expect(formatMarketCap(50e9)).toBe('$50.00B')
    expect(formatMarketCap(1.2e12, 'IDR')).toBe('Rp 1.20 T')
    expect(formatMarketCap(undefined)).toBe('N/A')
  })

  it('calculates market status boolean without throwing', () => {
    const isOpen = isMarketOpen()
    expect(typeof isOpen).toBe('boolean')
  })

  it('identifies IDX tickers properly', () => {
    expect(isIdxTicker('BBCA.JK')).toBe(true)
    expect(isIdxTicker('goto.jk')).toBe(true)
    expect(isIdxTicker('AAPL')).toBe(false)
  })

  it('calculates Indonesian lot values (1 lot = 100 shares)', () => {
    expect(calculateLotValue(6000, 1)).toBe(600000)
    expect(calculateLotValue(6000, 10)).toBe(6000000)
  })

  it('calculates estimated brokerage fees accurately', () => {
    const buyFee = calculateEstimatedFee(1000000, 'buy')
    expect(buyFee).toBe(1500) // 0.15%

    const sellFee = calculateEstimatedFee(1000000, 'sell')
    expect(sellFee).toBe(2500) // 0.25%
  })
})
