"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useI18n } from "@/src/lib/i18n"
import { createSharedGroup, updateSharedGroup, deleteSharedGroup, checkEmailExists } from "@/src/lib/shared-actions"
import { Plus, Trash2, Loader2, Users, Mail, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import type { SharedGroup } from "@/src/lib/shared-data"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/src/components/ui/alert-dialog"

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const schema = z.object({
  name: z.string().min(1),
  members: z.array(z.object({
    name: z.string().min(1),
    share_pct: z.number().min(1).max(100),
    is_me: z.boolean(),
    color: z.string(),
    invited_email: z.string().email().optional().nullable(),
  })).min(2),
})

type FormData = z.infer<typeof schema>

export function GroupModal({
  open,
  onOpenChange,
  group,
  myFullName = '',
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  group?: SharedGroup
  myFullName?: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Per-member email check: 'found' | 'not_found' | 'checking' | null
  const [emailStatus, setEmailStatus] = useState<Record<number, 'found' | 'not_found' | 'checking' | null>>({})

  const handleEmailBlur = async (index: number, email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus(s => ({ ...s, [index]: null }))
      return
    }
    setEmailStatus(s => ({ ...s, [index]: 'checking' }))
    const exists = await checkEmailExists(email)
    setEmailStatus(s => ({ ...s, [index]: exists ? 'found' : 'not_found' }))
  }

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: group
      ? { name: group.name, members: group.members.map(m => ({ name: m.name, share_pct: m.share_pct, is_me: m.is_me, color: m.color, invited_email: m.invited_email })) }
      : {
          name: '',
          members: [
            { name: myFullName, share_pct: 50, is_me: true, color: COLORS[0] },
            { name: '', share_pct: 50, is_me: false, color: COLORS[1] },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'members' })
  const members = watch('members')
  const totalPct = members.reduce((s, m) => s + (Number(m.share_pct) || 0), 0)

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setSubmitError(null)

    const res = group
      ? await updateSharedGroup(group.id, data)
      : await createSharedGroup(data)

    setLoading(false)

    if ('error' in res && res.error) {
      setSubmitError(res.error === 'shares_not_100' ? t('shared.totalMustBe100') : res.error)
      return
    }

    onOpenChange(false)
    if (!group && 'id' in res && res.id) router.push(`/shared/${res.id}`)
  }

  const handleDelete = async () => {
    if (!group) return
    setDeleting(true)
    await deleteSharedGroup(group.id)
    setDeleting(false)
    onOpenChange(false)
    router.push('/shared')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setSubmitError(null); onOpenChange(v) }}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Users size={18} />
                </div>
                {group ? t('shared.editGroup') : t('shared.newGroup')}
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>{t('shared.groupName')}</Label>
              <Input
                {...register('name')}
                placeholder={t('shared.groupNamePlaceholder')}
                className="rounded-xl bg-muted/50"
              />
              {errors.name && <span className="text-xs text-rose-500">{t('shared.groupName')} {t('validation.descriptionRequired').toLowerCase()}</span>}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>{t('shared.members')}</Label>
                <span className={`text-xs font-medium ${Math.abs(totalPct - 100) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {totalPct.toFixed(0)}% / 100%
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {fields.map((field, i) => {
                  const isMe = members[i]?.is_me
                  const memberData = group?.members[i]
                  const isPending = !isMe && memberData?.invited_email && !memberData?.member_user_id
                  return (
                    <div key={field.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/40 border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <Input
                          {...register(`members.${i}.name`)}
                          placeholder={t('shared.memberName')}
                          className="flex-1 h-8 text-sm rounded-lg bg-background/60 border-border/40"
                        />
                        <input type="hidden" {...register(`members.${i}.color`)} value={COLORS[i % COLORS.length]} />
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            {...register(`members.${i}.share_pct`, { valueAsNumber: true })}
                            className="w-16 h-8 text-sm rounded-lg bg-background/60 border-border/40 text-center"
                            min={1}
                            max={99}
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              fields.forEach((_, j) => {
                                setValue(`members.${j}.is_me`, j === i)
                              })
                            }}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isMe ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50 text-muted-foreground hover:border-primary/50'}`}
                            title={t('shared.isMe')}
                          >
                            {t('shared.isMe')}
                          </button>
                        </div>
                        {fields.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500" onClick={() => remove(i)}>
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                      {!isMe && (
                        <div className="flex flex-col gap-1 pl-5">
                          <div className="flex items-center gap-2">
                            <Mail size={12} className="text-muted-foreground shrink-0" />
                            <Input
                              {...register(`members.${i}.invited_email`)}
                              type="email"
                              placeholder={t('shared.inviteByEmail')}
                              className="h-7 text-xs rounded-lg bg-background/60 border-border/40"
                              onBlur={e => handleEmailBlur(i, e.target.value)}
                            />
                            {isPending && (
                              <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                                <Clock size={11} />
                                {t('shared.pendingInvite')}
                              </span>
                            )}
                          </div>
                          {emailStatus[i] === 'checking' && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground pl-4">
                              <Loader2 size={11} className="animate-spin" />
                              {t('shared.checkingEmail')}
                            </span>
                          )}
                          {emailStatus[i] === 'found' && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500 pl-4">
                              <CheckCircle2 size={11} />
                              {t('shared.emailFound')}
                            </span>
                          )}
                          {emailStatus[i] === 'not_found' && (
                            <span className="flex items-center gap-1 text-xs text-amber-500 pl-4">
                              <AlertCircle size={11} />
                              {t('shared.emailNotFound')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {fields.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl self-start"
                  onClick={() => append({ name: '', share_pct: 0, is_me: false, color: COLORS[fields.length % COLORS.length] })}
                >
                  <Plus size={14} className="mr-1" />
                  {t('shared.addMember')}
                </Button>
              )}

              {submitError && <p className="text-xs text-rose-500">{submitError}</p>}
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 flex sm:justify-between items-center gap-2">
              {group ? (
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(true)} disabled={loading || deleting}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl px-3">
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">{t('common.cancel')}</Button>
                <Button type="submit" disabled={loading || Math.abs(totalPct - 100) > 0.01} className="rounded-xl min-w-[100px]">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : group ? t('shared.saveChanges') : t('shared.createGroup')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shared.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>{t('shared.deleteGroupDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" className="rounded-xl" onClick={handleDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
