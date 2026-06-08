"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  KeyRoundIcon,
  SaveIcon,
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  CircleAlertIcon,
  Code2Icon,
} from "lucide-react"

import { bff, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
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

interface SettingsState {
  configured: boolean
  masked: string
  source: "env" | "session" | null
  fromEnv: boolean
  isAdmin: boolean
}

export default function ApplicationApiPage() {
  const { t } = useT()
  const [state, setState] = React.useState<SettingsState | null>(null)
  const [appKey, setAppKey] = React.useState("")
  // По умолчанию ключ скрыт (заблюрен).
  const [revealed, setRevealed] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [removing, setRemoving] = React.useState(false)

  const load = React.useCallback(() => {
    bff<SettingsState>("/settings").then((res) => {
      if (res.data) setState(res.data)
    })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function save() {
    if (!appKey.trim()) return
    setSaving(true)
    const res = await apiSend("/settings", "POST", { appKey: appKey.trim() })
    setSaving(false)
    if (res.error) {
      toast.error(t("settings.panel.keyError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.keySaved"))
    setAppKey("")
    setRevealed(false)
    load()
  }

  async function clearKey() {
    setRemoving(true)
    const res = await apiSend("/settings", "DELETE")
    setRemoving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(t("settings.panel.keyCleared"))
    load()
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto flex w-full max-w-2xl flex-col gap-5 duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("applications.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("applications.subtitle")}</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2Icon className="size-4" />
            {t("settings.panel.appKey")}
          </CardTitle>
          <CardDescription>{t("settings.panel.appKeyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-2.5">
              {state?.configured ? (
                <ShieldCheckIcon className="text-emerald-500 size-5" />
              ) : (
                <CircleAlertIcon className="text-amber-500 size-5" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {state?.configured
                    ? t("settings.panel.keyActive")
                    : t("settings.panel.keyMissing")}
                </p>
                {state?.configured && (
                  <p className="text-muted-foreground font-mono text-xs">{state.masked}</p>
                )}
              </div>
            </div>
            {state?.source && (
              <Badge variant="secondary" className="font-normal">
                {state.source === "env"
                  ? t("settings.panel.sourceEnv")
                  : t("settings.panel.sourceSession")}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="app-key">{t("settings.panel.newKey")}</Label>
            <div className="relative">
              <Input
                id="app-key"
                type={revealed ? "text" : "password"}
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                placeholder="ptla_..."
                autoComplete="off"
                className={`rounded-xl pr-10 font-mono ${revealed ? "" : "[-webkit-text-security:disc]"}`}
              />
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                aria-label={t("settings.panel.toggleReveal")}
              >
                {revealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            <p className="text-muted-foreground text-xs">{t("settings.panel.appKeyHint")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="rounded-xl" onClick={save} disabled={saving || !appKey.trim()}>
              {saving ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
              {t("settings.panel.saveKey")}
            </Button>
            {state?.source === "session" && (
              <Button variant="outline" className="rounded-xl" onClick={clearKey} disabled={removing}>
                {removing ? <LoaderCircleIcon className="animate-spin" /> : <Trash2Icon data-icon="inline-start" />}
                {t("settings.panel.clearKey")}
              </Button>
            )}
          </div>

          {state?.fromEnv && (
            <p className="text-muted-foreground text-xs">{t("settings.panel.envNote")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRoundIcon className="size-4" />
            {t("applications.howto")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
          <p>{t("applications.step1")}</p>
          <p>{t("applications.step2")}</p>
          <p>{t("applications.step3")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
