"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  HardDriveIcon,
  PlusIcon,
  ServerIcon,
  MemoryStickIcon,
  DatabaseIcon,
  GlobeIcon,
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  NetworkIcon,
  LoaderCircleIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { formatMB, type Node, type Location, type Allocation } from "@/lib/data"
import { useApiData, apiSend, bff } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionHeader } from "@/components/panel/section-header"
import { AdminError } from "@/components/panel/admin-error"
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

interface NodeForm {
  name: string
  location_id: string
  fqdn: string
  scheme: string
  memory: string
  memory_overallocate: string
  disk: string
  disk_overallocate: string
}

const emptyForm: NodeForm = {
  name: "",
  location_id: "",
  fqdn: "",
  scheme: "https",
  memory: "8192",
  memory_overallocate: "0",
  disk: "51200",
  disk_overallocate: "0",
}

export default function AdminNodesPage() {
  const { t } = useT()
  const { data: nodes, loading, error, reload } = useApiData<Node[]>("/admin/nodes", [])
  const { data: locations } = useApiData<Location[]>("/admin/locations", [])

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Node | null>(null)
  const [form, setForm] = React.useState<NodeForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Node | null>(null)
  const [allocNode, setAllocNode] = React.useState<Node | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, location_id: locations[0]?.id ?? "" })
    setDialogOpen(true)
  }

  function openEdit(node: Node) {
    setEditing(node)
    const loc = locations.find((l) => l.short === node.location)
    setForm({
      name: node.name,
      location_id: loc?.id ?? "",
      fqdn: node.fqdn,
      scheme: "https",
      memory: String(node.memory.total),
      memory_overallocate: "0",
      disk: String(node.disk.total),
      disk_overallocate: "0",
    })
    setDialogOpen(true)
  }

  async function submit() {
    if (!form.name || !form.fqdn || !form.location_id) {
      toast.error(t("admin.nodes.validation"))
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      location_id: Number(form.location_id),
      fqdn: form.fqdn,
      scheme: form.scheme,
      memory: Number(form.memory),
      memory_overallocate: Number(form.memory_overallocate),
      disk: Number(form.disk),
      disk_overallocate: Number(form.disk_overallocate),
    }
    const res = editing
      ? await apiSend(`/admin/nodes/${editing.id}`, "PATCH", payload)
      : await apiSend(`/admin/nodes`, "POST", payload)
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(editing ? t("admin.nodes.updated") : t("admin.nodes.created"), {
      description: form.name,
    })
    setDialogOpen(false)
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await apiSend(`/admin/nodes/${deleting.id}`, "DELETE")
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
    } else {
      toast.success(t("admin.nodes.deleted"), { description: deleting.name })
      reload()
    }
    setDeleting(null)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("admin.nodes")}
        description={t("admin.nodes.subtitle")}
        action={
          <Button className="rounded-xl" onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            {t("admin.nodes.add")}
          </Button>
        }
      />

      {error && <AdminError error={error} resource={t("admin.nodes")} onReload={reload} />}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          {t("admin.nodes.empty")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => {
            const memPct = node.memory.total ? (node.memory.used / node.memory.total) * 100 : 0
            const diskPct = node.disk.total ? (node.disk.used / node.disk.total) * 100 : 0
            return (
              <Card key={node.id} className="rounded-2xl">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-muted flex size-8 items-center justify-center rounded-lg">
                        <HardDriveIcon className="size-4" />
                      </span>
                      {node.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <span className={node.status === "online" ? "bg-emerald-500 size-1.5 rounded-full" : "bg-neutral-500 size-1.5 rounded-full"} />
                        {node.status === "online" ? "Online" : "Maintenance"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/nodes/${node.id}`}>
                              <SlidersHorizontalIcon />
                              {t("common.manage")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAllocNode(node)}>
                            <NetworkIcon />
                            {t("admin.nodes.allocations")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(node)}>
                            <PencilIcon />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(node)}>
                            <Trash2Icon />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1.5">
                      <GlobeIcon className="size-3.5" />
                      {node.fqdn}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ServerIcon className="size-3.5" />
                      {node.location}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <MemoryStickIcon className="size-3.5" />
                        {t("console.memory")}
                      </span>
                      <span className="tabular-nums">{formatMB(node.memory.total)}</span>
                    </div>
                    <Progress value={memPct} className="h-1.5" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <DatabaseIcon className="size-3.5" />
                        {t("console.disk")}
                      </span>
                      <span className="tabular-nums">{formatMB(node.disk.total)}</span>
                    </div>
                    <Progress value={diskPct} className="h-1.5" />
                  </div>

                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link href={`/admin/nodes/${node.id}`}>
                      <SlidersHorizontalIcon data-icon="inline-start" />
                      {t("common.manage")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Создание/редактирование ноды */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("admin.nodes.editTitle") : t("admin.nodes.add")}
            </DialogTitle>
            <DialogDescription>{t("admin.nodes.formHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="n-name">{t("settings.serverName")}</Label>
              <Input id="n-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("admin.locations")}</Label>
                <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.short} — {l.long}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("admin.nodes.scheme")}</Label>
                <Select value={form.scheme} onValueChange={(v) => setForm({ ...form, scheme: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="n-fqdn">{t("admin.nodes.fqdn")}</Label>
              <Input id="n-fqdn" value={form.fqdn} onChange={(e) => setForm({ ...form, fqdn: e.target.value })} placeholder="node.example.com" className="rounded-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="n-mem">{t("admin.nodes.memoryMb")}</Label>
                <Input id="n-mem" type="number" value={form.memory} onChange={(e) => setForm({ ...form, memory: e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="n-disk">{t("admin.nodes.diskMb")}</Label>
                <Input id="n-disk" type="number" value={form.disk} onChange={(e) => setForm({ ...form, disk: e.target.value })} className="rounded-xl" />
              </div>
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

      {/* Удаление */}
      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.nodes.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.nodes.deleteConfirm", { name: deleting?.name ?? "" })}
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

      {/* Управление аллокациями */}
      <AllocationsDialog node={allocNode} onClose={() => setAllocNode(null)} />
    </div>
  )
}

function AllocationsDialog({
  node,
  onClose,
}: {
  node: Node | null
  onClose: () => void
}) {
  const { t } = useT()
  const [allocs, setAllocs] = React.useState<(Allocation & { assigned?: boolean })[]>([])
  const [loading, setLoading] = React.useState(false)
  const [ip, setIp] = React.useState("")
  const [ports, setPorts] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    if (!node) return
    setLoading(true)
    bff<(Allocation & { assigned?: boolean })[]>(`/admin/nodes/${node.id}/allocations`).then((res) => {
      if (!res.error && res.data) setAllocs(res.data)
      setLoading(false)
    })
  }, [node])

  React.useEffect(() => {
    if (node) {
      setIp("")
      setPorts("")
      load()
    }
  }, [node, load])

  async function add() {
    if (!node || !ip || !ports) return
    setBusy(true)
    // поддержка диапазона "25565-25570" и списка через запятую
    const portList = ports
      .split(",")
      .flatMap((chunk) => {
        const m = chunk.trim().match(/^(\d+)-(\d+)$/)
        if (m) {
          const out: string[] = []
          for (let p = Number(m[1]); p <= Number(m[2]); p++) out.push(String(p))
          return out
        }
        return chunk.trim() ? [chunk.trim()] : []
      })
    const res = await apiSend(`/admin/nodes/${node.id}/allocations`, "POST", {
      ip,
      ports: portList,
    })
    setBusy(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
    } else {
      toast.success(t("admin.nodes.allocAdded"))
      setPorts("")
      load()
    }
  }

  async function remove(id: string) {
    if (!node) return
    const res = await apiSend(`/admin/nodes/${node.id}/allocations/${id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else load()
  }

  return (
    <Dialog open={node !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.nodes.allocations")}</DialogTitle>
          <DialogDescription>{node?.name}</DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="a-ip">IP</Label>
            <Input id="a-ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="0.0.0.0" className="rounded-xl" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="a-ports">{t("admin.nodes.ports")}</Label>
            <Input id="a-ports" value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="25565-25570" className="rounded-xl" />
          </div>
          <Button className="rounded-xl" onClick={add} disabled={busy}>
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}
            {t("network.add")}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-xl border">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 rounded-lg" />
              ))}
            </div>
          ) : allocs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("admin.nodes.noAllocations")}
            </p>
          ) : (
            <div className="divide-y">
              {allocs.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-mono">
                    {a.ip}:{a.port}
                    {a.assigned && (
                      <Badge variant="secondary" className="ml-2 font-normal">
                        {t("admin.nodes.allocInUse")}
                      </Badge>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    disabled={a.assigned}
                    onClick={() => remove(a.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
