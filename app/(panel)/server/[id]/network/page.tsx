"use client"

import { use } from "react"
import { toast } from "sonner"
import { NetworkIcon, PlusIcon, StarIcon, CopyIcon, Trash2Icon } from "lucide-react"

import { allocations as mockAllocations, type Allocation } from "@/lib/data"
import { useApiData } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function NetworkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data: allocations, loading, demo } = useApiData<Allocation[]>(
    `/servers/${id}/network`,
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("network.title")}
        description={t("network.subtitle")}
        action={
          <Button className="rounded-xl" onClick={() => toast.success(t("network.add"))}>
            <PlusIcon data-icon="inline-start" />
            {t("network.add")}
          </Button>
        }
      />

      <DemoBadge show={demo} />

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>IP</TableHead>
                <TableHead>{t("db.port")}</TableHead>
                <TableHead className="hidden sm:table-cell">Alias</TableHead>
                <TableHead>{t("backups.col.status")}</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((al) => (
                <TableRow key={al.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-mono">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-lg">
                        <NetworkIcon className="size-3.5" />
                      </span>
                      {al.ip}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{al.port}</TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono sm:table-cell">
                    {al.alias ?? "—"}
                  </TableCell>
                  <TableCell>
                    {al.primary ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                        {t("network.primary")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        {t("network.secondary")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.copy")}
                        onClick={() => {
                          navigator.clipboard?.writeText(`${al.ip}:${al.port}`)
                          toast.success(t("common.copied"), { description: `${al.ip}:${al.port}` })
                        }}
                      >
                        <CopyIcon />
                      </Button>
                      {!al.primary && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label={t("network.makePrimary")} onClick={() => toast.success(t("network.makePrimary"))}>
                            <StarIcon />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={t("common.delete")} className="text-destructive hover:text-destructive" onClick={() => toast.error(t("common.delete"))}>
                            <Trash2Icon />
                          </Button>
                        </>
                      )}
                    </div>
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
