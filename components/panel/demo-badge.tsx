"use client"

import { FlaskConicalIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/components/i18n-provider"

export function DemoBadge({ show }: { show: boolean }) {
  const { t } = useT()
  if (!show) return null
  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <FlaskConicalIcon className="size-3" />
      {t("common.demoBadge")}
    </Badge>
  )
}
