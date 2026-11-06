"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/src/lib/utils"
import { CURRENCY_INFO, type SupportedCurrency } from "@/src/lib/currency"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { Info, Eye, EyeOff } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"

export type KpiColor = "income" | "expense" | "savings" | "default"

export type KpiItem = {
  label: string
  tooltip?: string
  value: number
  previousValue?: number
  subtitle?: string
  prefix?: string
  suffix?: string
  color?: KpiColor
  currencyCode?: string
}

// ─── Slot-machine digit roller ────────────────────────────────────────────────

function DigitRoller({
  char,
  direction,
  delay,
}: {
  char: string
  direction: 1 | -1
  delay: number
}) {
  return (
    <span
      className="inline-block overflow-hidden"
      style={{ height: '1em', lineHeight: 1, verticalAlign: 'baseline' }}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          key={char}
          className="inline-block"
          style={{ lineHeight: 1 }}
          initial={{ y: `${direction * -100}%`, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 70,
              damping: 16,
              delay,
            },
          }}
          exit={{
            y: `${direction * 50}%`,
            opacity: 0,
            filter: 'blur(2px)',
            transition: { duration: 0.12, ease: 'easeIn' },
          }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function NumberRoller({ text, direction }: { text: string; direction: 1 | -1 }) {
  const chars = text.split('')

  // Key from the right so positions are stable when digit count changes (999 → 1,000)
  let dIdx = 0, sIdx = 0
  const enriched = [...chars].reverse().map((char) => {
    const isDigit = /[0-9]/.test(char)
    const pos = isDigit ? dIdx : -1
    if (isDigit) dIdx++; else sIdx++
    return { char, key: isDigit ? `d${pos}` : `s${sIdx - 1}`, isDigit, pos }
  }).reverse()

  const totalDigits = dIdx

  return (
    <span className="inline-flex items-baseline tabular-nums">
      {enriched.map((item) =>
        item.isDigit
          ? (
            <DigitRoller
              key={item.key}
              char={item.char}
              direction={direction}
              delay={item.pos * 0.03}
            />
          )
          : <span key={item.key}>{item.char}</span>
      )}
    </span>
  )
}

// ─── Componente de Animación Interno ─────────────────────────────────────────

function AnimatedValue({
  value,
  prefix,
  color,
  currencyCode,
}: {
  value: number;
  prefix: string;
  color: KpiColor;
  currencyCode?: string;
}) {
  const { locale } = useI18n()
  const numLocale = locale === "en" ? "en-US" : "es-CO"
  const [prevValue, setPrevValue] = useState(value)
  const direction: 1 | -1 = value >= prevValue ? 1 : -1
  useEffect(() => { setPrevValue(value) }, [value])

  const fixedSign = color === "income" ? "+" : color === "expense" ? "-" : ""
  const useAbs = color === "income" || color === "expense"
  const numVal = useAbs ? Math.abs(value) : value

  let formatted: string
  if (currencyCode) {
    const info = CURRENCY_INFO[currencyCode as SupportedCurrency]
    const f = new Intl.NumberFormat(info?.locale ?? 'en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: info?.decimals ?? 2,
      minimumFractionDigits: 0,
    }).format(Number(numVal.toFixed(info?.decimals ?? 2)))
    formatted = `${fixedSign}${f}`
  } else {
    const f = new Intl.NumberFormat(numLocale, {
      maximumFractionDigits: 0,
    }).format(Number(numVal.toFixed(0)))
    formatted = `${fixedSign}${prefix}${f}`
  }

  return <NumberRoller text={formatted} direction={direction} />
}

// ─── Helpers Originales ──────────────────────────────────────────────────────

const colorMap: Record<KpiColor, string> = {
  income: "text-finance-income",
  expense: "text-finance-expense",
  savings: "text-finance-savings",
  default: "text-foreground",
}

function getTrend(value: number, prev: number) {
  if (prev === 0) return { direction: "flat" as const, percent: 0 }
  const diff = ((value - prev) / Math.abs(prev)) * 100
  const percent = Math.round(Math.abs(diff))
  const direction = diff > 0.5 ? "up" : diff < -0.5 ? "down" : "flat"
  return { direction: direction as "up" | "down" | "flat", percent }
}

const trendStyles = {
  up: { cls: "bg-finance-income/10 text-finance-income", arrow: "↑" },
  down: { cls: "bg-finance-expense/10 text-finance-expense", arrow: "↓" },
  flat: { cls: "bg-muted text-muted-foreground border border-border", arrow: "→" },
}

function TrendBadge({ value, prev }: { value: number; prev: number }) {
  const { direction, percent } = getTrend(value, prev)
  const { cls, arrow } = trendStyles[direction]
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
      {arrow} {percent}%
    </span>
  )
}

