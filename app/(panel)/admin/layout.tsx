"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { useT } from "@/components/i18n-provider"

/**
 * Гард админ-зоны: только администраторы Pterodactyl (root_admin).
 * Не-админов перенаправляем на главную, чтобы они не видели админку
 * даже по прямой ссылке.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { t } = useT()
  const [state, setState] = React.useState<"checking" | "allowed" | "denied">(
    "checking",
  )

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.authenticated && d.isAdmin) {
          setState("allowed")
        } else if (!d.authenticated) {
          router.replace("/login")
        } else {
          setState("denied")
          router.replace("/")
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState("denied")
          router.replace("/")
        }
      })
    return () => {
      cancelled = true
    }
  }, [router])

  if (state !== "allowed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {state === "denied" ? t("admin.denied") : t("auth.checking")}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
