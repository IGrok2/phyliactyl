"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  SearchIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  BellIcon,
  GlobeIcon,
  TerminalIcon,
  MonitorIcon,
} from "lucide-react"

import { bff } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ActivityEntry } from "@/lib/data"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useT } from "@/components/i18n-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Account {
  username: string
  email: string
  admin: boolean
}

export function PanelHeader() {
  const router = useRouter()
  const { t } = useT()
  const [account, setAccount] = React.useState<Account | null>(null)
  const [activity, setActivity] = React.useState<ActivityEntry[]>([])
  const [activityLoaded, setActivityLoaded] = React.useState(false)
  const [seen, setSeen] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.account) setAccount(d.account)
      })
      .catch(() => {})

    // Метка "прочитано" хранится локально (мс).
    const stored = Number(localStorage.getItem("nebula-activity-seen") || "0")
    setSeen(stored)
    // Загружаем активность сразу, чтобы показать индикатор непрочитанного.
    bff<ActivityEntry[]>("/account/activity").then((res) => {
      if (res.data) setActivity(res.data.slice(0, 10))
      setActivityLoaded(true)
    })
  }, [])

  function loadActivity() {
    bff<ActivityEntry[]>("/account/activity").then((res) => {
      if (res.data) setActivity(res.data.slice(0, 10))
      setActivityLoaded(true)
    })
  }

  const ts = (a: ActivityEntry) => (a.timestamp ? new Date(a.timestamp).getTime() : 0)
  const unread = activity.filter((a) => ts(a) > seen).length

  function markAllRead() {
    const newest = activity.reduce((m, a) => Math.max(m, ts(a)), 0)
    const value = newest || Date.now()
    localStorage.setItem("nebula-activity-seen", String(value))
    setSeen(value)
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    toast.success(t("common.logout"))
    router.replace("/login")
  }

  const initials = (account?.username ?? "??").slice(0, 2).toUpperCase()

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 !h-5" />

      <div className="relative hidden max-w-xs flex-1 sm:block">
        <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input placeholder={t("common.search")} className="h-8 rounded-xl pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu onOpenChange={(o) => { if (o && !activityLoaded) loadActivity() }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("activity.title")} className="relative">
              <BellIcon />
              {unread > 0 && (
                <span className="bg-emerald-500 absolute right-1.5 top-1.5 flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              {t("activity.recent")}
              {unread > 0 ? (
                <button onClick={markAllRead} className="text-muted-foreground hover:text-foreground text-xs font-normal">
                  {t("activity.markRead")}
                </button>
              ) : (
                <Link href="/account" className="text-muted-foreground hover:text-foreground text-xs font-normal">
                  {t("activity.viewAll")}
                </Link>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!activityLoaded ? (
              <div className="text-muted-foreground px-2 py-6 text-center text-sm">{t("common.loading")}</div>
            ) : activity.length === 0 ? (
              <div className="text-muted-foreground px-2 py-6 text-center text-sm">{t("activity.empty")}</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {activity.map((a) => {
                  const failed = /fail|failed|denied|error/i.test(a.event)
                  const isUnread = ts(a) > seen
                  return (
                    <div key={a.id} className={cn("flex items-start gap-2 px-2 py-2 text-sm", isUnread && "bg-muted/40")}>
                      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", failed ? "bg-destructive" : isUnread ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">{a.event}</p>
                        <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-1">
                            {a.isApi ? <TerminalIcon className="size-2.5" /> : <MonitorIcon className="size-2.5" />}
                            {a.isApi ? "API" : t("activity.web")}
                          </span>
                          <span className="flex items-center gap-1">
                            <GlobeIcon className="size-2.5" />
                            {a.ip ?? "—"}
                          </span>
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                        {a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-7">
                <AvatarFallback className="bg-foreground text-background text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{account?.username ?? "—"}</span>
              <span className="text-muted-foreground text-xs font-normal">
                {account?.email ?? ""}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <UserIcon />
                {t("common.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/api">
                <SettingsIcon />
                {t("common.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOutIcon />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
