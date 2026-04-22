"use client"

import React, { useState } from "react"
import { useI18n } from "@/src/lib/i18n"
import * as LucideIcons from "lucide-react"
import { Smile } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"

// ─── Icon list ────────────────────────────────────────────────────────────────
export const ICON_LIST = [
  "ShoppingCart", "Utensils", "Car", "Home", "Heart", "Star",
  "Zap", "Music", "Camera", "Gift", "Coffee", "Plane",
  "Bus", "Train", "Bike", "Dumbbell", "BookOpen", "Briefcase",
  "Monitor", "Smartphone", "Tv", "Wifi", "CreditCard", "Wallet",
  "PiggyBank", "TrendingUp", "ReceiptText", "Package", "Tag", "Repeat",
  "Target", "Trophy", "Flag", "Crosshair", "Crown"
]

export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = ICON_LIST.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const SelectedIcon = value ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className: string }>>)[value] : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="h-10 w-10 shrink-0 bg-background/50 border-border cursor-pointer"
        >
          {SelectedIcon ? (
            <SelectedIcon className="h-4 w-4" />
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder={t("transactionModal.searchIcon")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 h-8 text-sm"
        />
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1">
          {filtered.map((name) => {
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className: string }>>)[name]
            if (!Icon) return null
            return (
              <Button
                key={name}
                variant={value === name ? "default" : "ghost"}
                size="icon"
                type="button"
                title={name}
                className="h-9 w-9 cursor-pointer"
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
