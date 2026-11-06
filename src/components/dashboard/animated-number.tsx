"use client"

import { useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"

function DigitRoller({ char, direction }: { char: string; direction: 1 | -1 }) {
  return (
    <span
      className="inline-block overflow-hidden"
      style={{ height: '1em', lineHeight: 1, verticalAlign: 'baseline' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={char}
          className="inline-block"
          style={{ lineHeight: 1 }}
          initial={{ y: `${direction * 110}%` }}
          animate={{ y: 0 }}
          exit={{ y: `${direction * -110}%` }}
          transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function AnimatedNumber({
  value,
  className
}: {
  value: number;
  className?: string
}) {
  const prevRef = useRef<number>(value)
  const direction: 1 | -1 = value >= prevRef.current ? 1 : -1
  prevRef.current = value

  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)

  const chars = formatted.split('')
  let dIdx = 0, sIdx = 0
  const enriched = [...chars].reverse().map((char) => {
    const isDigit = /[0-9]/.test(char)
    return { char, key: isDigit ? `d${dIdx++}` : `s${sIdx++}`, isDigit }
  }).reverse()

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className ?? ''}`}>
      {enriched.map((item) =>
        item.isDigit
          ? <DigitRoller key={item.key} char={item.char} direction={direction} />
          : <span key={item.key}>{item.char}</span>
      )}
    </span>
  )
}
