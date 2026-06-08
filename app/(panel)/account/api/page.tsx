"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  KeyRoundIcon,
  PlusIcon,
  Trash2Icon,
  LoaderCircleIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react"

import { type ApiKey } from "@/lib/data"
import { useApiData, apiSend, bff } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ApiKeysPage() {
  const { t } = useT()
  const { data: keys, loading, error, reload } = useApiData<ApiKey[]>(
    "/account/api-keys",
    [],
  )

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [allowedIps, setAllowedIps] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [secret, setSecret] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [deleting, setDeleting] = React.useState<ApiKey | null>(null)

  async function create() {
    if (!description.trim()) {
      toast.error(t("apikeys.descRequired"))
      return
    }
    setSaving(true)
    const res = await bff<{ key: ApiKey; secret: string }>("/account/api-keys", {
      method: "POST",
      body: JSON.stringify({
        description: description.trim(),
        allowed_ips: allowedIps
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    })
    setSaving(false)
    if (res.error || !res.data) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    setDialogOpen(false)
    setDescription("")
    setAllowedIps("")
    setSecret(res.data.secret)
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await apiSend(`/account/api-keys/${deleting.id}`, "DELETE")
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("apikeys.revoked"), { description: deleting.description })
      reload()
    }
    setDeleting(null)
  }

  function copySecret() {
    if (!secret) return
    navigator.clipboard?.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("apikeys.title")}
        description={t("apikeys.subtitle")}
        action={
          <Button className="rounded-xl" onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            {t("apikeys.create")}
          </Button>
        }
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center text-sm">
            {t("apikeys.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("apikeys.description")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("apikeys.identifier")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("apikeys.created")}</TableHead>
                <TableHead>{t("apikeys.lastUsed")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="bg-muted flex size-7 items-center justify-center rounded-lg">
                        <KeyRoundIcon className="size-3.5" />
                      </span>
                      {key.description}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="font-mono">{key.id}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : t("apikeys.never")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(key)}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Создание ключа */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("apikeys.create")}</DialogTitle>
            <DialogDescription>{t("apikeys.createHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="k-desc">{t("apikeys.description")}</Label>
              <Input id="k-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="k-ips">{t("apikeys.allowedIps")}</Label>
              <Input id="k-ips" value={allowedIps} onChange={(e) => setAllowedIps(e.target.value)} placeholder="0.0.0.0, 10.0.0.1" className="rounded-xl font-mono" />
              <p className="text-muted-foreground text-xs">{t("apikeys.allowedIpsHint")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={create} disabled={saving}>
              {saving && <LoaderCircleIcon className="animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Показ секрета один раз */}
      <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("apikeys.secretTitle")}</DialogTitle>
            <DialogDescription>{t("apikeys.secretHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
            <code className="flex-1 break-all font-mono text-xs">{secret}</code>
            <Button variant="ghost" size="icon-sm" onClick={copySecret}>
              {copied ? <CheckIcon className="text-emerald-500" /> : <CopyIcon />}
            </Button>
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={() => setSecret(null)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Удаление ключа */}
      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("apikeys.revokeTitle")}</DialogTitle>
            <DialogDescription>
              {t("apikeys.revokeConfirm", { name: deleting?.description ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmDelete}>
              <Trash2Icon data-icon="inline-start" />
              {t("apikeys.revoke")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