// ─── Tooltip label reutilizable ──────────────────────────────────────────────

function KpiLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-base font-aeonik-light text-muted-foreground">{label}</p>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={11} className="text-muted-foreground/35 hover:text-muted-foreground cursor-help shrink-0 transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltip.split("\n").map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1 text-muted-foreground/70" : "font-medium"}>{line}</p>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// ─── Valor oculto ────────────────────────────────────────────────────────────

function HiddenValue() {
  return <span className="tracking-[0.15em] text-muted-foreground/40">••••••</span>
}

// ─── KpiCard — tarjeta vertical estándar (mensuales) ─────────────────────────

export function KpiCard({ item, visible = true, className }: { item: KpiItem; visible?: boolean; className?: string }) {
  const { label, tooltip, value, previousValue, subtitle, prefix = "$", suffix = "", color = "default", currencyCode } = item
  const resolvedColor: KpiColor = color === "savings" && value < 0 ? "expense" : color

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("bg-muted/50 rounded-xl px-4 py-4 flex flex-col gap-2", className)}>
        <KpiLabel label={label} tooltip={tooltip} />
        <p className={cn("text-3xl font-aeonik-bold leading-tight", colorMap[resolvedColor])}>
          {visible
            ? <><AnimatedValue value={value} prefix={prefix} color={resolvedColor} currencyCode={currencyCode} />{suffix}</>
            : <HiddenValue />}
        </p>
        <div className="flex items-center justify-between gap-2 min-h-[18px]">
          {subtitle && (
            <p className="text-sm font-aeonik-light text-muted-foreground/50">{subtitle}</p>
          )}
          {previousValue !== undefined && visible && (
            <TrendBadge value={value} prev={previousValue} />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── KpiHeroCard — tarjeta horizontal grande (Balance Total) ─────────────────

export function KpiHeroCard({ item, visible = true, onToggleVisible }: { item: KpiItem; visible?: boolean; onToggleVisible?: () => void }) {
  const { label, tooltip, value, previousValue, subtitle, prefix = "$", suffix = "", color = "default", currencyCode } = item
  const resolvedColor: KpiColor = color === "savings" && value < 0 ? "expense" : color

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full bg-card border border-border/50 rounded-2xl px-6 py-5 flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5 min-w-0">
          <KpiLabel label={label} tooltip={tooltip} />
          <div className="flex items-center gap-2 flex-wrap">
            {subtitle && (
              <p className="text-sm font-aeonik-light text-muted-foreground/50">{subtitle}</p>
            )}
            {previousValue !== undefined && visible && (
              <TrendBadge value={value} prev={previousValue} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <p className={cn("text-4xl sm:text-5xl font-aeonik-bold leading-none", colorMap[resolvedColor])}>
            {visible
              ? <><AnimatedValue value={value} prefix={prefix} color={resolvedColor} currencyCode={currencyCode} />{suffix}</>
              : <HiddenValue />}
          </p>
          {onToggleVisible && (
            <button
              onClick={onToggleVisible}
              className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
              aria-label={visible ? "Ocultar saldos" : "Mostrar saldos"}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── KpiGrid (Sin cambios en estructura) ─────────────────────────────────────

export function KpiGrid({ data, className }: { data: KpiItem[]; className?: string }) {
  return (
    <div className={cn("grid gap-2.5", className)}>
      {data.map((item) => (
        <KpiCard key={item.label} item={item} />
      ))}
    </div>
  )
}