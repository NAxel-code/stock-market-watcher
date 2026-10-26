export function formatCurrency(value: number, currency = 'USD'): string {
  // For IDR-denominated stocks (Indonesian market), format as Rp without decimals
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

/**
 * Format market index points (e.g. S&P 500, NASDAQ, Dow Jones, IHSG).
 * Indices are NOT currency amounts and must not display $ or Rp symbols.
 */
export function formatIndexPoints(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Robust currency resolver for stock items.
 * Guaranteed to return 'IDR' for Indonesian stocks (*.JK) and 'USD' for US stocks.
 */
export function getStockCurrency(
  item?: { ticker?: string; currency?: string; is_idx?: boolean } | string | null
): 'IDR' | 'USD' {
  if (!item) return 'USD'
  const ticker = typeof item === 'string' ? item : item.ticker || ''
  if (isIdxTicker(ticker) || (typeof item === 'object' && item.is_idx)) {
    return 'IDR'
  }
  if (typeof item === 'object' && item.currency === 'IDR') {
    return 'IDR'
  }
  return 'USD'
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

export function formatMarketCap(value?: number, currency = 'USD'): string {
  if (!value) return 'N/A'
  if (currency === 'IDR') {
    if (value >= 1e12) return `Rp ${(value / 1e12).toFixed(2)} T`
    if (value >= 1e9) return `Rp ${(value / 1e9).toFixed(2)} M`
    if (value >= 1e6) return `Rp ${(value / 1e6).toFixed(2)} Jt`
    return `Rp ${value.toLocaleString('id-ID')}`
  }
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

/**
 * Official IDX (Bursa Efek Indonesia / BEI) Fraksi Harga (Tick Size) rules:
 * - Price < Rp 200: Tick Size Rp 1
 * - Rp 200 <= Price < Rp 500: Tick Size Rp 2
 * - Rp 500 <= Price < Rp 2,000: Tick Size Rp 5
 * - Rp 2,000 <= Price < Rp 5,000: Tick Size Rp 10
 * - Price >= Rp 5,000: Tick Size Rp 25
 */
export function getIdxTickSize(price: number): number {
  if (price <= 0) return 1
  if (price < 200) return 1
  if (price < 500) return 2
  if (price < 2000) return 5
  if (price < 5000) return 10
  return 25
}

/**
 * Snaps a given price to the nearest valid IDX tick according to BEI rules.
 */
export function snapToIdxTick(price: number, roundUp = false): number {
  if (price <= 0) return 0
  const tick = getIdxTickSize(price)
  if (roundUp) {
    return Math.ceil(price / tick) * tick
  }
  return Math.round(price / tick) * tick
}

/**
 * Increment or decrement an IDX price by a given number of ticks,
 * dynamically adjusting tick boundaries as price crosses thresholds.
 * When stepping down, uses the tick size of the range below (e.g. 5000 -> 4990).
 */
export function stepIdxPrice(currentPrice: number, steps: number): number {
  let price = snapToIdxTick(currentPrice)
  const dir = steps > 0 ? 1 : -1
  const count = Math.abs(steps)

  for (let i = 0; i < count; i++) {
    const tick = dir > 0 ? getIdxTickSize(price) : getIdxTickSize(price - 1)
    price = price + dir * tick
    if (price < 1) {
      price = 1
      break
    }
  }

  return price
}

/** Calculate estimated broker fee for Indonesia (standard 0.15% buy, 0.25% sell) */
export function calculateEstimatedFee(value: number, type: 'buy' | 'sell' = 'buy'): number {
  const rate = type === 'buy' ? 0.0015 : 0.0025
  return Math.round(value * rate)
}
