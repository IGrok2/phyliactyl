"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ShieldCheckIcon,
  LanguagesIcon,
  UserIcon,
  ActivityIcon,
  KeyIcon,
  PlusIcon,
  Trash2Icon,
  LoaderCircleIcon,
  GlobeIcon,
  TerminalIcon,
  MonitorIcon,
  InfoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { type ActivityEntry, type SshKey } from "@/lib/data"
import { useApiData, apiSend, bff } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { useT } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"

interface Account {
  username: string
  email: string
  admin: boolean
}

function eventFailed(event: string) {
  return /fail|failed|denied|error/i.test(event)
}

export default function AccountPage() {
  const { t } = useT()
  const [account, setAccount] = React.useState<Account | null>(null)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.account) setAccount(d.account)
      })
      .catch(() => {})
  }, [])

  const initials = (account?.username ?? "··").slice(0, 2).toUpperCase()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex w-full max-w-6xl flex-col gap-6 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("account.subtitle")}</p>
      </div>

      {/* Профиль + язык/безопасность в один ряд */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="size-5" />
              {t("account.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarFallback className="bg-foreground text-background text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{account?.username ?? "—"}</p>
                <p className="text-muted-foreground truncate text-sm">{account?.email ?? ""}</p>
              </div>
              {account?.admin && (
                <Badge variant="secondary" className="ml-auto gap-1 font-normal">
                  <ShieldCheckIcon className="size-3" />
                  {t("admin.role.admin")}
                </Badge>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>{t("account.username")}</Label>
                <Input value={account?.username ?? ""} readOnly className="h-10 rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("account.email")}</Label>
                <Input value={account?.email ?? ""} readOnly className="h-10 rounded-xl" />
              </div>
            </div>
            <Alert variant="info">
              <InfoIcon />
              <AlertTitle>{t("account.managedTitle")}</AlertTitle>
              <AlertDescription>{t("account.managedInPtero")}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LanguagesIcon className="size-5" />
                {t("account.language")}
              </CardTitle>
              <CardDescription>{t("account.languageDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher className="w-56 rounded-xl" />
            </CardContent>
          </Card>

          <TwoFactorCard />
        </div>
      </div>

      <SshKeysSection />
      <ActivitySection />
    </div>
  )
}

function SshKeysSection() {
  const { t } = useT()
  const { data: keys, loading, error, reload } = useApiData<SshKey[]>(
    "/account/ssh-keys",
    [],
  )
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [publicKey, setPublicKey] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<SshKey | null>(null)

  async function create() {
    if (!name.trim() || !publicKey.trim()) {
      toast.error(t("ssh.validation"))
      return
    }
    setSaving(true)
    const res = await apiSend("/account/ssh-keys", "POST", {
      name: name.trim(),
      public_key: publicKey.trim(),
    })
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("ssh.added"), { description: name })
    setOpen(false)
    setName("")
    setPublicKey("")
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await bff("/account/ssh-keys", {
      method: "DELETE",
      body: JSON.stringify({ fingerprint: deleting.fingerprint }),
    })
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.success(t("ssh.removed"), { description: deleting.name })
      reload()
    }
    setDeleting(null)
  }

  return (
    <Card className="overflow-hidden rounded-3xl p-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-5">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyIcon className="size-5" />
            {t("ssh.title")}
          </CardTitle>
          <CardDescription>{t("ssh.subtitle")}</CardDescription>
        </div>
        <Button className="rounded-xl" onClick={() => setOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          {t("ssh.add")}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-5 pb-5">
            <Alert variant="destructive">
              <InfoIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="px-5 pb-5">
            <Alert variant="info">
              <KeyIcon />
              <AlertDescription>{t("ssh.empty")}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("ssh.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("ssh.fingerprint")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("apikeys.created")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.fingerprint} className="group">
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs md:table-cell">
                    {k.fingerprint}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(k)}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ssh.add")}</DialogTitle>
            <DialogDescription>{t("ssh.addHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ssh-name">{t("ssh.name")}</Label>
              <Input id="ssh-name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ssh-key">{t("ssh.publicKey")}</Label>
              <textarea
                id="ssh-key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="ssh-ed25519 AAAA..."
                rows={4}
                className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus-visible:ring-[3px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={create} disabled={saving}>
              {saving && <LoaderCircleIcon className="animate-spin" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("ssh.removeTitle")}</DialogTitle>
            <DialogDescription>{t("ssh.removeConfirm", { name: deleting?.name ?? "" })}</DialogDescription>
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
    </Card>
  )
}

function ActivitySection() {
  const { t } = useT()
  const { data: activity, loading, error } = useApiData<ActivityEntry[]>(
    "/account/activity",
    [],
  )

  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(activity.length / PAGE_SIZE))
  // Защита от выхода за пределы при изменении данных.
  React.useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])
  const start = (page - 1) * PAGE_SIZE
  const pageItems = activity.slice(start, start + PAGE_SIZE)

  return (
    <Card className="overflow-hidden rounded-3xl p-0">
      <CardHeader className="p-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ActivityIcon className="size-5" />
          {t("activity.title")}
        </CardTitle>
        <CardDescription>{t("activity.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="px-5 pb-5">
            <Alert variant="destructive">
              <InfoIcon />
              <AlertTitle>{t("common.loadError")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="px-5 pb-5">
            <Alert variant="info">
              <ActivityIcon />
              <AlertDescription>{t("activity.empty")}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("activity.event")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("activity.type")}</TableHead>
                  <TableHead>{t("activity.ip")}</TableHead>
                  <TableHead>{t("activity.result")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("activity.time")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((a) => {
                  const failed = eventFailed(a.event)
                  return (
                    <TableRow key={a.id} className="group">
                      <TableCell className="font-medium">
                        <span className="font-mono text-xs">{a.event}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="gap-1 font-normal">
                          {a.isApi ? <TerminalIcon className="size-3" /> : <MonitorIcon className="size-3" />}
                          {a.isApi ? "API" : t("activity.web")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        <span className="flex items-center gap-1.5">
                          <GlobeIcon className="size-3" />
                          {a.ip ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            failed ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", failed ? "bg-destructive" : "bg-emerald-500")} />
                          {failed ? t("activity.failed") : t("activity.success")}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell text-xs">
                        {a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
                <span className="text-muted-foreground text-xs tabular-nums">
                  {t("activity.range", {
                    from: String(start + 1),
                    to: String(Math.min(start + PAGE_SIZE, activity.length)),
                    total: String(activity.length),
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeftIcon data-icon="inline-start" />
                    {t("common.prev")}
                  </Button>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("admin.users.pageOf", { page: String(page), total: String(totalPages) })}
                  </span>
                  <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    {t("common.next")}
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}



function TwoFactorCard() {
  const { t } = useT()
  const [setupOpen, setSetupOpen] = React.useState(false)
  const [disableOpen, setDisableOpen] = React.useState(false)

  // данные настройки
  const [otpauth, setOtpauth] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [qr, setQr] = React.useState("")
  const [code, setCode] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [enabling, setEnabling] = React.useState(false)
  const [tokens, setTokens] = React.useState<string[] | null>(null)

  // отключение
  const [password, setPassword] = React.useState("")
  const [disabling, setDisabling] = React.useState(false)

  async function openSetup() {
    setSetupOpen(true)
    setTokens(null)
    setCode("")
    setOtpauth("")
    setSecret("")
    setQr("")
    setLoading(true)
    const res = await bff<{ otpauth: string; secret: string }>("/account/2fa")
    setLoading(false)
    if (res.error || !res.data) {
      toast.error(t("common.loadError"), { description: res.error })
      setSetupOpen(false)
      return
    }
    setOtpauth(res.data.otpauth)
    setSecret(res.data.secret)
    // QR генерируем на клиенте — секрет не покидает браузер.
    try {
      const QRCode = (await import("qrcode")).default
      const url = await QRCode.toDataURL(res.data.otpauth, { width: 220, margin: 1 })
      setQr(url)
    } catch {
      // если не вышло — останется ручной ввод секрета
    }
  }

  async function enable() {
    if (code.trim().length < 6) {
      toast.error(t("twofa.codeRequired"))
      return
    }
    setEnabling(true)
    const res = await bff<{ tokens: string[] }>("/account/2fa", {
      method: "POST",
      body: JSON.stringify({ code: code.trim() }),
    })
    setEnabling(false)
    if (res.error || !res.data) {
      toast.error(t("twofa.enableError"), { description: res.error })
      return
    }
    setTokens(res.data.tokens)
    toast.success(t("twofa.enabled"))
  }

  async function disable() {
    if (!password) {
      toast.error(t("twofa.passwordRequired"))
      return
    }
    setDisabling(true)
    const res = await bff("/account/2fa", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    })
    setDisabling(false)
    if (res.error) {
      toast.error(t("twofa.disableError"), { description: res.error })
      return
    }
    toast.success(t("twofa.disabled"))
    setDisableOpen(false)
    setPassword("")
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text)
    toast.success(t("common.copied"))
  }

  return (
    <Card className="flex-1 rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheckIcon className="size-5" />
          {t("account.twoFa")}
        </CardTitle>
        <CardDescription>{t("twofa.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" onClick={openSetup}>
            <ShieldCheckIcon data-icon="inline-start" />
            {t("twofa.enable")}
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => setDisableOpen(true)}>
            {t("twofa.disable")}
          </Button>
        </div>
      </CardContent>

      {/* Настройка/включение 2FA */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("twofa.setupTitle")}</DialogTitle>
            <DialogDescription>{t("twofa.setupHint")}</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : tokens ? (
            <div className="flex flex-col gap-3">
              <Alert variant="warning">
                <ShieldCheckIcon />
                <AlertTitle>{t("twofa.recoveryTitle")}</AlertTitle>
                <AlertDescription>{t("twofa.recoveryHint")}</AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-3 font-mono text-xs">
                {tokens.map((tk) => (
                  <span key={tk}>{tk}</span>
                ))}
              </div>
              <Button variant="outline" className="rounded-xl" onClick={() => copy(tokens.join("\n"))}>
                <CopyIcon data-icon="inline-start" />
                {t("twofa.copyCodes")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {qr && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr}
                    alt="2FA QR"
                    width={200}
                    height={200}
                    className="rounded-xl border bg-white p-2"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label>{t("twofa.secret")}</Label>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl border bg-muted/40 px-3 py-2 font-mono text-xs">
                    {secret || "—"}
                  </code>
                  <Button variant="outline" size="icon" className="shrink-0 rounded-xl" onClick={() => copy(secret)}>
                    <CopyIcon />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">{t("twofa.secretHint")}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tf-code">{t("twofa.code")}</Label>
                <Input
                  id="tf-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="rounded-xl text-center font-mono tracking-[0.4em]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {tokens ? (
              <Button className="rounded-xl" onClick={() => setSetupOpen(false)}>
                {t("common.close")}
              </Button>
            ) : (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setSetupOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button className="rounded-xl" onClick={enable} disabled={enabling || loading}>
                  {enabling && <LoaderCircleIcon className="animate-spin" />}
                  {t("twofa.enable")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Отключение 2FA */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("twofa.disable")}</DialogTitle>
            <DialogDescription>{t("twofa.disableHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tf-pass">{t("account.currentPassword")}</Label>
            <Input id="tf-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDisableOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={disable} disabled={disabling}>
              {disabling && <LoaderCircleIcon className="animate-spin" />}
              {t("twofa.disable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
