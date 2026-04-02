"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"
import { Wallet, Plus } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { cn } from "@/src/lib/utils"

// ─── Componente Interno de Animación ─────────────────────────────────────────

function AnimatedBalance({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  })

  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      motionValue.set(value)
    }
  }, [isInView, value, motionValue])

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(Number(latest.toFixed(0)))
      }
    })
  }, [springValue])

  return <span ref={ref} className="tabular-nums" />
}

// ─── Componente Principal ─────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  balance: number
  color: string
}

interface AccountGridProps {
  accounts: Account[]
  onHoverAccount: (id: string | null) => void
  hoveredAccountId: string | null
}

export function AccountGrid({ accounts, onHoverAccount, hoveredAccountId }: AccountGridProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 w-full">
      {accounts.map((account) => {
        const isDimmed = hoveredAccountId !== null && hoveredAccountId !== account.id

        return (
          <div
            key={account.id}
            onMouseEnter={() => onHoverAccount(account.id)}
            onMouseLeave={() => onHoverAccount(null)}
            className={cn(
              "relative overflow-hidden p-4 rounded-2xl flex items-center gap-4 border transition-all duration-500 cursor-pointer group",
              isDimmed 
                ? "bg-zinc-900/40 border-white/5 opacity-40 grayscale-[40%] scale-95" 
                : "bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border-white/20 opacity-100 shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-100",
              "hover:border-white/30 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.01] active:scale-[0.98]"
            )}
          >
            {/* Icono con el color dinámico */}
            <div className={cn(
              "p-2 rounded-lg shrink-0 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform",
              account.color
            )}>
              <Wallet size={15} className="text-white" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest truncate">
                {account.name}
              </span>
              <div className="text-md font-bold tracking-tight text-foreground">
                {/* REEMPLAZO POR ANIMACIÓN */}
                <AnimatedBalance value={account.balance} />
              </div>
            </div>
          </div>
        )
      })}

      {/* Botón de acción rápida para añadir cuenta */}
      <button 
        className={cn(
          "border-2 border-dashed border-border/30 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group",
          hoveredAccountId !== null ? "opacity-40" : "opacity-100"
        )}
      >
        <Plus size={15} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium">{t("accountsCard.addAccount")}</span>
      </button>
    </div>
  )
}