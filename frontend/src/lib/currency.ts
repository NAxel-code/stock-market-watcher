export type DisplayCurrency = 'NATIVE' | 'SGD' | 'USD' | 'IDR'

export const FALLBACK_FX_RATES: Record<string, number> = {
  'USD/SGD': 1.345,
  'USD/IDR': 15950,
  'USD/JPY': 155.0,
  'SGD/IDR': 11850,
  'SGD/JPY': 115.2,
  'EUR/USD': 1.085,
}

/**
 * Normalizes pair keys (e.g. 'USD/IDR', 'USD_IDR', 'usdidr' -> 'USD/IDR')
 */
export function normalizePairKey(pair: string): string {
  const clean = pair.toUpperCase().replace(/[^A-Z]/g, '')
  if (clean.length === 6) {
    return `${clean.slice(0, 3)}/${clean.slice(3)}`
  }
  return pair.toUpperCase()
}

/**
 * Convert price from source currency to target currency using provided or fallback FX rates.
 * Returns null if amount is invalid or currencies cannot be resolved.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: DisplayCurrency | string,
  customRates?: Record<string, number>,
  useFallback: boolean = true
): number | null {
  if (amount == null || isNaN(amount) || amount === 0) return amount === 0 ? 0 : null

  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (to === 'NATIVE' || from === to) {
    return amount
  }

  // Build rate lookup table
  const rates = useFallback
    ? { ...FALLBACK_FX_RATES, ...(customRates || {}) }
    : { ...(customRates || {}) }
  const normalizedRates: Record<string, number> = {}
  for (const [k, v] of Object.entries(rates)) {
    if (typeof v === 'number' && v > 0) {
      normalizedRates[normalizePairKey(k)] = v
    }
  }

  // 1. Direct pair (e.g. USD/IDR)
  const directPair = `${from}/${to}`
  if (normalizedRates[directPair]) {
    return amount * normalizedRates[directPair]
  }

  // 2. Inverse pair (e.g. IDR/USD -> 1 / (USD/IDR))
  const inversePair = `${to}/${from}`
  if (normalizedRates[inversePair]) {
    return amount / normalizedRates[inversePair]
  }

  // 3. Triangulation via USD
  let amountInUSD: number | null = null
  if (from === 'USD') {
    amountInUSD = amount
  } else if (normalizedRates[`USD/${from}`]) {
    amountInUSD = amount / normalizedRates[`USD/${from}`]
  } else if (normalizedRates[`${from}/USD`]) {
    amountInUSD = amount * normalizedRates[`${from}/USD`]
  }

  if (amountInUSD !== null) {
    if (to === 'USD') {
      return amountInUSD
    }
    if (normalizedRates[`USD/${to}`]) {
      return amountInUSD * normalizedRates[`USD/${to}`]
    }
    if (normalizedRates[`${to}/USD`]) {
      return amountInUSD / normalizedRates[`${to}/USD`]
    }
  }

  // 4. Triangulation via SGD
  let amountInSGD: number | null = null
  if (from === 'SGD') {
    amountInSGD = amount
  } else if (normalizedRates[`SGD/${from}`]) {
    amountInSGD = amount / normalizedRates[`SGD/${from}`]
  } else if (normalizedRates[`${from}/SGD`]) {
    amountInSGD = amount * normalizedRates[`${from}/SGD`]
  }

  if (amountInSGD !== null) {
    if (to === 'SGD') {
      return amountInSGD
    }
    if (normalizedRates[`SGD/${to}`]) {
      return amountInSGD * normalizedRates[`SGD/${to}`]
    }
    if (normalizedRates[`${to}/SGD`]) {
      return amountInSGD / normalizedRates[`${to}/SGD`]
    }
  }

  return null
}

/**
 * Format converted price with approx symbol (≈)
 */
export function formatConvertedPrice(
  amount: number,
  currency: DisplayCurrency | string
): string {
  const curr = currency.toUpperCase()
  if (curr === 'IDR') {
    return `≈ Rp ${Math.round(amount).toLocaleString('id-ID')}`
  }
  if (curr === 'SGD') {
    return `≈ S$ ${amount.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (curr === 'USD') {
    return `≈ $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (curr === 'JPY') {
    return `≈ ¥${Math.round(amount).toLocaleString('ja-JP')}`
  }
  return `≈ ${amount.toFixed(2)} ${curr}`
}
