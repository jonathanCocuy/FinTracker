"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

export function AnimatedNumber({ 
  value, 
  className 
}: { 
  value: number; 
  className?: string 
}) {
  const ref = useRef<HTMLSpanElement>(null)
  
  // El valor inicial y el destino
  const motionValue = useMotionValue(0)
  
  // Configuramos el "spring" para que se sienta elástico y suave (Estilo Apple)
  const springValue = useSpring(motionValue, {
    damping: 30, // Controla el rebote
    stiffness: 100, // Controla la velocidad inicial
  })

  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  useEffect(() => {
    // Suscribirse al cambio de valor para formatearlo como moneda es-CO
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        }).format(Number(latest.toFixed(0)))
      }
    })
  }, [springValue])

  return <span ref={ref} className={className} />
}