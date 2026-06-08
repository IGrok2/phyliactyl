"use client"

import Link from "next/link"
import { TriangleAlertIcon, KeyRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n-provider"

/**
 * Единый баннер ошибки для админ-страниц, работающих через Application API.
 * Распознаёт типовые причины:
 * - no_app_key — ключ не задан;
 * - unauthorized/403 — у ключа нет нужного права (resource permission).
 */
export function AdminError({
  error,
  resource,
  onReload,
}: {
  error: string
  resource: string
  onReload?: () => void
}) {
  const { t } = useT()
  const noKey = error === "no_app_key"
  const isPerm = /unauthorized|permission|forbidden|403/i.test(error)

  const message = noKey
    ? t("adminErr.noKey")
    : isPerm
      ? t("adminErr.perm", { resource })
      : error

  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-2xl border p-4 text-sm">
      <p className="text-destructive flex items-center gap-2 font-medium">
        <TriangleAlertIcon className="size-4" />
        {noKey ? t("adminErr.noKeyTitle") : t("adminErr.title")}
      </p>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link href="/admin/applications">
            <KeyRoundIcon data-icon="inline-start" />
            {t("nav.applications")}
          </Link>
        </Button>
        {onReload && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onReload}>
            {t("common.reload")}
          </Button>
        )}
      </div>
    </div>
  )
}
