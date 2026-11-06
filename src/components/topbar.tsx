"use client"

import { PiggyBank, Menu, UserIcon, Loader2, LogOut, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Button } from "@/src/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/src/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { TransactionModal } from "./dashboard/transaction-modal"
import { NotificationBell } from "./notification-bell"
import { ThemeToggle } from "./theme-toggle"
import { LanguageSwitcher } from "./language-switcher"
import {
  LayoutDashboard, History, Wallet, Target,
  Tags, Repeat, TrendingUp, Users, BarChart2,
} from "lucide-react"
import { useProfile } from "@/src/hooks/useProfile"
import { useI18n } from "@/src/lib/i18n"
import { usePathname } from "next/navigation"
import { supabase } from "@/src/lib/supabase"
import { cn } from "@/src/lib/utils"

export function Topbar() {
  const { profile, loading, showInvestments } = useProfile()
  const { t } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border/40 bg-background/60 backdrop-blur-xl flex items-center px-4 gap-3">
      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileSheet showInvestments={showInvestments} />
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
            <PiggyBank className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-aeonik-bold text-lg tracking-tighter">FlowX</span>
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions — always visible */}
      <TransactionModal />

      <NotificationBell />

      {/* Theme + Language — hidden on mobile (accessible from sidebar / mobile sheet) */}
      <div className="hidden md:flex items-center gap-0.5">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name} />
            <AvatarFallback className="bg-secondary">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 bg-background/95 backdrop-blur-xl border-border/40 rounded-xl shadow-xl">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-bold leading-none font-aeonik-bold">{profile?.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/40" />
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg m-1">
            <Link href="/profile" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{t("navbar.profile")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/40" />
          <DropdownMenuItem className="cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 rounded-lg m-1">
            <LogOut className="mr-2 h-4 w-4" />
            <button onClick={handleLogout}>{t("navbar.logout")}</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function MobileSheet({ showInvestments }: { showInvestments: boolean }) {
  const { t } = useI18n()
  const pathname = usePathname()

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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("navbar.openMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-background/95 backdrop-blur-xl border-r border-border/40 w-[260px] p-0 flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>
        <div className="p-5 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-aeonik-bold text-xl tracking-tighter">FlowX</span>
          </SheetTitle>
        </div>
        <nav className="flex-1 px-3 mt-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
            {t("theme.light")} / {t("theme.dark")}
          </span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
