"use client"

import * as React from "react"
import {
  CpuIcon,
  MemoryStickIcon,
  HardDriveIcon,
  ActivityIcon,
  ChevronRightIcon,
  SendIcon,
  FileTextIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApiData, apiSend } from "@/lib/api"
import { useServerLive } from "@/components/panel/server-live-provider"
import { useT } from "@/components/i18n-provider"
import { Sparkline } from "@/components/panel/sparkline"
import { formatMB, type Server } from "@/lib/data"

const B_TO_MB = 1024 * 1024
const HISTORY = 40

// Удаляем ANSI-escape последовательности (цвета/курсор), которые Wings
// присылает в консоль, иначе они выглядят как мусор.
const ANSI_RE = new RegExp(String.fromCharCode(27) + "\\[[0-9;?]*[A-Za-z]", "g")
function cleanLine(raw: string): string {
  return raw.replace(ANSI_RE, "").replace(/\r/g, "")
}

const DAEMON_PREFIX = "[Pterodactyl Daemon]"

function ConsoleLine({ raw }: { raw: string }) {
  const line = cleanLine(raw)
  const isDaemon = line.includes(DAEMON_PREFIX)

  if (isDaemon) {
    // Красиво оформляем строки демона: метка + текст.
    const text = line.split(DAEMON_PREFIX).pop()?.replace(/^:\s*/, "") ?? line
    return (
      <div className="hover:bg-white/5 -mx-1 flex items-start gap-2 whitespace-pre-wrap break-words px-1 py-0.5">
        <span className="mt-px shrink-0 rounded bg-sky-500/15 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
          daemon
        </span>
        <span className="text-sky-200/90">{text}</span>
      </div>
    )
  }

  // Подсветка уровней логов.
  const lower = line.toLowerCase()
  const cls = /\b(error|fatal|exception|failed)\b/.test(lower)
    ? "text-red-300"
    : /\b(warn|warning)\b/.test(lower)
      ? "text-amber-200"
      : "text-neutral-300"

  return (
    <div className={cn("hover:bg-white/5 -mx-1 whitespace-pre-wrap break-words px-1", cls)}>
      {line || "\u00a0"}
    </div>
  )
}

function ResourceCard({
  icon: Icon,
  label,
  value,
  sub,
  pct,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  pct?: number
}) {
  return (
    <Card className="gap-2 rounded-2xl p-4">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {label}
        </span>
        {sub && <span className="tabular-nums">{sub}</span>}
      </div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {pct !== undefined && <Progress value={Math.min(pct, 100)} className="h-1.5" />}
    </Card>
  )
}

