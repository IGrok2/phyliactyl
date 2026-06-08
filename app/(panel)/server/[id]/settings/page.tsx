"use client"

import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  SaveIcon,
  ServerCogIcon,
  RefreshCwIcon,
  Trash2Icon,
  CopyIcon,
} from "lucide-react"

import { getServer, type Server } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SectionHeader } from "@/components/panel/section-header"
import { DemoBadge } from "@/components/panel/demo-badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ServerSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const router = useRouter()
  const fallback = getServer(id) as Server | undefined
  const { data: server, demo } = useApiData<Server | undefined>(
    `/servers/${id}`,
    fallback,
  )
  const [name, setName] = React.useState("")
  const [sftpUserName, setSftpUserName] = React.useState("")

  React.useEffect(() => {
    if (server) setName(server.name)
  }, [server])

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.account?.username) setSftpUserName(d.account.username)
      })
      .catch(() => {})
  }, [])

  if (!server) return null

  const sftpIp = server.sftp?.ip ?? server.address
  const sftpPort = server.sftp?.port ?? 2022
  const sftpHost = `sftp://${sftpIp}:${sftpPort}`
  const sftpUser = sftpUserName ? `${sftpUserName}.${server.id}` : server.id

  async function saveName() {
    if (demo) {
      toast.success(t("common.save"))
      return
    }
    const res = await apiSend(`/servers/${id}/settings`, "POST", { name })
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else toast.success(t("common.save"))
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title={t("settings.title")} description={t("settings.subtitle")} />

      <DemoBadge show={demo} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t("settings.general")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="srv-name">{t("settings.serverName")}</Label>
            <Input
              id="srv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="srv-desc">{t("settings.description")}</Label>
            <Input id="srv-desc" defaultValue={server.description} className="rounded-xl" />
          </div>
          <div>
            <Button className="rounded-xl" onClick={saveName}>
              <SaveIcon data-icon="inline-start" />
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ServerCogIcon className="size-4" />
            {t("settings.sftp")}
          </CardTitle>
          <CardDescription>{t("settings.sftpDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("settings.sftpHost")}</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={sftpHost} className="min-w-0 flex-1 rounded-xl font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                aria-label={t("common.copy")}
                onClick={() => { navigator.clipboard?.writeText(sftpHost); toast.success(t("common.copied")) }}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("settings.sftpUser")}</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={sftpUser} className="min-w-0 flex-1 rounded-xl font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl"
                aria-label={t("common.copy")}
                onClick={() => { navigator.clipboard?.writeText(sftpUser); toast.success(t("common.copied")) }}
              >
                <CopyIcon />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">{t("settings.sftpHint")}</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-destructive text-base">{t("settings.danger")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="font-medium">{t("settings.reinstall")}</p>
            <Button variant="outline" className="rounded-xl" onClick={() => toast(t("settings.reinstall"), { description: server.name })}>
              <RefreshCwIcon data-icon="inline-start" />
              {t("settings.reinstall")}
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p className="font-medium">{t("settings.delete")}</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="rounded-xl">
                  <Trash2Icon data-icon="inline-start" />
                  {t("settings.delete")}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t("settings.delete")} «{server.name}»?</DialogTitle>
                  <DialogDescription>{server.address}:{server.port}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-xl">{t("common.cancel")}</Button>
                  </DialogClose>
                  <Button variant="destructive" className="rounded-xl" onClick={() => { toast.error(t("settings.delete"), { description: server.name }); router.push("/") }}>
                    {t("common.delete")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
