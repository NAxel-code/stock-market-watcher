export function formatCurrency(value: number, currency = 'USD'): string {
  // For IDR-denominated stocks (Indonesian market), format differently
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toString()
}

export function formatMarketCap(value?: number): string {
  if (!value) return 'N/A'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toFixed(2)}`
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const utcMinute = now.getUTCMinutes()
  const utcDay = now.getUTCDay() // 0=Sun, 6=Sat
  // NYSE: 14:30-21:00 UTC, Mon-Fri
  if (utcDay === 0 || utcDay === 6) return false
  const minutesSinceMidnight = utcHour * 60 + utcMinute
  return minutesSinceMidnight >= 870 && minutesSinceMidnight <= 1260 // 14:30 to 21:00
}

/** Check if symbol represents an IDX ticker (*.JK) */
export function isIdxTicker(ticker: string): boolean {
  return ticker.toUpperCase().endsWith('.JK')
}

/** Calculate total stock value for Indonesian lot size (1 lot = 100 shares) */
export function calculateLotValue(pricePerShare: number, lots: number): number {
  return pricePerShare * lots * 100
}

/** Calculate estimated broker fee for Indonesia (standard 0.15% buy, 0.25% sell) */
export function calculateEstimatedFee(value: number, type: 'buy' | 'sell' = 'buy'): number {
  const rate = type === 'buy' ? 0.0015 : 0.0025
  return Math.round(value * rate)
}
