"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, Users, Check, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { supabase } from "@/src/lib/supabase"
import {
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/src/lib/notification-actions"
import { useI18n } from "@/src/lib/i18n"
import { cn } from "@/src/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es, enUS } from "date-fns/locale"

const TYPE_ICON: Record<string, React.ReactNode> = {
  group_invite: <Users size={14} className="text-primary" />,
}

export function NotificationBell() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const unread = notifications.filter((n) => !n.read).length

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    setNotifications((data ?? []) as Notification[])
  }

  // Initial load
  useEffect(() => { fetchNotifications() }, [])

  // Realtime: re-fetch on new INSERT
  useEffect(() => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleOpen = (v: boolean) => {
    setOpen(v)
  }

  const handleClick = async (n: Notification) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      )
      supabase.from("notifications").update({ read: true }).eq("id", n.id).then(() => {})
    }
    setOpen(false)
    if (n.type === "group_invite" && n.data.group_id) {
      router.push(`/shared/${n.data.group_id}`)
    }
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      await markAllNotificationsRead()
    })
  }

  const dateLocale = locale === "es" ? es : enUS

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl hover:bg-accent/50"
          aria-label={t("notifications.title")}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="font-semibold text-sm">{t("notifications.title")}</span>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <CheckCheck size={13} />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/30">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
              <Bell size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10 shrink-0">
                  {TYPE_ICON[n.type] ?? <Bell size={14} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-snug", !n.read && "font-semibold")}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: dateLocale })}
                  </p>
                </div>
                {!n.read && (
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
