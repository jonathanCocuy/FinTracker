"use client"

import { createContext, useContext, useCallback, useSyncExternalStore } from "react"

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

const localeStore = {
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    this.listeners.add(cb)
    if (typeof window !== "undefined") {
      const onStorage = () => cb()
      window.addEventListener("storage", onStorage)
      return () => {
        this.listeners.delete(cb)
        window.removeEventListener("storage", onStorage)
      }
    }
    return () => this.listeners.delete(cb)
  },
  getSnapshot: () => getStoredLocale(),
  getServerSnapshot: () => "es" as Locale,
  setLocale(locale: Locale) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale)
    }
    this.listeners.forEach((cb) => cb())
  },
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
  const locale = useSyncExternalStore(
    (cb) => localeStore.subscribe(cb),
    localeStore.getSnapshot,
    localeStore.getServerSnapshot
  )

  const setLocale = useCallback((newLocale: Locale) => {
    localeStore.setLocale(newLocale)
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
