"use client"

import { createContext, useContext, useCallback, useState, useEffect } from "react"

import en from "@/src/language/en.json"
import es from "@/src/language/es.json"

const translations = { en, es } as const
export type Locale = keyof typeof translations

const STORAGE_KEY = "fin-tracker-locale"

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "es"
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  return stored && (stored === "en" || stored === "es") ? stored : "es"
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === "string" ? current : undefined
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    setLocaleState(getStoredLocale())
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string) => {
      const text = getNested(translations[locale] as Record<string, unknown>, key)
      return text ?? key
    },
    [locale]
  )

  const value = { locale, setLocale, t }
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return ctx
}
