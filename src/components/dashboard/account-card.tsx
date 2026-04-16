"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"
import { Wallet } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { AccountModal } from "./account-modal"

// ─── Componente Interno de Animación ─────────────────────────────────────────

function AnimatedBalance({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 10,
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
  showAddButton?: boolean
}

export function AccountGrid({ accounts, onHoverAccount, hoveredAccountId, showAddButton = true }: AccountGridProps) {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 w-full">
        {accounts.map((account) => {
          const isDimmed = hoveredAccountId !== null && hoveredAccountId !== account.id

          return (
            <div
              key={account.id}
              onMouseEnter={() => onHoverAccount(account.id)}
              onMouseLeave={() => onHoverAccount(null)}
              onClick={() => setEditingAccount(account)}
              className={cn(
                "relative overflow-hidden p-4 rounded-2xl flex items-center gap-4 border transition-all duration-500 cursor-pointer group",
                isDimmed
                  ? "bg-zinc-900/40 border-white/5 opacity-40 grayscale-40 scale-95"
                  : "bg-linear-to-br from-zinc-800/80 to-zinc-900/80 border-white/20 opacity-100 shadow-[0_0_20px_rgba(0,0,0,0.3)] scale-100",
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
                  <AnimatedBalance value={account.balance} />
                </div>
              </div>
            </div>
          )
        })}

        {/* Modal para añadir cuenta */}
        {showAddButton && <AccountModal hoveredAccountId={hoveredAccountId} />}
      </div>

      {/* Modal para editar cuenta */}
      {editingAccount && (
        <AccountModal
          account={editingAccount}
          open={true}
          onOpenChange={(open) => { if (!open) setEditingAccount(null) }}
        />
      )}
    </>
  )
}
