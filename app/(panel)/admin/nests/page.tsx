"use client"

import * as React from "react"
import { EggIcon, BoxIcon, ChevronDownIcon, TerminalIcon, LoaderCircleIcon } from "lucide-react"

import { type Nest } from "@/lib/data"
import { useApiData, bff } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { AdminError } from "@/components/panel/admin-error"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EggDetail {
  id: string
  name: string
  description: string
  author: string
  startup: string
  dockerImage: string
  dockerImages: Record<string, string>
  variables: {
    name: string
    description: string
    envVariable: string
    defaultValue: string
    userEditable: boolean
    rules: string
  }[]
}

export default function AdminNestsPage() {
  const { t } = useT()
  const { data: nests, loading, error } = useApiData<Nest[]>("/admin/nests", [])
  const [open, setOpen] = React.useState<string | null>(null)
  const [egg, setEgg] = React.useState<EggDetail | null>(null)
  const [eggLoading, setEggLoading] = React.useState(false)

  function openEgg(nestId: string, eggId: string) {
    setEgg(null)
    setEggLoading(true)
    bff<EggDetail>(`/admin/nests/${nestId}/eggs/${eggId}`).then((res) => {
      if (res.data) setEgg(res.data)
      setEggLoading(false)
    })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader title={t("admin.nests")} description={t("admin.nests.subtitle")} />

      {error && <AdminError error={error} resource={t("admin.nests")} />}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : nests.length === 0 ? (
        <div className="text-muted-foreground py-16 text-center text-sm">
          {t("admin.nests.empty")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {nests.map((nest) => {
            const expanded = open === nest.id
            return (
              <Card key={nest.id} className="rounded-2xl p-4">
                <button
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() => setOpen(expanded ? null : nest.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="bg-muted flex size-9 items-center justify-center rounded-xl">
                      <BoxIcon className="size-4.5" />
                    </span>
                    <div>
                      <p className="font-medium">{nest.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {nest.description || nest.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <EggIcon className="size-3" />
                      {nest.eggs.length}
                    </Badge>
                    <ChevronDownIcon
                      className={`text-muted-foreground size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {expanded && nest.eggs.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1 border-t pt-3">
                    {nest.eggs.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => openEgg(nest.id, e.id)}
                        className="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
                      >
                        <EggIcon className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="font-medium">{e.name}</span>
                        {e.dockerImage && (
                          <span className="text-muted-foreground ml-auto truncate font-mono text-xs">
                            {e.dockerImage}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Детали эгга */}
      <Dialog open={egg !== null || eggLoading} onOpenChange={(o) => !o && (setEgg(null), setEggLoading(false))}>
        <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl sm:max-w-2xl">
          {eggLoading || !egg ? (
            <div className="flex items-center justify-center py-16">
              <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <EggIcon className="size-4" />
                  {egg.name}
                </DialogTitle>
                <DialogDescription>{egg.description || egg.author}</DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-auto">
                {/* Docker образы */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">{t("nests.dockerImages")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(egg.dockerImages).length > 0 ? (
                      Object.entries(egg.dockerImages).map(([label, img]) => (
                        <Badge key={img} variant="secondary" className="font-mono font-normal">
                          {label !== img ? `${label}: ` : ""}{img}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="font-mono font-normal">{egg.dockerImage}</Badge>
                    )}
                  </div>
                </div>

                {/* Команда запуска */}
                <div className="flex flex-col gap-1.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <TerminalIcon className="size-3.5" />
                    {t("startup.command")}
                  </p>
                  <pre className="overflow-auto rounded-xl border bg-[oklch(0.14_0_0)] p-3 font-mono text-xs text-neutral-300">
                    {egg.startup}
                  </pre>
                </div>

                {/* Переменные */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">{t("nests.variables")} ({egg.variables.length})</p>
                  <div className="flex flex-col gap-2">
                    {egg.variables.map((v) => (
                      <div key={v.envVariable} className="rounded-xl border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{v.name}</span>
                          <Badge variant="secondary" className="font-mono font-normal">{v.envVariable}</Badge>
                          {!v.userEditable && (
                            <Badge variant="outline" className="font-normal">{t("startup.readonly")}</Badge>
                          )}
                        </div>
                        {v.description && (
                          <p className="text-muted-foreground mt-1 text-xs">{v.description}</p>
                        )}
                        <p className="text-muted-foreground mt-1 font-mono text-xs">
                          {t("nests.default")}: {v.defaultValue || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-muted-foreground text-xs">{t("nests.editNote")}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
