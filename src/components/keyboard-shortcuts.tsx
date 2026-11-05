"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useI18n } from "@/src/lib/i18n"
import { Keyboard } from "lucide-react"

const SKIP_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"])

function isTyping() {
  const el = document.activeElement
  if (!el) return false
  if (SKIP_TAGS.has(el.tagName)) return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

const SHORTCUTS = [
  { key: "N", label: "shortcuts.newTransaction" },
  { key: "D", label: "shortcuts.dashboard" },
  { key: "T", label: "shortcuts.transactions" },
  { key: "B", label: "shortcuts.budgets" },
  { key: "G", label: "shortcuts.goals" },
  { key: "R", label: "shortcuts.reports" },
  { key: "?", label: "shortcuts.showHelp" },
]

export function KeyboardShortcuts() {
  const router = useRouter()
  const { t } = useI18n()
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping()) return

      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault()
          document.dispatchEvent(new CustomEvent("flowx:open-transaction-modal"))
          break
        case "d":
        case "D":
          router.push("/dashboard")
          break
        case "t":
        case "T":
          router.push("/transactions")
          break
        case "b":
        case "B":
          router.push("/budgets")
          break
        case "g":
        case "G":
          router.push("/goals")
          break
        case "r":
        case "R":
          router.push("/reports")
          break
        case "?":
          setHelpOpen(v => !v)
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [router])

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Keyboard size={16} />
            {t("shortcuts.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1 mt-1">
          {SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-muted/50 text-sm">
              <span className="text-muted-foreground">{t(label)}</span>
              <kbd className="font-mono text-xs bg-muted border border-border rounded px-2 py-0.5 text-foreground">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-1">{t("shortcuts.hint")}</p>
      </DialogContent>
    </Dialog>
  )
}
