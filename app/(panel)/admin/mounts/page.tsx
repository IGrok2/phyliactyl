"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  HardDriveIcon,
  PlusIcon,
  Trash2Icon,
  LoaderCircleIcon,
  LockIcon,
} from "lucide-react"

import { type Mount } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { AdminError } from "@/components/panel/admin-error"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MountForm {
  name: string
  source: string
  target: string
  description: string
  read_only: boolean
  user_mountable: boolean
}

const emptyForm: MountForm = {
  name: "",
  source: "",
  target: "",
  description: "",
  read_only: false,
  user_mountable: false,
}

export default function AdminMountsPage() {
  const { t } = useT()
  const { data: mounts, loading, error, reload } = useApiData<Mount[]>(
    "/admin/mounts",
    [],
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<MountForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Mount | null>(null)

  function openCreate() {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  async function submit() {
    if (!form.name || !form.source || !form.target) {
      toast.error(t("admin.mounts.validation"))
      return
    }
    setSaving(true)
    const res = await apiSend(`/admin/mounts`, "POST", form)
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("admin.mounts.created"), { description: form.name })
    setDialogOpen(false)
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await apiSend(`/admin/mounts/${deleting.id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("admin.mounts.deleted"), { description: deleting.name })
      reload()
    }
    setDeleting(null)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("admin.mounts")}
        description={t("admin.mounts.subtitle")}
        action={
          <Button className="rounded-xl" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            {t("admin.mounts.add")}
          </Button>
        }
      />

      {error && (
        <AdminError error={error} resource={t("admin.mounts")} onReload={reload} />
      )}

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : mounts.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center text-sm">
            {t("admin.mounts.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("files.col.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("admin.mounts.source")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("admin.mounts.target")}</TableHead>
                <TableHead>{t("admin.mounts.mode")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mounts.map((m) => (
                <TableRow key={m.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-lg">
                        <HardDriveIcon className="size-3.5" />
                      </span>
                      {m.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                    {m.source}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                    {m.target}
                  </TableCell>
                  <TableCell>
                    {m.readOnly ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <LockIcon className="size-3" />
                        {t("admin.mounts.readOnly")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        {t("admin.mounts.readWrite")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(m)}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.mounts.add")}</DialogTitle>
            <DialogDescription>{t("admin.mounts.formHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="m-name">{t("files.col.name")}</Label>
              <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="m-source">{t("admin.mounts.source")}</Label>
              <Input id="m-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="/host/path" className="rounded-xl font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="m-target">{t("admin.mounts.target")}</Label>
              <Input id="m-target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="/container/path" className="rounded-xl font-mono" />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <p className="text-sm font-medium">{t("admin.mounts.readOnly")}</p>
              <Switch checked={form.read_only} onCheckedChange={(v) => setForm({ ...form, read_only: v })} />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <p className="text-sm font-medium">{t("admin.mounts.userMountable")}</p>
              <Switch checked={form.user_mountable} onCheckedChange={(v) => setForm({ ...form, user_mountable: v })} />
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

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.mounts.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.mounts.deleteConfirm", { name: deleting?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmDelete}>
              <Trash2Icon data-icon="inline-start" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
