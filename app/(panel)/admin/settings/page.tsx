"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  SaveIcon,
  LoaderCircleIcon,
  PaletteIcon,
  MailIcon,
  SparklesIcon,
  NetworkIcon,
} from "lucide-react"

import { bff, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { useBrand } from "@/components/brand-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SmtpData {
  host: string
  port: number
  encryption: "tls" | "ssl" | "none"
  username: string
  password: string
  fromAddress: string
  fromName: string
  hasPassword: boolean
}

interface HttpData {
  connectionTimeout: number
  requestTimeout: number
  proxy: string
  userAgent: string
}

interface AllocationData {
  enabled: boolean
  startPort: number
  endPort: number
}

interface PanelSettingsData {
  brand: { name: string; tagline: string }
  detectedName: string | null
  smtp: SmtpData
  http: HttpData
  allocation: AllocationData
}

export default function PanelSettingsPage() {
  const { t } = useT()
  const brand = useBrand()

  const [data, setData] = React.useState<PanelSettingsData | null>(null)
  const [brandName, setBrandName] = React.useState("")
  const [brandTagline, setBrandTagline] = React.useState("")
  const [smtp, setSmtp] = React.useState<SmtpData | null>(null)
  const [http, setHttp] = React.useState<HttpData | null>(null)
  const [alloc, setAlloc] = React.useState<AllocationData | null>(null)
  const [savingBrand, setSavingBrand] = React.useState(false)
  const [savingSmtp, setSavingSmtp] = React.useState(false)
  const [savingHttp, setSavingHttp] = React.useState(false)
  const [savingAlloc, setSavingAlloc] = React.useState(false)

  const load = React.useCallback(() => {
    bff<PanelSettingsData>("/admin/panel-settings").then((res) => {
      if (res.data) {
        setData(res.data)
        setBrandName(res.data.brand.name)
        setBrandTagline(res.data.brand.tagline)
        setSmtp(res.data.smtp)
        setHttp(res.data.http)
        setAlloc(res.data.allocation)
      }
    })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function saveBrand() {
    setSavingBrand(true)
    const res = await apiSend("/admin/panel-settings", "PATCH", {
      brand: { name: brandName, tagline: brandTagline },
    })
    setSavingBrand(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.brandSaved"))
    brand.reload()
  }

  async function saveSmtp() {
    if (!smtp) return
    setSavingSmtp(true)
    const res = await apiSend("/admin/panel-settings", "PATCH", { smtp })
    setSavingSmtp(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.smtpSaved"))
    load()
  }

  async function saveHttp() {
    if (!http) return
    setSavingHttp(true)
    const res = await apiSend("/admin/panel-settings", "PATCH", { http })
    setSavingHttp(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.httpSaved"))
    load()
  }

  async function saveAlloc() {
    if (!alloc) return
    setSavingAlloc(true)
    const res = await apiSend("/admin/panel-settings", "PATCH", { allocation: alloc })
    setSavingAlloc(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.allocSaved"))
    load()
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto flex w-full max-w-3xl flex-col gap-6 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.panel.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("settings.panel.generalSubtitle")}</p>
      </div>

      {/* Брендирование */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PaletteIcon className="size-5" />
            {t("settings.panel.branding")}
          </CardTitle>
          <CardDescription>{t("settings.panel.brandingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="b-name">{t("settings.panel.brandName")}</Label>
              <Input
                id="b-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={data?.detectedName || "Phyliactyl"}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="b-tag">{t("settings.panel.brandTagline")}</Label>
              <Input
                id="b-tag"
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder={t("brand.tagline")}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
            <SparklesIcon className="size-3" />
            {data?.detectedName
              ? t("settings.panel.detected", { name: data.detectedName })
              : t("settings.panel.detectNone")}
            {brand.source === "pterodactyl" && (
              <Badge variant="secondary" className="font-normal">
                {t("settings.panel.usingPtero")}
              </Badge>
            )}
          </p>
          <div>
            <Button className="rounded-xl" onClick={saveBrand} disabled={savingBrand}>
              {savingBrand ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              {t("common.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced — HTTP Connections */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <NetworkIcon className="size-5" />
            {t("settings.panel.http")}
          </CardTitle>
          <CardDescription>{t("settings.panel.httpDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {http && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="h-conn">{t("settings.panel.httpConnTimeout")}</Label>
                  <Input id="h-conn" type="number" value={http.connectionTimeout} onChange={(e) => setHttp({ ...http, connectionTimeout: Number(e.target.value) })} className="h-10 rounded-xl" />
                  <p className="text-muted-foreground text-xs">{t("settings.panel.httpConnTimeoutHint")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="h-req">{t("settings.panel.httpReqTimeout")}</Label>
                  <Input id="h-req" type="number" value={http.requestTimeout} onChange={(e) => setHttp({ ...http, requestTimeout: Number(e.target.value) })} className="h-10 rounded-xl" />
                  <p className="text-muted-foreground text-xs">{t("settings.panel.httpReqTimeoutHint")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="h-proxy">{t("settings.panel.httpProxy")}</Label>
                  <Input id="h-proxy" value={http.proxy} onChange={(e) => setHttp({ ...http, proxy: e.target.value })} placeholder="http://proxy:3128" className="h-10 rounded-xl font-mono" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="h-ua">{t("settings.panel.httpUserAgent")}</Label>
                  <Input id="h-ua" value={http.userAgent} onChange={(e) => setHttp({ ...http, userAgent: e.target.value })} placeholder="Phyliactyl/1.0" className="h-10 rounded-xl" />
                </div>
              </div>
              <div>
                <Button className="rounded-xl" onClick={saveHttp} disabled={savingHttp}>
                  {savingHttp ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
                  {t("common.save")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Automatic Allocation Creation */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <NetworkIcon className="size-5" />
            {t("settings.panel.alloc")}
          </CardTitle>
          <CardDescription>{t("settings.panel.allocDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {alloc && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label>{t("settings.panel.allocEnabled")}</Label>
                  <Select value={alloc.enabled ? "enabled" : "disabled"} onValueChange={(v) => setAlloc({ ...alloc, enabled: v === "enabled" })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">{t("settings.panel.statusEnabled")}</SelectItem>
                      <SelectItem value="disabled">{t("settings.panel.statusDisabled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="a-start">{t("settings.panel.allocStart")}</Label>
                  <Input id="a-start" type="number" value={alloc.startPort} onChange={(e) => setAlloc({ ...alloc, startPort: Number(e.target.value) })} placeholder="25565" disabled={!alloc.enabled} className="h-10 rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="a-end">{t("settings.panel.allocEnd")}</Label>
                  <Input id="a-end" type="number" value={alloc.endPort} onChange={(e) => setAlloc({ ...alloc, endPort: Number(e.target.value) })} placeholder="26000" disabled={!alloc.enabled} className="h-10 rounded-xl" />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">{t("settings.panel.allocEnabledHint")}</p>
              <div>
                <Button className="rounded-xl" onClick={saveAlloc} disabled={savingAlloc}>
                  {savingAlloc ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
                  {t("common.save")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Email (SMTP) */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MailIcon className="size-5" />
            {t("settings.panel.smtp")}
          </CardTitle>
          <CardDescription>{t("settings.panel.smtpDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {smtp && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="s-host">{t("settings.panel.smtpHost")}</Label>
                  <Input id="s-host" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.example.com" className="h-10 rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="s-port">{t("settings.panel.smtpPort")}</Label>
                  <Input id="s-port" type="number" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label>{t("settings.panel.smtpEncryption")}</Label>
                  <Select value={smtp.encryption} onValueChange={(v) => setSmtp({ ...smtp, encryption: v as SmtpData["encryption"] })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">{t("settings.panel.smtpNone")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="s-user">{t("settings.panel.smtpUser")}</Label>
                  <Input id="s-user" value={smtp.username} onChange={(e) => setSmtp({ ...smtp, username: e.target.value })} className="h-10 rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="s-pass">{t("settings.panel.smtpPassword")}</Label>
                  <Input id="s-pass" type="password" value={smtp.password} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} placeholder={smtp.hasPassword ? "••••••••" : ""} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="s-from">{t("settings.panel.smtpFrom")}</Label>
                  <Input id="s-from" value={smtp.fromAddress} onChange={(e) => setSmtp({ ...smtp, fromAddress: e.target.value })} placeholder="noreply@example.com" className="h-10 rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="s-fromname">{t("settings.panel.smtpFromName")}</Label>
                  <Input id="s-fromname" value={smtp.fromName} onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })} className="h-10 rounded-xl" />
                </div>
              </div>
              <div>
                <Button className="rounded-xl" onClick={saveSmtp} disabled={savingSmtp}>
                  {savingSmtp ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
                  {t("common.save")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
