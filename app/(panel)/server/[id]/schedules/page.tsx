"use client"

import * as React from "react"
import { use } from "react"
import { toast } from "sonner"
import {
  PlusIcon,
  CalendarClockIcon,
  TerminalIcon,
  PowerIcon,
  ArchiveIcon,
  ClockIcon,
  PlayIcon,
  PencilIcon,
  Trash2Icon,
  MoreVerticalIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { type Schedule } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionHeader } from "@/components/panel/section-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const actionMeta: Record<string, React.ComponentType<{ className?: string }>> = {
  command: TerminalIcon,
  power: PowerIcon,
  backup: ArchiveIcon,
}

interface CronForm {
  name: string
  minute: string
  hour: string
  day_of_month: string
  month: string
  day_of_week: string
  is_active: boolean
}

const emptyCron: CronForm = {
  name: "",
  minute: "*",
  hour: "*",
  day_of_month: "*",
  month: "*",
  day_of_week: "*",
  is_active: true,
}

function parseCron(cron: string): Pick<CronForm, "minute" | "hour" | "day_of_month" | "month" | "day_of_week"> {
  const [minute = "*", hour = "*", day_of_month = "*", month = "*", day_of_week = "*"] = cron.split(/\s+/)
  return { minute, hour, day_of_month, month, day_of_week }
}

