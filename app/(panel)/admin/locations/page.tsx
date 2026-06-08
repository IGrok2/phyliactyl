"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  MapPinIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  MoreVerticalIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { type Location } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export default function AdminLocationsPage() {
  const { t } = useT()
  const { data: locations, loading, error, reload } = useApiData<Location[]>(
    "/admin/locations",
    [],
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Location | null>(null)
  const [short, setShort] = React.useState("")
  const [long, setLong] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Location | null>(null)

  function openCreate() {
    setEditing(null)
    setShort("")
    setLong("")
    setDialogOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setShort(loc.short)
    setLong(loc.long)
    setDialogOpen(true)
  }

  async function submit() {
    if (!short) {
      toast.error(t("admin.locations.validation"))
      return
    }
    setSaving(true)
    const payload = { short, long }
    const res = editing
      ? await apiSend(`/admin/locations/${editing.id}`, "PATCH", payload)
      : await apiSend(`/admin/locations`, "POST", payload)
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(editing ? t("admin.locations.updated") : t("admin.locations.created"), {
      description: short,
    })
    setDialogOpen(false)
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await apiSend(`/admin/locations/${deleting.id}`, "DELETE")
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
    } else {
      toast.success(t("admin.locations.deleted"), { description: deleting.short })
      reload()
    }
    setDeleting(null)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("admin.locations")}
        description={t("admin.locations.subtitle")}
        action={
          <Button className="rounded-xl" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            {t("admin.locations.add")}
          </Button>
        }
      />

      {error && (
        <AdminError error={error} resource={t("admin.locations")} onReload={reload} />
      )}

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center text-sm">
            {t("admin.locations.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("files.col.name")}</TableHead>
                <TableHead>{t("settings.description")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("admin.nodes")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-lg">
                        <MapPinIcon className="size-3.5" />
                      </span>
                      <Badge variant="secondary" className="font-mono">{loc.short}</Badge>
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{loc.long}</TableCell>
                  <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell">
                    {loc.nodes}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(loc)}>
                          <PencilIcon />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(loc)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("admin.locations.editTitle") : t("admin.locations.add")}
            </DialogTitle>
            <DialogDescription>{t("admin.locations.formHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="l-short">{t("admin.locations.short")}</Label>
              <Input id="l-short" value={short} onChange={(e) => setShort(e.target.value)} placeholder="FRA" className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="l-long">{t("admin.locations.long")}</Label>
              <Input id="l-long" value={long} onChange={(e) => setLong(e.target.value)} placeholder="Frankfurt, Germany" className="rounded-xl" />
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
            <DialogTitle>{t("admin.locations.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.locations.deleteConfirm", { name: deleting?.long || deleting?.short || "" })}
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
