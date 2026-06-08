"use client"

import * as React from "react"
import { SearchIcon, ServerIcon } from "lucide-react"

import { type Server } from "@/lib/data"
import { useApiData } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ServerCard } from "@/components/panel/server-card"
import { SectionHeader } from "@/components/panel/section-header"
import { useT } from "@/components/i18n-provider"

export default function AdminServersPage() {
  const { t } = useT()
  const { data: servers, loading, error } = useApiData<Server[]>(
    "/servers?all=1",
    [],
  )
  const [query, setQuery] = React.useState("")

  const filtered = servers.filter((s) => {
    const q = query.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.node.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    )
  })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("admin.servers")}
        description={t("admin.servers.subtitle")}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="relative max-w-sm">
        <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("servers.searchPlaceholder")}
          className="rounded-xl pl-8"
        />
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
          <p className="text-muted-foreground text-sm">{t("servers.empty")}</p>
        </div>
      )}
    </div>
  )
}
