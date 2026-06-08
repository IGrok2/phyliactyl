"use client"

import Link from "next/link"
import {
  ServerIcon,
  HardDriveIcon,
  UsersIcon,
  MapPinIcon,
  ActivityIcon,
} from "lucide-react"

import {
  servers as mockServers,
  nodes as mockNodes,
  panelUsers as mockUsers,
  locations as mockLocations,
  formatMB,
  type Server,
  type Node,
  type PanelUser,
  type Location,
} from "@/lib/data"
import { useApiData } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DemoBadge } from "@/components/panel/demo-badge"

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="group hover:border-foreground/20 gap-0 rounded-2xl transition-all duration-300 hover:shadow-md">
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
          <span className="bg-muted group-hover:bg-foreground group-hover:text-background flex size-11 items-center justify-center rounded-2xl transition-colors">
            <Icon className="size-5" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function AdminOverviewPage() {
  const { t } = useT()
  const { data: servers } = useApiData<Server[]>("/servers", [])
  const { data: nodes, demo } = useApiData<Node[]>("/admin/nodes", [])
  const { data: usersResp } = useApiData<{
    users: PanelUser[]
    pagination: { total: number }
  }>("/admin/users", { users: [], pagination: { total: 0 } })
  const { data: locations } = useApiData<Location[]>("/admin/locations", [])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("admin.subtitle")}</p>
      </div>

      <DemoBadge show={demo} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ServerIcon} label={t("admin.servers")} value={servers.length} href="/" />
        <StatCard icon={HardDriveIcon} label={t("admin.nodes")} value={nodes.length} href="/admin/nodes" />
        <StatCard icon={MapPinIcon} label={t("admin.locations")} value={locations.length} href="/admin/locations" />
        <StatCard icon={UsersIcon} label={t("admin.users")} value={usersResp.pagination.total} href="/admin/users" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDriveIcon className="size-4" />
              {t("admin.nodeLoad")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {nodes.map((node) => {
              const memPct = node.memory.total ? (node.memory.used / node.memory.total) * 100 : 0
              return (
                <div key={node.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={node.status === "online" ? "bg-emerald-500 size-1.5 rounded-full" : "bg-neutral-500 size-1.5 rounded-full"} />
                      {node.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatMB(node.memory.used)} / {formatMB(node.memory.total)}
                    </span>
                  </div>
                  <Progress value={memPct} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ActivityIcon className="size-4" />
              {t("admin.activity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex flex-col gap-3 text-sm">
            {servers.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-foreground">{s.name}</span>
                <span className="text-xs">{s.node}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
