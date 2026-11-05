"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  PiggyBank, LayoutDashboard, History, Wallet, Target,
  Tags, Repeat, TrendingUp, Users, BarChart2,
} from "lucide-react"
import { useI18n } from "@/src/lib/i18n"
import { useProfile } from "@/src/hooks/useProfile"
import { cn } from "@/src/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { showInvestments } = useProfile()


  const navItems = [
    { href: "/dashboard",    label: t("navbar.summary"),    Icon: LayoutDashboard },
    { href: "/transactions", label: t("navbar.history"),    Icon: History },
    { href: "/budgets",      label: t("navbar.budgets"),    Icon: Wallet },
    { href: "/goals",        label: t("navbar.goals"),      Icon: Target },
    { href: "/reports",      label: t("navbar.reports"),    Icon: BarChart2 },
    { href: "/categories",   label: t("navbar.categories"), Icon: Tags },
    { href: "/recurring",    label: t("navbar.recurring"),  Icon: Repeat },
    ...(showInvestments ? [{ href: "/investments", label: t("navbar.investments"), Icon: TrendingUp }] : []),
    { href: "/shared",       label: t("navbar.shared"),     Icon: Users },
  ]

  return (
    <aside
      className={cn(
        // base
        "group/sidebar fixed left-0 top-0 z-40 h-screen flex-col overflow-hidden",
        // collapsed → expanded on hover
        "w-[60px] hover:w-[224px]",
        "transition-[width] duration-200 ease-in-out",
        // style
        "bg-background/95 backdrop-blur-xl border-r border-border/40",
        // hide on mobile — mobile uses the topbar hamburger sheet
        "hidden md:flex",
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-[18px] border-b border-border/40 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center">
            <PiggyBank className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className={cn(
            "font-aeonik-bold text-lg tracking-tighter whitespace-nowrap",
            "opacity-0 group-hover/sidebar:opacity-100",
            "transition-opacity duration-150 delay-75",
          )}>
            FlowX
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={cn(
                "text-sm font-medium",
                "opacity-0 group-hover/sidebar:opacity-100",
                "transition-opacity duration-150 delay-75",
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}
