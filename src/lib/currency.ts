export const SUPPORTED_CURRENCIES = ['COP', 'USD', 'GBP', 'EUR', 'MXN', 'BRL'] as const
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]

type CurrencyInfo = {
  symbol: string
  locale: string
  countryCode: string  // ISO 3166-1 alpha-2, lowercase — used for flag images
  decimals: number
}

export const CURRENCY_INFO: Record<SupportedCurrency, CurrencyInfo> = {
  COP: { symbol: '$',  locale: 'es-CO', countryCode: 'co', decimals: 0 },
  USD: { symbol: '$',  locale: 'en-US', countryCode: 'us', decimals: 2 },
  GBP: { symbol: '£',  locale: 'en-GB', countryCode: 'gb', decimals: 2 },
  EUR: { symbol: '€',  locale: 'de-DE', countryCode: 'eu', decimals: 2 },
  MXN: { symbol: '$',  locale: 'es-MX', countryCode: 'mx', decimals: 0 },
  BRL: { symbol: 'R$', locale: 'pt-BR', countryCode: 'br', decimals: 2 },
}

export function getFlagUrl(currency: string): string {
  const code = CURRENCY_INFO[currency as SupportedCurrency]?.countryCode ?? 'un'
  return `https://flagcdn.com/20x15/${code}.png`
}

const CACHE_KEY = 'fx_rates_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

async function getRates(): Promise<Record<string, number>> {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      try {
        const { rates, ts } = JSON.parse(raw) as { rates: Record<string, number>; ts: number }
        if (Date.now() - ts < CACHE_TTL) return rates
      } catch {
        // ignore malformed cache
      }
    }
  }

  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  const data = await res.json() as { rates: Record<string, number> }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: data.rates, ts: Date.now() }))
  }

  return data.rates
}

// Returns how many units of `to` equal 1 unit of `from`
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const rates = await getRates()
  const fromRate = rates[from] ?? 1
  const toRate = rates[to] ?? 1
  return toRate / fromRate
}

export function formatCurrency(amount: number, currency: string): string {
  const info = CURRENCY_INFO[currency as SupportedCurrency]
  const locale = info?.locale ?? 'en-US'
  const decimals = info?.decimals ?? 2
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_INFO[currency as SupportedCurrency]?.symbol ?? currency
}
