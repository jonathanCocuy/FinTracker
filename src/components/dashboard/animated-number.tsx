"use client"

import { useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CURRENCY_INFO, type SupportedCurrency } from "@/src/lib/currency"

function DigitRoller({ char, direction, delay }: { char: string; direction: 1 | -1; delay: number }) {
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
            transition: { type: 'spring', stiffness: 70, damping: 16, delay },
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

export function AnimatedNumber({
  value,
  currency = 'COP',
  className
}: {
  value: number;
  currency?: string;
  className?: string
}) {
  const prevRef = useRef<number>(value)
  const direction: 1 | -1 = value >= prevRef.current ? 1 : -1
  prevRef.current = value

  const info = CURRENCY_INFO[currency as SupportedCurrency]
  const locale = info?.locale ?? 'es-CO'
  const decimals = info?.decimals ?? 0

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)

  const chars = formatted.split('')
  let dIdx = 0, sIdx = 0
  const enriched = [...chars].reverse().map((char) => {
    const isDigit = /[0-9]/.test(char)
    const pos = isDigit ? dIdx : -1
    if (isDigit) dIdx++; else sIdx++
    return { char, key: isDigit ? `d${pos}` : `s${sIdx - 1}`, isDigit, pos }
  }).reverse()

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className ?? ''}`}>
      {enriched.map((item) =>
        item.isDigit
          ? <DigitRoller key={item.key} char={item.char} direction={direction} delay={item.pos * 0.03} />
          : <span key={item.key}>{item.char}</span>
      )}
    </span>
  )
}
