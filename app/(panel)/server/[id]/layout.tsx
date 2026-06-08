"use client"

import { use } from "react"
import { ServerShell } from "@/components/panel/server-shell"
import { ServerLiveProvider } from "@/components/panel/server-live-provider"
import { useApiData } from "@/lib/api"
import { getServer, type Server } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/components/i18n-provider"

export default function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const fallback = getServer(id) as Server | undefined
  const { data, loading, error } = useApiData<Server | undefined>(
    `/servers/${id}`,
    fallback,
  )

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-lg font-medium">{t("common.notFound")}</p>
        {error && <p className="text-muted-foreground text-sm">{error}</p>}
      </div>
    )
  }

  return (
    <ServerLiveProvider serverId={id}>
      <ServerShell server={data}>{children}</ServerShell>
    </ServerLiveProvider>
  )
}
