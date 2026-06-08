"use client"

import Link from "next/link"
import {
  CpuIcon,
  MemoryStickIcon,
  HardDriveIcon,
  UsersIcon,
  TerminalIcon,
  ClockIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/panel/status-badge"
import { useT } from "@/components/i18n-provider"
import { formatMB, formatUptime, type Server } from "@/lib/data"

function Meter({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="text-foreground font-medium tabular-nums">{hint}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  )
}

export function ServerCard({ server }: { server: Server }) {
  const { t } = useT()
  const memPct = server.usage.memoryLimit
    ? (server.usage.memoryUsed / server.usage.memoryLimit) * 100
    : 0
  const diskPct = server.usage.diskLimit
    ? (server.usage.diskUsed / server.usage.diskLimit) * 100
    : 0
  const isRunning = server.status === "running"

  return (
    <Card className="group hover:border-foreground/20 gap-0 overflow-hidden rounded-2xl p-0 transition-all duration-300 hover:shadow-lg">
      <Link href={`/server/${server.id}`} className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  isRunning ? "bg-emerald-500" : "bg-neutral-500",
                  isRunning && "animate-pulse",
                )}
              />
              <h3 className="group-hover:text-foreground truncate font-semibold transition-colors">
                {server.name}
              </h3>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {server.address}:{server.port}
            </p>
          </div>
          <StatusBadge status={server.status} className="shrink-0" />
        </div>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <CpuIcon className="size-3.5" />
            {server.node}
          </span>
          {server.players.max > 0 && (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3.5" />
              {server.players.online}/{server.players.max}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {formatUptime(server.uptime)}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <Meter
            icon={CpuIcon}
            label={t("console.cpu")}
            value={Math.min(server.usage.cpu, 100)}
            hint={`${server.usage.cpu}%`}
          />
          <Meter
            icon={MemoryStickIcon}
            label={t("console.memory")}
            value={memPct}
            hint={`${formatMB(server.usage.memoryUsed)} / ${formatMB(server.usage.memoryLimit)}`}
          />
          <Meter
            icon={HardDriveIcon}
            label={t("console.disk")}
            value={diskPct}
            hint={`${formatMB(server.usage.diskUsed)} / ${formatMB(server.usage.diskLimit)}`}
          />
        </div>
      </Link>

      <div className="border-t p-3">
        <Button asChild variant="secondary" className="w-full rounded-xl">
          <Link href={`/server/${server.id}`}>
            <TerminalIcon data-icon="inline-start" />
            {t("servers.openConsole")}
          </Link>
        </Button>
      </div>
    </Card>
  )
}
