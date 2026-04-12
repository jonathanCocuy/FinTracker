"use client"

import { createContext, useContext, useCallback, useState, useEffect } from "react"

import en from "@/src/language/en.json"
import es from "@/src/language/es.json"

const translations = { en, es } as const
export type Locale = keyof typeof translations

const STORAGE_KEY = "fin-tracker-locale"

function parseLocale(value: string | null): Locale {
  return value === "en" || value === "es" ? value : "es"
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
  // Start with "es" on both server and client to avoid hydration mismatch.
  // After mount, read the stored preference from localStorage.
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    setLocaleState(parseLocale(localStorage.getItem(STORAGE_KEY)))

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLocaleState(parseLocale(e.newValue))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = useCallback(
    (key: string) => {
      const text = getNested(translations[locale] as Record<string, unknown>, key)
      return text ?? key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
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
