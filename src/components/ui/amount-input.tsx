"use client"

import React, { useCallback, useRef } from "react"
import { Input } from "@/src/components/ui/input"

// es-CO locale: "." = thousands separator, "," = decimal separator

function formatDisplay(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "")
  const commaIdx = cleaned.indexOf(",")

  if (commaIdx === -1) {
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const intPart = cleaned.slice(0, commaIdx)
  const decPart = cleaned.slice(commaIdx + 1).replace(/,/g, "")
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formattedInt},${decPart}`
}

function toNumeric(display: string): string {
  return display.replace(/\./g, "").replace(",", ".")
}

function toDisplay(numeric: string): string {
  if (!numeric) return ""
  return formatDisplay(numeric.replace(".", ","))
}

// Returns the cursor position in `s` after `nonSepCount` non-"." characters
function findCursorPos(s: string, nonSepCount: number): number {
  let count = 0
  for (let i = 0; i < s.length; i++) {
    if (count === nonSepCount) return i
    if (s[i] !== ".") count++
  }
  return s.length
}

export function AmountInput({
  value,
  onChange,
  ...props
}: {
  value: string
  onChange: (v: string) => void
} & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const cursorPos = e.target.selectionStart ?? rawValue.length

      // Count non-separator chars before cursor to track position across reformats
      const nonSepBeforeCursor = rawValue.slice(0, cursorPos).replace(/\./g, "").length

      const newDisplay = formatDisplay(rawValue)
      const newNumeric = toNumeric(newDisplay)

      onChange(newNumeric || "")

      requestAnimationFrame(() => {
        if (!inputRef.current) return
        const newCursor = findCursorPos(newDisplay, nonSepBeforeCursor)
        inputRef.current.setSelectionRange(newCursor, newCursor)
      })
    },
    [onChange]
  )

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={toDisplay(value)}
      onChange={handleChange}
      {...props}
    />
  )
}
