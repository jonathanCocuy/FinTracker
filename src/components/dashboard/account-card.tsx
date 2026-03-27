// components/dashboard/AccountGrid.tsx
import { Wallet, Landmark, Banknote, Plus } from "lucide-react"
import { useI18n } from "@/src/lib/i18n"

interface Account {
  id: string
  name: string
  balance: number
  color: string
}

interface AccountGridProps {
  accounts: Account[]
}

export function AccountGrid({ accounts }: AccountGridProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
      {accounts.map((account) => (
        <div 
          key={account.id} 
          className="bg-card border border-border/50 p-4 rounded-xl flex items-center gap-4 hover:bg-accent/5 transition-all cursor-pointer group"
        >
          {/* Icono con el color dinámico */}
          <div className={`p-2 rounded-lg shrink-0 ${account.color} shadow-lg shadow-black/20`}>
            <Wallet size={15} className="text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              {account.name}
            </span>
            <span className="text-md font-bold tabular-nums tracking-tight text-foreground">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              }).format(account.balance)}
            </span>
          </div>
        </div>
      ))}

      {/* Botón de acción rápida para añadir cuenta */}
      <button className="border-2 border-dashed border-border/30 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group">
        <Plus size={15} className="group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium">{t("accountsCard.addAccount")}</span>
      </button>
    </div>
  )
}