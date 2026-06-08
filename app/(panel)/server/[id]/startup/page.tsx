"use client"

import * as React from "react"
import { use } from "react"
import { toast } from "sonner"
import {
  TerminalIcon,
  SaveIcon,
  LockIcon,
  ContainerIcon,
  PencilIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StartupVar {
  name: string
  description: string
  envVariable: string
  value: string
  defaultValue: string
  editable: boolean
}

interface StartupData {
  command: string
  rawCommand: string
  dockerImages: Record<string, string>
  variables: StartupVar[]
}

export default function StartupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data, loading, reload } = useApiData<StartupData>(
    `/servers/${id}/startup`,
    { command: "", rawCommand: "", dockerImages: {}, variables: [] },
  )

  // Локальные значения переменных (редактируемые).
  const [vals, setVals] = React.useState<Record<string, string>>({})
  React.useEffect(() => {
    const next: Record<string, string> = {}
    for (const v of data.variables) next[v.envVariable] = v.value
    setVals(next)
  }, [data.variables])

  const [image, setImage] = React.useState("")
  const [savingVars, setSavingVars] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [command, setCommand] = React.useState("")
  const [ack, setAck] = React.useState(false)
  const [savingCmd, setSavingCmd] = React.useState(false)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)

  const dockerEntries = Object.entries(data.dockerImages)

  async function changeImage(img: string) {
    setImage(img)
    const res = await apiSend(`/servers/${id}/docker-image`, "PUT", { docker_image: img })
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else toast.success(t("startup.imageChanged"))
  }

  async function saveVariables() {
    setSavingVars(true)
    let failed = 0
    for (const v of data.variables) {
      if (!v.editable) continue
      if (vals[v.envVariable] === v.value) continue
      const res = await apiSend(`/servers/${id}/startup/variable`, "PUT", {
        key: v.envVariable,
        value: vals[v.envVariable] ?? "",
      })
      if (res.error) failed++
    }
    setSavingVars(false)
    if (failed) toast.error(t("startup.varsError", { count: String(failed) }))
    else toast.success(t("startup.varsSaved"))
    reload()
  }

  function openEdit() {
    setCommand(data.command)
    setAck(false)
    setEditOpen(true)
  }

  async function saveCommand() {
    setSavingCmd(true)
    const res = await apiSend(`/servers/${id}/startup/command`, "PUT", { command })
    setSavingCmd(false)
    if (res.error) {
      toast.error(t("startup.cmdError"), {
        description: res.error === "forbidden" ? t("startup.cmdAdminOnly") : res.error,
      })
      return
    }
    toast.success(t("startup.cmdSaved"))
    setEditOpen(false)
    reload()
  }

  async function resetDefaults() {
    setResetting(true)
    let failed = 0
    for (const v of data.variables) {
      if (!v.editable) continue
      const res = await apiSend(`/servers/${id}/startup/variable`, "PUT", {
        key: v.envVariable,
        value: v.defaultValue,
      })
      if (res.error) failed++
    }
    setResetting(false)
    setResetOpen(false)
    if (failed) toast.error(t("startup.resetError"))
    else toast.success(t("startup.resetDone"))
    reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("startup.title")}
        description={t("startup.subtitle")}
        action={
          <Button variant="outline" className="rounded-xl" onClick={() => setResetOpen(true)}>
            <RotateCcwIcon data-icon="inline-start" />
            {t("startup.reset")}
          </Button>
        }
      />

      {/* Команда запуска */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TerminalIcon className="size-4" />
              {t("startup.command")}
            </CardTitle>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openEdit} disabled={loading}>
              <PencilIcon data-icon="inline-start" />
              {t("common.edit")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <div className="bg-[oklch(0.12_0_0)] overflow-x-auto rounded-xl border p-3 font-mono text-sm text-neutral-300">
              {data.command || "—"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Docker Image */}
      {dockerEntries.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ContainerIcon className="size-4" />
              {t("startup.dockerImage")}
            </CardTitle>
            <CardDescription>{t("startup.dockerImageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={image || dockerEntries[0][1]} onValueChange={changeImage}>
              <SelectTrigger className="max-w-md rounded-xl font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dockerEntries.map(([label, img]) => (
                  <SelectItem key={img} value={img} className="font-mono">
                    {label !== img ? `${label} — ${img}` : img}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Переменные */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data.variables.map((v) => (
              <Card key={v.envVariable} className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    {v.name}
                    {!v.editable && (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <LockIcon className="size-3" />
                        {t("startup.readonly")}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{v.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Input
                    value={vals[v.envVariable] ?? ""}
                    onChange={(e) => setVals({ ...vals, [v.envVariable]: e.target.value })}
                    disabled={!v.editable}
                    className="rounded-xl font-mono"
                  />
                  <Label className="text-muted-foreground font-mono text-xs font-normal">
                    {"{{"}{v.envVariable}{"}}"}
                  </Label>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.variables.some((v) => v.editable) && (
            <div>
              <Button className="rounded-xl" onClick={saveVariables} disabled={savingVars}>
                {savingVars ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
                {t("startup.saveVars")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Редактирование команды с подтверждением рисков */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlertIcon className="text-amber-500 size-4" />
              {t("startup.editTitle")}
            </DialogTitle>
            <DialogDescription>{t("startup.editHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <textarea
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              rows={4}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border bg-[oklch(0.12_0_0)] px-3 py-2 font-mono text-xs text-neutral-200 outline-none focus-visible:ring-[3px]"
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                className="mt-0.5 size-4 rounded border"
              />
              <span>{t("startup.ack")}</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={saveCommand}
              disabled={!ack || savingCmd || !command.trim()}
            >
              {savingCmd && <LoaderCircleIcon className="animate-spin" />}
              {t("startup.applyCmd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Сброс к стандартным настройкам */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("startup.reset")}</DialogTitle>
            <DialogDescription>{t("startup.resetConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setResetOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={resetDefaults} disabled={resetting}>
              {resetting ? <LoaderCircleIcon className="animate-spin" /> : <RotateCcwIcon data-icon="inline-start" />}
              {t("startup.reset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
