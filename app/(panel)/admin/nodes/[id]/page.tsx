"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  HardDriveIcon,
  GlobeIcon,
  MapPinIcon,
  MemoryStickIcon,
  DatabaseIcon,
  Trash2Icon,
  SaveIcon,
  PlusIcon,
  LoaderCircleIcon,
  NetworkIcon,
} from "lucide-react"

import { formatMB, type Location, type Allocation } from "@/lib/data"
import type { AppNodeAttributes } from "@/lib/pterodactyl/types"
import { bff, apiSend, useApiData } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NodeDetail {
  id: string
  name: string
  fqdn: string
  location: string
  status: "online" | "offline"
  memory: { used: number; total: number }
  disk: { used: number; total: number }
  raw: AppNodeAttributes
  config: Record<string, unknown> | null
}

export default function NodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const router = useRouter()

  const [node, setNode] = React.useState<NodeDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const { data: locations } = useApiData<Location[]>("/admin/locations", [])

  const load = React.useCallback(() => {
    setLoading(true)
    bff<NodeDetail>(`/admin/nodes/${id}`).then((res) => {
      if (res.data) setNode(res.data)
      setLoading(false)
    })
  }, [id])

  React.useEffect(() => {
    load()
  }, [load])

  if (loading && !node) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!node) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-medium">{t("common.notFound")}</p>
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/admin/nodes">
            <ArrowLeftIcon data-icon="inline-start" />
            {t("common.back")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" className="rounded-xl" asChild>
            <Link href="/admin/nodes">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <span className="bg-muted flex size-9 items-center justify-center rounded-xl">
            <HardDriveIcon className="size-4.5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{node.name}</h1>
            <p className="text-muted-foreground font-mono text-xs">{node.fqdn}</p>
          </div>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span className={node.status === "online" ? "bg-emerald-500 size-1.5 rounded-full" : "bg-neutral-500 size-1.5 rounded-full"} />
            {node.status === "online" ? "Online" : "Maintenance"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="about">
        <TabsList className="rounded-xl">
          <TabsTrigger value="about">{t("node.tab.about")}</TabsTrigger>
          <TabsTrigger value="config">{t("node.tab.config")}</TabsTrigger>
          <TabsTrigger value="settings">{t("node.tab.settings")}</TabsTrigger>
          <TabsTrigger value="allocations">{t("admin.nodes.allocations")}</TabsTrigger>
        </TabsList>

        {/* About */}
        <TabsContent value="about" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={GlobeIcon} label={t("admin.nodes.fqdn")} value={`${node.raw.scheme}://${node.fqdn}`} />
            <InfoRow icon={MapPinIcon} label={t("admin.locations")} value={node.location} />
            <InfoRow icon={MemoryStickIcon} label={t("console.memory")} value={`${formatMB(node.raw.memory)} (+${node.raw.memory_overallocate}%)`} />
            <InfoRow icon={DatabaseIcon} label={t("console.disk")} value={`${formatMB(node.raw.disk)} (+${node.raw.disk_overallocate}%)`} />
          </div>
        </TabsContent>

        {/* Configuration */}
        <TabsContent value="config" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">{t("node.configTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">{t("node.configHint")}</p>
              {node.config ? (
                <pre className="max-h-[420px] overflow-auto rounded-xl border bg-[oklch(0.14_0_0)] p-4 font-mono text-xs leading-relaxed text-neutral-300">
                  {JSON.stringify(node.config, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">{t("node.configUnavailable")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-4">
          <NodeSettings node={node} locations={locations} onSaved={load} onDeleted={() => router.replace("/admin/nodes")} />
        </TabsContent>

        {/* Allocations */}
        <TabsContent value="allocations" className="mt-4">
          <NodeAllocations nodeId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-center gap-3">
        <span className="bg-muted flex size-9 items-center justify-center rounded-xl">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="truncate font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NodeSettings({
  node,
  locations,
  onSaved,
  onDeleted,
}: {
  node: NodeDetail
  locations: Location[]
  onSaved: () => void
  onDeleted: () => void
}) {
  const { t } = useT()
  const loc = locations.find((l) => l.short === node.location)
  const [form, setForm] = React.useState({
    name: node.name,
    fqdn: node.fqdn,
    scheme: node.raw.scheme,
    location_id: loc?.id ?? String(node.raw.location_id),
    memory: String(node.raw.memory),
    memory_overallocate: String(node.raw.memory_overallocate),
    disk: String(node.raw.disk),
    disk_overallocate: String(node.raw.disk_overallocate),
  })
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  // обновляем location_id, когда подгрузились локации
  React.useEffect(() => {
    const l = locations.find((x) => x.short === node.location)
    if (l) setForm((f) => ({ ...f, location_id: l.id }))
  }, [locations, node.location])

  async function save() {
    setSaving(true)
    const res = await apiSend(`/admin/nodes/${node.id}`, "PATCH", {
      name: form.name,
      fqdn: form.fqdn,
      scheme: form.scheme,
      location_id: Number(form.location_id),
      memory: Number(form.memory),
      memory_overallocate: Number(form.memory_overallocate),
      disk: Number(form.disk),
      disk_overallocate: Number(form.disk_overallocate),
    })
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("admin.nodes.updated"))
    onSaved()
  }

  async function remove() {
    setDeleting(true)
    const res = await apiSend(`/admin/nodes/${node.id}`, "DELETE")
    setDeleting(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("admin.nodes.deleted"))
    onDeleted()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t("node.tab.settings")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ns-name">{t("settings.serverName")}</Label>
              <Input id="ns-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ns-fqdn">{t("admin.nodes.fqdn")}</Label>
              <Input id="ns-fqdn" value={form.fqdn} onChange={(e) => setForm({ ...form, fqdn: e.target.value })} className="rounded-xl" />
            </div>
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="ns-mem">{t("admin.nodes.memoryMb")}</Label>
              <Input id="ns-mem" type="number" value={form.memory} onChange={(e) => setForm({ ...form, memory: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ns-disk">{t("admin.nodes.diskMb")}</Label>
              <Input id="ns-disk" type="number" value={form.disk} onChange={(e) => setForm({ ...form, disk: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div>
            <Button className="rounded-xl" onClick={save} disabled={saving}>
              {saving ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-destructive text-base">{t("settings.danger")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="rounded-xl" onClick={remove} disabled={deleting}>
            {deleting ? <LoaderCircleIcon className="animate-spin" /> : <Trash2Icon data-icon="inline-start" />}
            {t("admin.nodes.deleteTitle")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function NodeAllocations({ nodeId }: { nodeId: string }) {
  const { t } = useT()
  const [allocs, setAllocs] = React.useState<(Allocation & { assigned?: boolean })[]>([])
  const [loading, setLoading] = React.useState(false)
  const [ip, setIp] = React.useState("")
  const [ports, setPorts] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    bff<(Allocation & { assigned?: boolean })[]>(`/admin/nodes/${nodeId}/allocations`).then((res) => {
      if (!res.error && res.data) setAllocs(res.data)
      setLoading(false)
    })
  }, [nodeId])

  React.useEffect(() => {
    load()
  }, [load])

  async function add() {
    if (!ip || !ports) return
    setBusy(true)
    const portList = ports.split(",").flatMap((chunk) => {
      const m = chunk.trim().match(/^(\d+)-(\d+)$/)
      if (m) {
        const out: string[] = []
        for (let p = Number(m[1]); p <= Number(m[2]); p++) out.push(String(p))
        return out
      }
      return chunk.trim() ? [chunk.trim()] : []
    })
    const res = await apiSend(`/admin/nodes/${nodeId}/allocations`, "POST", { ip, ports: portList })
    setBusy(false)
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("admin.nodes.allocAdded"))
      setPorts("")
      load()
    }
  }

  async function remove(aid: string) {
    const res = await apiSend(`/admin/nodes/${nodeId}/allocations/${aid}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else load()
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NetworkIcon className="size-4" />
          {t("admin.nodes.allocations")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-32 flex-1 flex-col gap-2">
            <Label htmlFor="na-ip">IP</Label>
            <Input id="na-ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="0.0.0.0" className="rounded-xl" />
          </div>
          <div className="flex min-w-32 flex-1 flex-col gap-2">
            <Label htmlFor="na-ports">{t("admin.nodes.ports")}</Label>
            <Input id="na-ports" value={ports} onChange={(e) => setPorts(e.target.value)} placeholder="25565-25570" className="rounded-xl" />
          </div>
          <Button className="rounded-xl" onClick={add} disabled={busy}>
            {busy ? <LoaderCircleIcon className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}
            {t("network.add")}
          </Button>
        </div>

        <div className="rounded-xl border">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 rounded-lg" />
              ))}
            </div>
          ) : allocs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">{t("admin.nodes.noAllocations")}</p>
          ) : (
            <div className="max-h-[360px] divide-y overflow-auto">
              {allocs.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-mono">
                    {a.ip}:{a.port}
                    {a.assigned && (
                      <Badge variant="secondary" className="ml-2 font-normal">{t("admin.nodes.allocInUse")}</Badge>
                    )}
                  </span>
                  <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" disabled={a.assigned} onClick={() => remove(a.id)}>
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
