"use client"

import { useEffect, useState } from "react"
import { getExchangeRate, CURRENCY_INFO, type SupportedCurrency } from "@/src/lib/currency"

export function TrmBadge({ baseCurrency }: { baseCurrency: string }) {
  const [rate, setRate] = useState<number | null>(null)

  useEffect(() => {
    getExchangeRate('USD', baseCurrency).then(setRate).catch(() => null)
  }, [baseCurrency])

  if (!rate) return null

  const info = CURRENCY_INFO[baseCurrency as SupportedCurrency]
  const decimals = baseCurrency === 'USD' ? 4 : (info?.decimals ?? 2)
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(rate)

  return (
    <span className="text-[11px] text-zinc-500 bg-zinc-900/50 border border-white/5 rounded-full px-2.5 py-1 tabular-nums">
      1 USD = {formatted} {baseCurrency}
    </span>
  )
}
