"use client"

import { useState } from "react"
import { Navbar } from "@/src/components/navbar"
import { useI18n } from "@/src/lib/i18n"
import type { UserCategory } from "@/src/lib/data"
import { CategoryModal } from "./category-modal"
import * as LucideIcons from "lucide-react"
import { Plus, Pencil, Tag } from "lucide-react"
import { Button } from "@/src/components/ui/button"

export function CategoriesShell({ categories }: { categories: UserCategory[] }) {
  const { t } = useI18n()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null)

  const openCreate = () => {
    setEditingCategory(null)
    setModalOpen(true)
  }

  const openEdit = (cat: UserCategory) => {
    setEditingCategory(cat)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-8 justify-center items-center p-4 w-full max-w-7xl mx-auto">
      <Navbar />

      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-start justify-between px-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{t("categoriesPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("categoriesPage.subtitle")}</p>
          </div>
          <Button onClick={openCreate} size="sm" className="rounded-xl gap-1.5 shrink-0 mt-1">
            <Plus size={14} />
            {t("categoriesPage.addCategory")}
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="w-full rounded-2xl border-2 border-dashed border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="p-4 rounded-full bg-muted">
              <Tag size={28} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold">{t("categoriesPage.empty")}</p>
              <p className="text-sm text-muted-foreground max-w-sm">{t("categoriesPage.emptyDescription")}</p>
            </div>
            <Button onClick={openCreate} className="mt-2 rounded-xl px-6 font-semibold">
              <Plus size={14} className="mr-1.5" />
              {t("categoriesPage.addCategory")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon
                ? (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[cat.icon]
                : null
              return (
                <div
                  key={cat.id}
                  className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 transition-all duration-200"
                >
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {Icon
                      ? <Icon size={20} style={{ color: cat.color } as React.CSSProperties} />
                      : <Tag size={20} style={{ color: cat.color } as React.CSSProperties} />
                    }
                  </div>
                  <span className="text-xs font-semibold text-center truncate w-full">{cat.label}</span>
                  <button
                    onClick={() => openEdit(cat)}
                    className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                  >
                    <Pencil size={12} className="text-muted-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
      />
    </div>
  )
}