export function ConsoleView({ serverId }: { serverId: string }) {
  const { t } = useT()
  const { data: server } = useApiData<Server | undefined>(
    `/servers/${serverId}`,
    undefined,
  )
  const { lines, stats, live, connected, sendCommand, setPowerState } = useServerLive()

  const [command, setCommand] = React.useState("")
  const wrapRef = React.useRef<HTMLDivElement>(null)

  // Авто-обнаружение запроса согласия с EULA (Minecraft).
  const [eulaOpen, setEulaOpen] = React.useState(false)
  const [eulaDone, setEulaDone] = React.useState(false)
  const [accepting, setAccepting] = React.useState(false)

  React.useEffect(() => {
    if (eulaDone || eulaOpen) return
    const hit = lines.some((l) => /agree to the eula|eula\.txt/i.test(l))
    if (hit) setEulaOpen(true)
  }, [lines, eulaDone, eulaOpen])

  async function acceptEula() {
    setAccepting(true)
    const res = await apiSend(`/servers/${serverId}/files/write`, "POST", {
      file: "/eula.txt",
      content: "eula=true\n",
    })
    setAccepting(false)
    if (res.error) {
      toast.error(t("eula.error"), { description: res.error })
      return
    }
    setEulaDone(true)
    setEulaOpen(false)
    toast.success(t("eula.accepted"))
    // Перезапускаем сервер, чтобы запуск продолжился.
    setPowerState("restart")
  }

  // История для графиков
  const [cpuHist, setCpuHist] = React.useState<number[]>([])
  const [netInHist, setNetInHist] = React.useState<number[]>([])
  const [netOutHist, setNetOutHist] = React.useState<number[]>([])
  const lastRx = React.useRef<number | null>(null)
  const lastTx = React.useRef<number | null>(null)

  React.useEffect(() => {
    const el = wrapRef.current?.querySelector<HTMLElement>(
      "[data-slot=scroll-area-viewport]",
    )
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  React.useEffect(() => {
    if (!stats) return
    const push = (arr: number[], v: number) =>
      [...arr, v].slice(-HISTORY)
    setCpuHist((a) => push(a, Math.max(0, stats.cpu)))
    const dRx = lastRx.current === null ? 0 : Math.max(0, stats.netRx - lastRx.current)
    const dTx = lastTx.current === null ? 0 : Math.max(0, stats.netTx - lastTx.current)
    lastRx.current = stats.netRx
    lastTx.current = stats.netTx
    setNetInHist((a) => push(a, dRx / 1024))
    setNetOutHist((a) => push(a, dTx / 1024))
  }, [stats])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const cmd = command.trim()
    if (!cmd) return
    sendCommand(cmd)
    setCommand("")
  }

  const cpu = stats ? Math.round(stats.cpu) : (server?.usage.cpu ?? 0)
  const memUsed = stats ? stats.memoryBytes / B_TO_MB : (server?.usage.memoryUsed ?? 0)
  const memLimit = server?.usage.memoryLimit ?? 0
  const diskUsed = stats ? stats.diskBytes / B_TO_MB : (server?.usage.diskUsed ?? 0)
  const diskLimit = server?.usage.diskLimit ?? 0
  const netIn = netInHist.length ? Math.round(netInHist[netInHist.length - 1]) : (server?.usage.netIn ?? 0)
  const netOut = netOutHist.length ? Math.round(netOutHist[netOutHist.length - 1]) : (server?.usage.netOut ?? 0)

  const memPct = memLimit ? (memUsed / memLimit) * 100 : 0
  const diskPct = diskLimit ? (diskUsed / diskLimit) * 100 : 0
  const running = (stats?.state ?? server?.status) === "running"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResourceCard icon={CpuIcon} label={t("console.cpu")} value={`${cpu}%`} sub={t("console.limit", { value: `${server?.cpuLimit ?? 0}%` })} pct={cpu} />
        <ResourceCard icon={MemoryStickIcon} label={t("console.memory")} value={formatMB(Math.round(memUsed))} sub={`/ ${formatMB(memLimit)}`} pct={memPct} />
        <ResourceCard icon={HardDriveIcon} label={t("console.disk")} value={formatMB(Math.round(diskUsed))} sub={`/ ${formatMB(diskLimit)}`} pct={diskPct} />
        <ResourceCard icon={ActivityIcon} label={t("console.network")} value={`${netIn} KB/s`} sub={`↑ ${netOut} KB/s`} />
      </div>

      <Card className="overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={cn("size-2 rounded-full", running ? "bg-emerald-500 animate-pulse" : "bg-neutral-500")} />
            {t("console.title")}
          </span>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className={cn("size-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-amber-500")} />
            {connected ? t("console.live") : t("console.connecting")}
          </Badge>
        </div>

        <div ref={wrapRef}>
          <ScrollArea className="h-[380px] bg-[oklch(0.12_0_0)]">
            <div className="font-mono p-4 text-xs leading-relaxed text-neutral-300">
              {lines.length === 0 && (
                <div className="text-neutral-500">{t("console.waiting")}</div>
              )}
              {lines.map((line, i) => (
                <ConsoleLine key={i} raw={line} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
          <div className="relative flex-1">
            <ChevronRightIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
            <Input value={command} onChange={(e) => setCommand(e.target.value)} placeholder={t("console.placeholder")} className="rounded-xl pl-8 font-mono" />
          </div>
          <Button type="submit" className="rounded-xl">
            <SendIcon data-icon="inline-start" />
            {t("console.send")}
          </Button>
        </form>
      </Card>

      {/* Живые графики под консолью */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="gap-2 rounded-2xl p-4">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <CpuIcon className="size-3.5" />
              {t("console.cpuChart")}
            </span>
            <span className="text-foreground font-medium tabular-nums">{cpu}%</span>
          </div>
          <Sparkline series={[{ values: cpuHist, color: "oklch(0.8 0 0)" }]} />
        </Card>

        <Card className="gap-2 rounded-2xl p-4">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <ActivityIcon className="size-3.5" />
              {t("console.netChart")}
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("console.in")} {netIn}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-sky-400" />
                {t("console.out")} {netOut}
              </span>
            </span>
          </div>
          <Sparkline
            series={[
              { values: netInHist, color: "oklch(0.7 0.15 160)" },
              { values: netOutHist, color: "oklch(0.7 0.13 230)" },
            ]}
          />
        </Card>
      </div>

      {/* Согласие с EULA (Minecraft) */}
      <Dialog open={eulaOpen} onOpenChange={setEulaOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileTextIcon className="size-4" />
              {t("eula.title")}
            </DialogTitle>
            <DialogDescription>{t("eula.subtitle")}</DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t("eula.body")}{" "}
            <a
              href="https://aka.ms/MinecraftEULA"
              target="_blank"
              rel="noreferrer"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Minecraft EULA
            </a>
            .
          </p>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEulaOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={acceptEula} disabled={accepting}>
              {accepting && <LoaderCircleIcon className="animate-spin" />}
              {t("eula.accept")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
