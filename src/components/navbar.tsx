"use client"

import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/src/components/ui/navigation-menu"
import { PiggyBank, UserIcon, Menu, LayoutDashboard, History } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { LanguageSwitcher } from "./language-switcher"
import { TransactionModal } from "./dashboard/transaction-modal"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/src/components/ui/sheet"
import { Button } from "@/src/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu"
import { LogOut, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/src/lib/supabase"
import { useProfile } from "@/src/hooks/useProfile"
import { useI18n } from "@/src/lib/i18n"

export function Navbar() {
  const router = useRouter()
  const { profile, loading } = useProfile()
  const { t } = useI18n()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("Error al salir:", error.message);
    } else {
      // Limpiamos y mandamos al login
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        
        {/* Lado Izquierdo: Logo y Desktop Links */}
        <div className="flex items-center gap-2 md:gap-8">
          {/* Menu Hamburguesa - Solo visible en móvil */}
          <div className="md:hidden">
            <MobileNav />
          </div>

          <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tighter">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <PiggyBank className="h-4 w-4 text-black" fill="black" />
            </div>
            <span className="hidden md:block">FinTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                    {t("navbar.summary")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/transactions" className={navigationMenuTriggerStyle()}>
                    {t("navbar.history")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Lado Derecho: Acciones y Usuario */}
        <div className="flex items-center gap-2 md:gap-4">
          <TransactionModal />
          
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 md:h-10 md:w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all shadow-sm">
          {/* Si profile tiene avatar_url, se muestra aquí */}
          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name} />
          
          {/* Si no hay imagen o está cargando, muestra el icono */}
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
                  <p className="text-sm font-bold leading-none">{profile?.full_name}</p>
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
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const { t } = useI18n()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/50 transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("navbar.openMenu")}</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="bg-background/95 backdrop-blur-xl border-r border-border/40 w-[280px] p-0 flex flex-col"
      >
        {/* Encabezado del Menú */}
        <div className="p-6 pb-2">
          <SheetTitle className="text-left flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-border/50 shadow-sm">
              <PiggyBank className="h-4 w-4 text-black" fill="currentColor" />
            </div>
            <span className="tracking-tighter font-bold text-xl">FinTracker</span>
          </SheetTitle>
        </div>
  
        {/* Cuerpo de Navegación */}
        <div className="flex-1 px-4 mt-4">
          <nav className="flex flex-col gap-1">
            <Link 
              href="/dashboard" 
              className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
            >
              <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/20">
                <LayoutDashboard size={18} />
              </div>
              <span className="font-semibold text-sm">{t("navbar.summary")}</span>
            </Link>
  
            <Link 
              href="/transactions" 
              className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
            >
              <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/20">
                <History size={18} />
              </div>
              <span className="font-semibold text-sm">{t("navbar.history")}</span>
            </Link>
          </nav>
        </div>
  
        {/* Pie de Menú (Configuraciones rápidas) */}
        <div className="p-6 mt-auto border-t border-border/40 bg-accent/5">
          <div className="flex items-center justify-between bg-background/50 p-3 rounded-2xl border border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t("navbar.language")}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}