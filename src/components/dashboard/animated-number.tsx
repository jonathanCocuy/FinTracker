"use client"

import { AnimatePresence, motion } from "framer-motion"

export function AnimatedNumber({
  value,
  className
}: {
  value: number;
  className?: string
}) {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={formatted}
        className={className}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {formatted}
      </motion.span>
    </AnimatePresence>
  )
}