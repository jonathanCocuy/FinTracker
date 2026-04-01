"use client"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/src/components/ui/navigation-menu"
import { PiggyBank, UserIcon, Menu } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { LanguageSwitcher } from "./language-switcher"
import { TransactionModal } from "./dashboard/transaction-modal"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/src/components/ui/sheet"
import { Button } from "@/src/components/ui/button"

export function Navbar() {
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
            <span className="hidden sm:block">FinTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                    Resumen
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/transactions" className={navigationMenuTriggerStyle()}>
                    Historial
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

          <Avatar className="h-8 w-8 md:h-10 md:w-10">
            <AvatarImage />
            <AvatarFallback>
              <UserIcon className="h-4 w-4 cursor-pointer" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-background/95 backdrop-blur-lg border-r border-border/40 w-[250px]">
        <SheetTitle className="text-left">Navegación</SheetTitle>
        <div className="flex flex-col gap-4 mt-8">
          <Link href="/dashboard" className="text-lg font-semibold hover:text-primary transition-colors">
            Resumen
          </Link>
          <Link href="/transactions" className="text-lg font-semibold hover:text-primary transition-colors">
            Historial
          </Link>
          <hr className="border-border/40" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Idioma</span>
            <LanguageSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}