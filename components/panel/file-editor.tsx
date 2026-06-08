"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { SaveIcon, LoaderCircleIcon, FileCodeIcon } from "lucide-react"

import { bff, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { langForFile } from "@/components/panel/code-lang"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Редактор кода грузим только на клиенте (Prism обращается к DOM).
const CodeEditor = dynamic(() => import("@/components/panel/code-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
    </div>
  ),
})

export function FileEditor({
  serverId,
  file,
  onClose,
}: {
  serverId: string
  file: string | null
  onClose: () => void
}) {
  const { t } = useT()
  const [content, setContent] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!file) return
    setLoading(true)
    setContent("")
    bff<{ content: string }>(
      `/servers/${serverId}/files/contents?file=${encodeURIComponent(file)}`,
    ).then((res) => {
      if (res.error) {
        toast.error(t("files.loadError"), { description: res.error })
        onClose()
      } else {
        setContent(res.data?.content ?? "")
      }
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, serverId])

  async function save() {
    if (!file) return
    setSaving(true)
    const res = await apiSend(`/servers/${serverId}/files/write`, "POST", {
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

  const fileName = file?.split("/").pop() ?? ""
  const lang = file ? langForFile(file) : ""

  return (
    <Dialog open={file !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-3 rounded-2xl p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 font-mono text-sm">
            <FileCodeIcon className="size-4" />
            {fileName}
            {lang && (
              <Badge variant="secondary" className="font-normal uppercase">
                {lang}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mx-4 flex-1 overflow-auto rounded-xl border bg-[#1d1d1d]">
          {loading ? (
            <div className="flex h-[55vh] items-center justify-center">
              <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : (
            <div className="min-h-[55vh]">
              <CodeEditor value={content} onChange={setContent} filename={file ?? ""} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button className="rounded-xl" onClick={save} disabled={saving || loading}>
            {saving ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon data-icon="inline-start" />}
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
