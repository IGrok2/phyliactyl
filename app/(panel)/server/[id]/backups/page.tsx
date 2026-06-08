"use client"

import * as React from "react"
import { use } from "react"
import { toast } from "sonner"
import {
  ArchiveIcon,
  PlusIcon,
  LockIcon,
  DownloadIcon,
  RotateCcwIcon,
  Trash2Icon,
  MoreVerticalIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react"

import { backups as mockBackups, formatBytes, type Backup } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { DemoBadge } from "@/components/panel/demo-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BackupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data: backups, loading, demo, reload } = useApiData<Backup[]>(
    `/servers/${id}/backups`,
    [],
  )

  const used = backups.reduce((acc, b) => acc + b.size, 0)
  const limit = 5 * 1024 * 1024 * 1024
  const pct = (used / limit) * 100

  async function createBackup() {
    if (demo) {
      toast.success(t("backups.create"))
      return
    }
    const res = await apiSend(`/servers/${id}/backups`, "POST")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("backups.create"))
      reload()
    }
  }

  async function deleteBackup(backup: Backup) {
    if (demo) {
      toast.error(t("common.delete"), { description: backup.name })
      return
    }
    const res = await apiSend(`/servers/${id}/backups/${backup.id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.error(t("common.delete"), { description: backup.name })
      reload()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("backups.title")}
        description={t("backups.summary", { count: backups.length, max: 10 })}
        action={
          <Button className="rounded-xl" onClick={createBackup}>
            <PlusIcon data-icon="inline-start" />
            {t("backups.create")}
          </Button>
        }
      />

      <DemoBadge show={demo} />

      <Card className="flex flex-col gap-2 rounded-2xl p-4">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>{t("backups.storage")}</span>
          <span className="text-foreground font-medium tabular-nums">
            {formatBytes(used)} / {formatBytes(limit)}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </Card>

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("backups.col.name")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("backups.col.size")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("backups.col.created")}</TableHead>
                <TableHead>{t("backups.col.status")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-lg">
                        <ArchiveIcon className="size-3.5" />
                      </span>
                      <span className="flex items-center gap-1.5">
                        {backup.name}
                        {backup.locked && <LockIcon className="text-muted-foreground size-3" />}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">
                    {backup.size ? formatBytes(backup.size) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {new Date(backup.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {backup.successful ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <CheckCircle2Icon className="text-emerald-500 size-3" />
                        {t("backups.ready")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <XCircleIcon className="text-destructive size-3" />
                        {t("backups.failed")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem disabled={!backup.successful} onClick={() => toast(t("common.download"))}>
                          <DownloadIcon />
                          {t("common.download")}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!backup.successful} onClick={() => toast(t("backups.restore"), { description: backup.name })}>
                          <RotateCcwIcon />
                          {t("backups.restore")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" disabled={backup.locked} onClick={() => deleteBackup(backup)}>
                          <Trash2Icon />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
