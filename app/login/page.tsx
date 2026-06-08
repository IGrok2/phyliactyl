"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  HexagonIcon,
  LoaderCircleIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useT } from "@/components/i18n-provider"
import { useBrand } from "@/components/brand-provider"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useT()
  const brand = useBrand()
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [user, setUser] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [totp, setTotp] = React.useState("")
  const [needTotp, setNeedTotp] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace("/")
      })
      .catch(() => {})
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password, totp: totp || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.twoFactor) {
          setNeedTotp(true)
          toast.info(t("auth.totp"), { description: t("auth.totpHint") })
        } else {
          toast.error(t("auth.error"), { description: data.error })
        }
        setLoading(false)
        return
      }
      toast.success(t("auth.success"), {
        description: data.account?.username ?? t("auth.successDesc"),
      })
      router.replace("/")
    } catch (err) {
      toast.error(t("auth.error"), { description: (err as Error).message })
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-foreground/[0.04] blur-3xl" />
        <div className="bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] absolute inset-0 opacity-40 [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="absolute right-4 top-4">
        <LanguageSwitcher className="h-8 w-auto gap-1.5 rounded-xl" />
      </div>

      <div className="animate-in fade-in zoom-in-95 w-full max-w-sm duration-500">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="bg-foreground text-background flex size-12 items-center justify-center rounded-2xl shadow-lg">
            <HexagonIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{brand.name}</h1>
            {brand.tagline && (
              <p className="text-muted-foreground text-sm">{brand.tagline}</p>
            )}
          </div>
        </div>

        <Card className="rounded-3xl border-border/60 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">{t("auth.welcome")}</CardTitle>
            <CardDescription>{t("auth.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="user">{t("auth.username")}</Label>
                <Input
                  id="user"
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  required
                  disabled={needTotp}
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={needTotp}
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    aria-label={t("auth.password")}
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>

              {needTotp && (
                <div className="animate-in fade-in slide-in-from-top-1 flex flex-col gap-2">
                  <Label htmlFor="totp" className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="size-3.5" />
                    {t("auth.totp")}
                  </Label>
                  <Input
                    id="totp"
                    inputMode="numeric"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    placeholder="123456"
                    autoFocus
                    className="rounded-xl text-center font-mono tracking-[0.4em]"
                  />
                  <p className="text-muted-foreground text-xs">{t("auth.totpHint")}</p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-1 h-10 rounded-xl">
                {loading ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" />
                    {t("auth.signingIn")}
                  </>
                ) : (
                  <>
                    {t("auth.signIn")}
                    <ArrowRightIcon data-icon="inline-end" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          {t("auth.poweredBy")} <span className="text-foreground font-medium">{brand.name}</span>
        </p>
      </div>
    </div>
  )
}
