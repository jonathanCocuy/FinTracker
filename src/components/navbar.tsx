"use client"

import { PiggyBank, UserIcon, Menu, LayoutDashboard, History, Wallet, Target, Tags, Repeat, TrendingUp, Users, BarChart2, ChevronDown, Plus, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { TransactionModal } from "./dashboard/transaction-modal"
import { NotificationBell } from "./notification-bell"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/src/components/ui/sheet"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { LogOut, User, Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { useProfile } from "@/src/hooks/useProfile"
import { logout } from "@/src/lib/actions"
import { useI18n } from "@/src/lib/i18n"
import { cn } from "@/src/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const { profile, loading, showInvestments } = useProfile()
  const { t } = useI18n()

  const handleLogout = async () => {
    await logout()
  }

  // Primary links — always visible on desktop
  const primaryLinks = [
    { href: "/dashboard",    label: t("navbar.summary") },
    { href: "/transactions", label: t("navbar.history") },
    { href: "/budgets",      label: t("navbar.budgets") },
    { href: "/goals",        label: t("navbar.goals") },
    { href: "/reports",      label: t("navbar.reports") },
  ]

  // Secondary links — collapsed into "More" dropdown on desktop
  const secondaryLinks = [
    { href: "/categories", label: t("navbar.categories"), Icon: Tags },
    { href: "/recurring",  label: t("navbar.recurring"),  Icon: Repeat },
    ...(showInvestments ? [{ href: "/investments", label: t("navbar.investments"), Icon: TrendingUp }] : []),
    { href: "/shared",     label: t("navbar.shared"),     Icon: Users },
  ]

  const isSecondaryActive = secondaryLinks.some(l => pathname.startsWith(l.href))

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 max-w-screen-2xl mx-auto">

        {/* Left: logo + hamburger (mobile) or primary links (desktop) */}
        <div className="flex items-center gap-6">
          {/* Hamburger — mobile only */}
          <div className="md:hidden">
            <MobileNav showInvestments={showInvestments} />
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-aeonik-bold text-lg tracking-tighter hidden sm:block">FlowX</span>
          </Link>

          {/* Desktop primary nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {primaryLinks.map(({ href, label }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  {label}
                </Link>
              )
            })}

            {/* "More" dropdown for secondary links */}
            {secondaryLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      isSecondaryActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Más</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-xl">
                  {secondaryLinks.map(({ href, label, Icon }) => {
                    const isActive = pathname.startsWith(href)
                    return (
                      <DropdownMenuItem key={href} asChild>
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer rounded-lg",
                            isActive && "text-primary bg-primary/10"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        {/* Right: actions + user */}
        <div className="flex items-center gap-1.5">
          {/* Full label on lg+, icon-only below */}
          <div className="hidden lg:flex">
            <TransactionModal />
          </div>
          <div className="flex lg:hidden">
            <TransactionModal iconOnly />
          </div>

          <NotificationBell />

          <div className="hidden md:flex items-center gap-0.5">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ml-1">
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
                  <p className="text-xs leading-none text-muted-foreground font-aeonik-light">{profile?.email}</p>
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
        </div>
      </div>
    </header>
  )
}

function MobileNav({ showInvestments }: { showInvestments: boolean }) {
  const { t } = useI18n()
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard",    label: t("navbar.summary"),     Icon: LayoutDashboard },
    { href: "/transactions", label: t("navbar.history"),     Icon: History },
    { href: "/budgets",      label: t("navbar.budgets"),     Icon: Wallet },
    { href: "/goals",        label: t("navbar.goals"),       Icon: Target },
    { href: "/reports",      label: t("navbar.reports"),     Icon: BarChart2 },
    { href: "/categories",   label: t("navbar.categories"),  Icon: Tags },
    { href: "/recurring",    label: t("navbar.recurring"),   Icon: Repeat },
    ...(showInvestments ? [{ href: "/investments", label: t("navbar.investments"), Icon: TrendingUp }] : []),
    { href: "/shared",       label: t("navbar.shared"),      Icon: Users },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-accent/50">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("navbar.openMenu")}</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="bg-background/95 backdrop-blur-xl border-r border-border/40 w-[260px] p-0 flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>

        <div className="p-5 pb-2">
          <SheetTitle className="text-left flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="tracking-tighter font-aeonik-bold text-xl">FlowX</span>
          </SheetTitle>
        </div>

        <div className="flex-1 px-3 mt-3 overflow-y-auto">
          <nav className="flex flex-col gap-0.5">
            {navItems.map(({ href, label, Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60 font-aeonik-bold uppercase tracking-wider">
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
