"use client"

import Link from "next/link"
import { HexagonIcon, HouseIcon, ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n-provider"
import { useBrand } from "@/components/brand-provider"

export default function NotFound() {
  const { t } = useT()
  const brand = useBrand()

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-4">
      {/* Фон в стиле страницы входа */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-foreground/[0.04] absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl" />
        <div className="bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] absolute inset-0 opacity-40 [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-md flex-col items-center gap-6 text-center duration-500">
        <div className="bg-foreground text-background flex size-12 items-center justify-center rounded-2xl shadow-lg">
          <HexagonIcon className="size-6" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground/60 text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
            404
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{t("notFound.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("notFound.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/">
              <HouseIcon data-icon="inline-start" />
              {t("notFound.home")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/">
              <ArrowLeftIcon data-icon="inline-start" />
              {t("common.back")}
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground/70 text-xs">{brand.name}</p>
      </div>
    </div>
  )
}
