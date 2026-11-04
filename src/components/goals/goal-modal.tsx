"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { ResponsiveModal } from "@/src/components/ui/responsive-modal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/src/components/ui/alert-dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { AmountInput } from "@/src/components/ui/amount-input"
import { Label } from "@/src/components/ui/label"
import { useI18n } from "@/src/lib/i18n"
import { createGoal, updateGoal, deleteGoal } from "@/src/lib/actions"
import * as LucideIcons from "lucide-react"
import { Trash2, Loader2, Target } from "lucide-react"
import { IconPicker } from "@/src/components/ui/icon-picker"
import type { SavingsGoal } from "@/src/lib/data"

function ModalIcon({ icon }: { icon: string }) {
  const LucideIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[icon]
  if (LucideIcon) return <LucideIcon size={18} />
  return <Target size={18} />
}

const goalSchema = z.object({
  name: z.string().min(2),
  target_amount: z.string().min(1),
  deadline: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

type FormData = z.infer<typeof goalSchema>

export function GoalModal({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: SavingsGoal
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [icon, setIcon] = useState(goal?.icon || 'Target')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      target_amount: "",
      deadline: "",
      icon: "Target",
    },
  })

  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          target_amount: goal.target_amount.toString(),
          deadline: goal.deadline || "",
          icon: goal.icon || "🎯",
        })
        setIcon(goal.icon || 'Target')
      } else {
        reset({
          name: "",
          target_amount: "",
          deadline: "",
          icon: "Target",
        })
        setIcon("Target")
      }
    }
  }, [open, goal, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setSubmitError(null)
    data.icon = icon

    const res = goal
      ? await updateGoal(goal.id, data)
      : await createGoal(data)

    setLoading(false)

    if (res.error) {
      setSubmitError(res.error === 'rate_limited' ? t('rateLimit.tooManyRequests') : res.error)
    } else {
      onOpenChange(false)
    }
  }

  const handleDelete = async () => {
    if (!goal) return
    setDeleting(true)
    const res = await deleteGoal(goal.id)
    setDeleting(false)

    if (!res.error) {
      onOpenChange(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}
      title={
        <span className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary"><ModalIcon icon={icon} /></span>
          {goal ? t("goals.editGoal") : t("goals.addGoal")}
        </span>
      }
      className="sm:max-w-[425px]"
    >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-4">

            <div className="flex gap-4 items-end">
              <div className="flex flex-col gap-2">
                <Label>{t("goals.iconLabel")}</Label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="name">{t("goals.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("goals.namePlaceholder")}
                  {...register("name")}
                  className="rounded-xl bg-muted/50"
                />
                {errors.name && <span className="text-xs text-rose-500">{errors.name.message}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="target_amount">{t("goals.targetLabel")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Controller
                  name="target_amount"
                  control={control}
                  render={({ field }) => (
                    <AmountInput
                      id="target_amount"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="pl-7 rounded-xl bg-muted/50 font-medium"
                    />
                  )}
                />
              </div>
              {errors.target_amount && <span className="text-xs text-rose-500">{errors.target_amount.message}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="deadline">{t("goals.deadlineLabel")}</Label>
              <Input
                id="deadline"
                type="date"
                {...register("deadline")}
                className="rounded-xl bg-muted/50"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-rose-500 text-center">{submitError}</p>
          )}

          <DialogFooter className="mt-6 flex sm:justify-between items-center gap-2 border-t border-border/40 pt-4">
            {goal ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmOpen(true)}
                  disabled={loading || deleting}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-4 rounded-xl"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </Button>
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("goals.deleteGoal")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("goals.deleteGoalDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        className="rounded-xl"
                        onClick={handleDelete}
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl min-w-[100px]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : t("goals.saveGoal")}
              </Button>
            </div>
          </DialogFooter>
        </form>
    </ResponsiveModal>
  )
}
