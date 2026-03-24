"use client"

import { useI18n } from "@/src/lib/i18n"
import { Button } from "@/src/components/ui/button"

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex gap-1" role="group" aria-label="Language">
      <Button
        type="button"
        variant={locale === "es" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocale("es")}
      >
        ES
      </Button>
      <Button
        type="button"
        variant={locale === "en" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
    </div>
  )
}
