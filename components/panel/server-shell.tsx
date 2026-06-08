"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  PlayIcon,
  RotateCwIcon,
  SquareIcon,
  SkullIcon,
  CopyIcon,
  TerminalIcon,
  FolderIcon,
  DatabaseIcon,
  CalendarClockIcon,
  UsersIcon,
  ArchiveIcon,
  NetworkIcon,
  SlidersHorizontalIcon,
  SettingsIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusBadge } from "@/components/panel/status-badge"
import { useServerLive } from "@/components/panel/server-live-provider"
import { useT } from "@/components/i18n-provider"
import type { Server, ServerStatus } from "@/lib/data"

interface Tab {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export function ServerShell({
  server,
  children,
}: {
  server: Server
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useT()
  const { state, setPowerState } = useServerLive()
  const base = `/server/${server.id}`
  // Живой статус из сокета, с откатом на снимок из API.
  const liveStatus: ServerStatus = (state as ServerStatus) || server.status
  const isRunning = liveStatus === "running" || liveStatus === "starting"
  const isOffline = liveStatus === "offline"

  const tabs: Tab[] = [
    { key: "server.tab.console", href: base, icon: TerminalIcon },
    { key: "server.tab.files", href: `${base}/files`, icon: FolderIcon },
    { key: "server.tab.databases", href: `${base}/databases`, icon: DatabaseIcon },
    { key: "server.tab.schedules", href: `${base}/schedules`, icon: CalendarClockIcon },
    { key: "server.tab.users", href: `${base}/users`, icon: UsersIcon },
    { key: "server.tab.backups", href: `${base}/backups`, icon: ArchiveIcon },
    { key: "server.tab.network", href: `${base}/network`, icon: NetworkIcon },
    { key: "server.tab.startup", href: `${base}/startup`, icon: SlidersHorizontalIcon },
    { key: "server.tab.settings", href: `${base}/settings`, icon: SettingsIcon },
  ]

  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname === href || pathname.startsWith(href + "/")
  }

  function copyAddress() {
    navigator.clipboard?.writeText(`${server.address}:${server.port}`)
    toast.success(t("common.copied"), {
      description: `${server.address}:${server.port}`,
    })
  }

  function power(
    signal: "start" | "restart" | "stop" | "kill",
    toastKey: string,
  ) {
    setPowerState(signal)
    toast.success(t("server.power.sent"), { description: t(toastKey) })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {server.name}
            </h1>
            <StatusBadge status={liveStatus} />
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>{server.node}</span>
            <span aria-hidden>·</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyAddress}
                    className="hover:text-foreground inline-flex items-center gap-1 font-mono transition-colors"
                  >
                    {server.address}:{server.port}
                    <CopyIcon className="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t("server.copyAddress")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={isRunning ? "default" : "outline"}
            className="rounded-xl"
            disabled={isRunning}
            onClick={() => power("start", "server.power.startToast")}
          >
            <PlayIcon data-icon="inline-start" className={isRunning ? "" : "text-emerald-500"} />
            {t("server.power.start")}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={isOffline}
            onClick={() => power("restart", "server.power.restartToast")}
          >
            <RotateCwIcon data-icon="inline-start" />
            {t("server.power.restart")}
          </Button>
          <Button
            variant="destructive"
            className={cn("rounded-xl", isOffline && "bg-destructive/20 dark:bg-destructive/30")}
            disabled={isOffline}
            onClick={() => power("stop", "server.power.stopToast")}
          >
            <SquareIcon data-icon="inline-start" />
            {t("server.power.stop")}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-xl"
                  disabled={isOffline}
                  aria-label={t("server.power.kill")}
                  onClick={() => power("kill", "server.power.killToast")}
                >
                  <SkullIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("server.power.kill")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="scrollbar-none w-full overflow-x-auto border-b">
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="size-4" />
                {t(tab.key)}
                {active && (
                  <span className="bg-foreground absolute inset-x-2 bottom-0 h-0.5 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  )
}
