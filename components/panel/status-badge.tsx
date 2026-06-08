"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { statusMeta, type ServerStatus } from "@/lib/data"
import { useT } from "@/components/i18n-provider"

export function StatusBadge({
  status,
  className,
}: {
  status: ServerStatus
  className?: string
}) {
  const { t } = useT()
  const meta = statusMeta[status]
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(`status.${status}`)}
    </Badge>
  )
}
