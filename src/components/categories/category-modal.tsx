"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/src/components/ui/form"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { createCategory, updateCategory, deleteCategory } from "@/src/lib/actions"
import { useI18n } from "@/src/lib/i18n"
import type { UserCategory } from "@/src/lib/data"
import { IconPicker } from "@/src/components/ui/icon-picker"
import { Trash2 } from "lucide-react"
import { cn } from "@/src/lib/utils"

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#fbbf24', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#78716c', '#6b7280', '#0ea5e9',
]

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: UserCategory | null
}

export function CategoryModal({ open, onOpenChange, category }: CategoryModalProps) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!category

  const schema = z.object({
    label: z.string().min(1),
    color: z.string().min(1),
    icon: z.string().min(1),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', color: '#6b7280', icon: 'Tag' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        label: category?.label ?? '',
        color: category?.color ?? '#6b7280',
        icon: category?.icon ?? 'Tag',
      })
      setServerError(null)
      setConfirmDelete(false)
    }
  }, [open, category]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true)
    setServerError(null)

    let result: { success?: true; error?: string }
    if (isEditing && category) {
      result = await updateCategory(category.id, values)
    } else {
      const slug = values.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') || 'cat'
      result = await createCategory({ name: `${slug}_${Date.now().toString(36)}`, ...values })
    }

    setSaving(false)
    if (result.error) { setServerError(result.error); return }
    onOpenChange(false)
  }

  async function onDelete() {
    if (!category) return
    setDeleting(true)
    const result = await deleteCategory(category.id)
    setDeleting(false)
    if (result.error) { setServerError(result.error); return }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] rounded-2xl bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEditing ? t("categoriesPage.editCategory") : t("categoriesPage.addCategory")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("categoriesPage.labelLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("categoriesPage.labelPlaceholder")}
                      className="rounded-xl border-border/40 bg-muted/30 text-sm h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("categoriesPage.colorLabel")}
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-all",
                            field.value === color
                              ? "border-foreground scale-110"
                              : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("categoriesPage.iconLabel")}
                  </FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-xs text-rose-500 text-center">{serverError}</p>
            )}

            <Button
              type="submit"
              disabled={saving || deleting}
              className="w-full rounded-xl font-semibold"
            >
              {saving
                ? t("common.saving")
                : isEditing
                  ? t("categoriesPage.saveChanges")
                  : t("categoriesPage.save")}
            </Button>

            {isEditing && (
              confirmDelete ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleting}
                    onClick={onDelete}
                    className="flex-1 rounded-xl text-sm font-semibold"
                  >
                    {deleting ? t("common.deleting") : t("common.delete")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-xl text-sm"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving || deleting}
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-xl text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} className="mr-2" />
                  {t("categoriesPage.deleteCategory")}
                </Button>
              )
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
