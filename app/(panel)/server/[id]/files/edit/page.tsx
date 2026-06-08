"use client"

import * as React from "react"
import { use } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  SaveIcon,
  LoaderCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  HouseIcon,
} from "lucide-react"

import { bff, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { langForFile } from "@/components/panel/code-lang"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const CodeEditor = dynamic(() => import("@/components/panel/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center py-20">
      <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
    </div>
  ),
})

export default function FileEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
        </div>
      }
    >
      <FileEditorInner params={params} />
    </React.Suspense>
  )
}

function FileEditorInner({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const file = searchParams.get("file") ?? ""

  const [content, setContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const filesBase = `/server/${id}/files`
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) || "/" : "/"

  React.useEffect(() => {
    if (!file) {
      router.replace(filesBase)
      return
    }
    setLoading(true)
    bff<{ content: string }>(
      `/servers/${id}/files/contents?file=${encodeURIComponent(file)}`,
    ).then((res) => {
      if (res.error) {
        toast.error(t("files.loadError"), { description: res.error })
        router.replace(filesBase)
      } else {
        setContent(res.data?.content ?? "")
      }
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, id])

  async function save() {
    if (!file) return
    setSaving(true)
    const res = await apiSend(`/servers/${id}/files/write`, "POST", {
      file,
      content,
    })
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
    } else {
      toast.success(t("files.saved"), { description: file })
    }
  }

  const segments = file.split("/").filter(Boolean)
  const lang = file ? langForFile(file) : ""

  return (
    <div className="flex flex-col gap-4">
      {/* Заголовок + действия */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" className="rounded-xl" asChild>
            <Link href={`${filesBase}?dir=${encodeURIComponent(dir)}`}>
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("files.editing")}
            </h2>
          </div>
          {lang && (
            <Badge variant="secondary" className="font-normal uppercase">
              {lang}
            </Badge>
          )}
        </div>
        <Button className="rounded-xl" onClick={save} disabled={saving || loading}>
          {saving ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
          {t("common.save")}
        </Button>
      </div>

      {/* Путь (хлебные крошки) */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-1 font-mono text-sm">
        <Link href={filesBase} className="hover:text-foreground flex items-center gap-1 transition-colors">
          <HouseIcon className="size-4" />
        </Link>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1
          const target = "/" + segments.slice(0, i + 1).join("/")
          return (
            <React.Fragment key={target}>
              <ChevronRightIcon className="size-3.5" />
              {isLast ? (
                <span className="text-foreground font-medium">{seg}</span>
              ) : (
                <Link
                  href={`${filesBase}?dir=${encodeURIComponent(target)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {seg}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Редактор */}
      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
          </div>
        ) : (
          <div className="min-h-[60vh] bg-[#1d1d1d]">
            <CodeEditor value={content} onChange={setContent} filename={file} />
          </div>
        )}
      </Card>
    </div>
  )
}
