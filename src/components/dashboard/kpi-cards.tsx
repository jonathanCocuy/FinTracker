"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/src/lib/utils"

export type KpiColor = "income" | "expense" | "savings" | "default"

export type KpiItem = {
  label: string
  value: number
  previousValue?: number
  subtitle?: string
  prefix?: string
  suffix?: string
  color?: KpiColor
}

// ─── Componente de Animación Interno ─────────────────────────────────────────

function AnimatedValue({ 
  value, 
  prefix, 
  color 
}: { 
  value: number; 
  prefix: string; 
  color: KpiColor 
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  })

  const isInView = useInView(ref, { once: true })

  const formatDisplay = (val: number) => {
    const sign = color === "income" ? "+" : color === "expense" ? "-" : ""
    const formatted = new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0,
    }).format(Number(val.toFixed(0)))
    return `${sign}${prefix}${formatted}`
  }

  useEffect(() => {
    if (isInView) {
      if (value === 0 && ref.current) {
        ref.current.textContent = formatDisplay(0)
      }
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatDisplay(latest)
      }
    })
  }, [springValue, prefix, color])

  return <span ref={ref} className="tabular-nums" />
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

// ─── KpiCard (Mismo tamaño y diseño) ─────────────────────────────────────────

export function KpiCard({ item }: { item: KpiItem }) {
  const { label, value, previousValue, subtitle, prefix = "$", suffix = "", color = "default" } = item

  return (
    <div className="bg-muted/50 rounded-lg px-4 py-3.5 flex flex-col gap-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-medium leading-tight ${colorMap[color]}`}>
        {/* Aquí integramos la animación manteniendo tu estilo de texto */}
        <AnimatedValue value={value} prefix={prefix} color={color} />
        {suffix}
      </p>
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        {subtitle && (
          <p className="text-[9px] text-muted-foreground/60">{subtitle}</p>
        )}
        {previousValue !== undefined && (
          <TrendBadge value={value} prev={previousValue} />
        )}
      </div>
    </div>
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