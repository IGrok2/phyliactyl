"use client"

import * as React from "react"
import { SearchIcon, ServerIcon } from "lucide-react"

import { servers as mockServers, type Server } from "@/lib/data"
import { useApiData } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ServerCard } from "@/components/panel/server-card"
import { DemoBadge } from "@/components/panel/demo-badge"
import { useT } from "@/components/i18n-provider"

type Filter = "all" | "running" | "offline"

export default function ServersPage() {
  const { t } = useT()
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [scope, setScope] = React.useState<"mine" | "all">("mine")

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {})
  }, [])

  const { data: servers, loading } = useApiData<Server[]>(
    scope === "all" ? "/servers?all=1" : "/servers",
    [],
  )
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")

  const filtered = servers.filter((s) => {
    const q = query.toLowerCase()
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      s.node.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "running"
          ? s.status === "running"
          : s.status !== "running"
    return matchesQuery && matchesFilter
  })

  const runningCount = servers.filter((s) => s.status === "running").length

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("servers.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("servers.summary", { total: servers.length, running: runningCount })}
          </p>
        </div>
      </div>

      <DemoBadge show={false} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("servers.searchPlaceholder")}
            className="rounded-xl pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Tabs value={scope} onValueChange={(v) => setScope(v as "mine" | "all")}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="mine">{t("servers.scope.mine")}</TabsTrigger>
                <TabsTrigger value="all">{t("servers.scope.all")}</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="all">{t("servers.filter.all")}</TabsTrigger>
              <TabsTrigger value="running">{t("servers.filter.running")}</TabsTrigger>
              <TabsTrigger value="offline">{t("servers.filter.offline")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
            <ServerIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="font-medium">{t("servers.empty")}</p>
            <p className="text-muted-foreground text-sm">{t("servers.emptyHint")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
