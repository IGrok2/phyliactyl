"use client"

import * as React from "react"
import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  FolderIcon,
  FileIcon,
  FileTextIcon,
  FileCodeIcon,
  FileArchiveIcon,
  UploadIcon,
  FilePlusIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  HouseIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatBytes, type FileEntry } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function fileIcon(entry: FileEntry) {
  if (entry.type === "directory") return FolderIcon
  if (/\.(txt|properties|md|log|cfg|conf|ini|env)$/.test(entry.name)) return FileTextIcon
  if (/\.(json|sh|yml|yaml|js|ts|toml|xml|html|css)$/.test(entry.name)) return FileCodeIcon
  if (/\.(jar|zip|tar|gz|rar)$/.test(entry.name)) return FileArchiveIcon
  return FileIcon
}

function joinPath(dir: string, name: string) {
  return dir === "/" ? `/${name}` : `${dir}/${name}`
}

export default function FilesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <React.Suspense fallback={<div className="text-muted-foreground py-16 text-center text-sm">…</div>}>
      <FilesPageInner params={params} />
    </React.Suspense>
  )
}

function FilesPageInner({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dir, setDir] = React.useState(searchParams.get("dir") || "/")

  const { data: files, loading, reload } = useApiData<FileEntry[]>(
    `/servers/${id}/files?directory=${encodeURIComponent(dir)}`,
    [],
  )

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const segments = dir === "/" ? [] : dir.split("/").filter(Boolean)

  function openEntry(entry: FileEntry) {
    const full = joinPath(dir, entry.name)
    if (entry.type === "directory") setDir(full)
    else router.push(`/server/${id}/files/edit?file=${encodeURIComponent(full)}`)
  }

  function editFile(name: string) {
    const full = joinPath(dir, name)
    router.push(`/server/${id}/files/edit?file=${encodeURIComponent(full)}`)
  }

  async function deleteEntry(entry: FileEntry) {
    const res = await apiSend(`/servers/${id}/files/delete`, "POST", {
      root: dir,
      files: [entry.name],
    }).catch(() => ({ error: "network" }))
    if (res.error) toast.error(t("common.loadError"), { description: res.error })
    else {
      toast.error(t("common.delete"), { description: entry.name })
      reload()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("files.title")}
        description={t("files.subtitle")}
        action={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => toast(t("files.upload"))}>
              <UploadIcon data-icon="inline-start" />
              {t("files.upload")}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => toast.success(t("files.folder"))}>
              <FolderPlusIcon data-icon="inline-start" />
              {t("files.folder")}
            </Button>
            <Button className="rounded-xl" onClick={() => toast.success(t("files.file"))}>
              <FilePlusIcon data-icon="inline-start" />
              {t("files.file")}
            </Button>
          </>
        }
      />

      {/* Хлебные крошки */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={() => setDir("/")}
          className="hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <HouseIcon className="size-4" />
        </button>
        {segments.map((seg, i) => {
          const target = "/" + segments.slice(0, i + 1).join("/")
          const isLast = i === segments.length - 1
          return (
            <React.Fragment key={target}>
              <ChevronRightIcon className="size-3.5" />
              <button
                onClick={() => setDir(target)}
                className={cn(
                  "hover:text-foreground transition-colors",
                  isLast && "text-foreground font-medium",
                )}
              >
                {seg}
              </button>
            </React.Fragment>
          )
        })}
      </div>

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center text-sm">
            {t("files.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("files.col.name")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("files.col.size")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("files.col.modified")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("files.col.perms")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((entry) => {
                const Icon = fileIcon(entry)
                return (
                  <TableRow key={entry.name} className="group cursor-pointer">
                    <TableCell onClick={() => openEntry(entry)}>
                      <span className="flex items-center gap-2.5 font-medium">
                        <Icon
                          className={cn(
                            "size-4",
                            entry.type === "directory" ? "text-foreground" : "text-muted-foreground",
                          )}
                        />
                        {entry.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden tabular-nums sm:table-cell" onClick={() => openEntry(entry)}>
                      {entry.type === "directory" ? "—" : formatBytes(entry.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell" onClick={() => openEntry(entry)}>
                      {entry.modified ? new Date(entry.modified).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell" onClick={() => openEntry(entry)}>
                      {entry.mode}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                            <MoreVerticalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {entry.type === "file" && (
                            <DropdownMenuItem onClick={() => editFile(entry.name)}>
                              <PencilIcon />
                              {t("common.edit")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toast(t("common.download"))}>
                            <DownloadIcon />
                            {t("common.download")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => deleteEntry(entry)}>
                            <Trash2Icon />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