export default function SchedulesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data: schedules, loading, error, reload } = useApiData<Schedule[]>(
    `/servers/${id}/schedules`,
    [],
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Schedule | null>(null)
  const [form, setForm] = React.useState<CronForm>(emptyCron)
  const [saving, setSaving] = React.useState(false)

  const [taskFor, setTaskFor] = React.useState<Schedule | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyCron)
    setDialogOpen(true)
  }

  function openEdit(s: Schedule) {
    setEditing(s)
    setForm({ name: s.name, ...parseCron(s.cron), is_active: s.active })
    setDialogOpen(true)
  }

  async function submit() {
    if (!form.name.trim()) {
      toast.error(t("sched.nameRequired"))
      return
    }
    setSaving(true)
    const res = editing
      ? await apiSend(`/servers/${id}/schedules/${editing.id}`, "PATCH", form)
      : await apiSend(`/servers/${id}/schedules`, "POST", form)
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(editing ? t("sched.updated") : t("sched.created"), { description: form.name })
    setDialogOpen(false)
    reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("sched.title")}
        description={t("sched.subtitle")}
        action={
          <Button className="rounded-xl" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            {t("sched.create")}
          </Button>
        }
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">{t("sched.empty")}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              serverId={id}
              schedule={s}
              onEdit={() => openEdit(s)}
              onChanged={reload}
              onAddTask={() => setTaskFor(s)}
            />
          ))}
        </div>
      )}

      {/* Создание/редактирование расписания */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("sched.editTitle") : t("sched.create")}</DialogTitle>
            <DialogDescription>{t("sched.cronHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sc-name">{t("sched.name")}</Label>
              <Input id="sc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {([
                ["minute", t("sched.minute")],
                ["hour", t("sched.hour")],
                ["day_of_month", t("sched.dom")],
                ["month", t("sched.month")],
                ["day_of_week", t("sched.dow")],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-2">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="rounded-xl text-center font-mono"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <p className="text-sm font-medium">{t("sched.active")}</p>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={submit} disabled={saving}>
              {saving && <LoaderCircleIcon className="animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Добавление задачи */}
      <TaskDialog
        serverId={id}
        schedule={taskFor}
        onClose={() => setTaskFor(null)}
        onAdded={reload}
      />
    </div>
  )
}

function ScheduleCard({
  serverId,
  schedule,
  onEdit,
  onChanged,
  onAddTask,
}: {
  serverId: string
  schedule: Schedule
  onEdit: () => void
  onChanged: () => void
  onAddTask: () => void
}) {
  const { t } = useT()
  const [busy, setBusy] = React.useState(false)

  const fmt = (date: string | null) =>
    date
      ? new Date(date).toLocaleString(undefined, {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : t("sched.never")

  async function toggleActive(v: boolean) {
    const parts = schedule.cron.split(/\s+/)
    const res = await apiSend(`/servers/${serverId}/schedules/${schedule.id}`, "PATCH", {
      name: schedule.name,
      minute: parts[0] ?? "*",
      hour: parts[1] ?? "*",
      day_of_month: parts[2] ?? "*",
      month: parts[3] ?? "*",
      day_of_week: parts[4] ?? "*",
      is_active: v,
    })
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else onChanged()
  }

  async function runNow() {
    setBusy(true)
    const res = await apiSend(`/servers/${serverId}/schedules/${schedule.id}/execute`, "POST")
    setBusy(false)
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else toast.success(t("common.runNow"), { description: schedule.name })
  }

  async function remove() {
    const res = await apiSend(`/servers/${serverId}/schedules/${schedule.id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("sched.deleted"), { description: schedule.name })
      onChanged()
    }
  }

  async function removeTask(taskId: string) {
    const res = await apiSend(
      `/servers/${serverId}/schedules/${schedule.id}/tasks/${taskId}`,
      "DELETE",
    )
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else onChanged()
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <span className="bg-muted flex size-8 items-center justify-center rounded-lg">
              <CalendarClockIcon className="size-4" />
            </span>
            {schedule.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Switch checked={schedule.active} onCheckedChange={toggleActive} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddTask}>
                  <PlusIcon />
                  {t("sched.addTask")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={remove}>
                  <Trash2Icon />
                  {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono">{schedule.cron}</Badge>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className={schedule.active ? "bg-emerald-500 size-1.5 rounded-full" : "bg-neutral-500 size-1.5 rounded-full"} />
            {schedule.active ? t("sched.active") : t("sched.disabled")}
          </Badge>
        </div>

        <div className="text-muted-foreground flex flex-col gap-1 text-xs">
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {t("sched.lastRun")}: {fmt(schedule.lastRun)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            {t("sched.nextRun")}: {fmt(schedule.nextRun || null)}
          </span>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            {t("sched.tasks")} ({schedule.tasks.length})
          </span>
          {schedule.tasks.length === 0 && (
            <p className="text-muted-foreground text-xs">{t("sched.noTasks")}</p>
          )}
          {schedule.tasks.map((task) => {
            const Icon = actionMeta[task.action] ?? TerminalIcon
            return (
              <div key={task.id} className="bg-muted/50 group/task flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm">
                <Icon className="size-3.5 shrink-0" />
                <span className="font-medium capitalize">{task.action}</span>
                {task.payload && (
                  <span className="text-muted-foreground truncate font-mono text-xs">{task.payload}</span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {task.offset !== 0 && (
                    <Badge variant="outline" className="font-normal">
                      {task.offset > 0 ? "+" : ""}{task.offset}s
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive opacity-0 group-hover/task:opacity-100"
                    onClick={() => removeTask(task.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={runNow} disabled={busy}>
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <PlayIcon data-icon="inline-start" />}
            {t("common.runNow")}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onAddTask}>
            <PlusIcon data-icon="inline-start" />
            {t("sched.addTask")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskDialog({
  serverId,
  schedule,
  onClose,
  onAdded,
}: {
  serverId: string
  schedule: Schedule | null
  onClose: () => void
  onAdded: () => void
}) {
  const { t } = useT()
  const [action, setAction] = React.useState("command")
  const [payload, setPayload] = React.useState("")
  const [offset, setOffset] = React.useState("0")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (schedule) {
      setAction("command")
      setPayload("")
      setOffset("0")
    }
  }, [schedule])

  async function add() {
    if (!schedule) return
    setSaving(true)
    const res = await apiSend(
      `/servers/${serverId}/schedules/${schedule.id}/tasks`,
      "POST",
      {
        action,
        payload: action === "backup" ? "" : payload,
        time_offset: Number(offset) || 0,
      },
    )
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("sched.taskAdded"))
    onClose()
    onAdded()
  }

  return (
    <Dialog open={schedule !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sched.addTask")}</DialogTitle>
          <DialogDescription>{schedule?.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("sched.action")}</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="command">{t("sched.actionCommand")}</SelectItem>
                <SelectItem value="power">{t("sched.actionPower")}</SelectItem>
                <SelectItem value="backup">{t("sched.actionBackup")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {action === "command" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="tk-payload">{t("sched.command")}</Label>
              <Input id="tk-payload" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="say Hello" className="rounded-xl font-mono" />
            </div>
          )}
          {action === "power" && (
            <div className="flex flex-col gap-2">
              <Label>{t("sched.signal")}</Label>
              <Select value={payload || "restart"} onValueChange={setPayload}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">start</SelectItem>
                  <SelectItem value="restart">restart</SelectItem>
                  <SelectItem value="stop">stop</SelectItem>
                  <SelectItem value="kill">kill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tk-offset">{t("sched.offset")}</Label>
            <Input id="tk-offset" type="number" value={offset} onChange={(e) => setOffset(e.target.value)} className="rounded-xl" />
            <p className="text-muted-foreground text-xs">{t("sched.offsetHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-xl" onClick={add} disabled={saving}>
            {saving && <LoaderCircleIcon className="animate-spin" />}
            {t("sched.addTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
