"use client"

import * as React from "react"
import { use } from "react"
import { toast } from "sonner"
import {
  DatabaseIcon,
  PlusIcon,
  CopyIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"

import { databases as mockDatabases, type Database } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { DemoBadge } from "@/components/panel/demo-badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Db = Database & { password?: string }

export default function DatabasesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data: databases, loading, demo, reload } = useApiData<Db[]>(
    `/servers/${id}/databases`,
    [],
  )
  const [showPw, setShowPw] = React.useState<Record<string, boolean>>({})
  const [newName, setNewName] = React.useState("")

  function Field({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value)
            toast.success(t("common.copied"), { description: value })
          }}
          className="hover:bg-muted flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-sm transition-colors"
        >
          <span className="truncate">{value}</span>
          <CopyIcon className="text-muted-foreground size-3.5 shrink-0" />
        </button>
      </div>
    )
  }

  async function createDb() {
    if (!newName.trim()) return
    if (demo) {
      toast.success(t("db.create"))
      return
    }
    const res = await apiSend(`/servers/${id}/databases`, "POST", {
      database: newName,
      remote: "%",
    })
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("db.create"))
      reload()
    }
    setNewName("")
  }

  async function deleteDb(db: Db) {
    if (demo) {
      toast.error(t("db.deleteBtn"), { description: db.name })
      return
    }
    const res = await apiSend(`/servers/${id}/databases/${db.id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.error(t("db.deleteBtn"), { description: db.name })
      reload()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("db.title")}
        description={t("db.summary", { count: databases.length, max: 5 })}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <PlusIcon data-icon="inline-start" />
                {t("db.create")}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t("db.create")}</DialogTitle>
                <DialogDescription>{t("db.name")}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="db-name">{t("db.name")}</Label>
                  <Input
                    id="db-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="my_database"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl">{t("common.cancel")}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button className="rounded-xl" onClick={createDb}>
                    {t("common.create")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DemoBadge show={demo} />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {databases.map((db) => (
            <Card key={db.id} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-muted flex size-8 items-center justify-center rounded-lg">
                    <DatabaseIcon className="size-4" />
                  </span>
                  {db.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("db.host")} value={db.host} />
                  <Field label={t("db.port")} value={String(db.port)} />
                  <Field label={t("db.name")} value={db.name} />
                  <Field label={t("db.user")} value={db.username} />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t("db.password")}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      type={showPw[db.id] ? "text" : "password"}
                      value={db.password || "••••••••••••"}
                      className="rounded-xl font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => setShowPw((p) => ({ ...p, [db.id]: !p[db.id] }))}
                    >
                      {showPw[db.id] ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>{t("db.connectionsFrom")}: {db.connectionsFrom}</span>
                  <span>{t("db.maxConnections")}: {db.maxConnections}</span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="rounded-xl">
                      <Trash2Icon data-icon="inline-start" />
                      {t("db.deleteBtn")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("db.deleteBtn")}</DialogTitle>
                      <DialogDescription>
                        <span className="font-mono">{db.name}</span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">{t("common.cancel")}</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="destructive" className="rounded-xl" onClick={() => deleteDb(db)}>
                          {t("common.delete")}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
