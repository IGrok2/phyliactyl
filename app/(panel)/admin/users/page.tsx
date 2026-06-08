"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  UserPlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  Trash2Icon,
  PencilIcon,
  MoreVerticalIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
} from "lucide-react"

import { type PanelUser } from "@/lib/data"
import { useApiData, apiSend } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { AdminError } from "@/components/panel/admin-error"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UsersResponse {
  users: PanelUser[]
  pagination: {
    total: number
    currentPage: number
    totalPages: number
    perPage: number
  }
}

interface UserForm {
  email: string
  username: string
  first_name: string
  last_name: string
  password: string
  root_admin: boolean
}

const emptyForm: UserForm = {
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  password: "",
  root_admin: false,
}

export default function AdminUsersPage() {
  const { t } = useT()
  const [search, setSearch] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)

  // дебаунс поиска по email
  React.useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  const path = `/admin/users?page=${page}${query ? `&email=${encodeURIComponent(query)}` : ""}`
  const { data, loading, error, reload } = useApiData<UsersResponse>(path, {
    users: [],
    pagination: { total: 0, currentPage: 1, totalPages: 1, perPage: 50 },
  })

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PanelUser | null>(null)
  const [form, setForm] = React.useState<UserForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState<PanelUser | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(user: PanelUser) {
    setEditing(user)
    setForm({
      email: user.email,
      username: user.username,
      first_name: user.firstName ?? "",
      last_name: user.lastName ?? "",
      password: "",
      root_admin: user.admin,
    })
    setDialogOpen(true)
  }

  async function submit() {
    if (!form.email || !form.username) {
      toast.error(t("admin.users.validation"))
      return
    }
    setSaving(true)
    const res = editing
      ? await apiSend(`/admin/users/${editing.id}`, "PATCH", form)
      : await apiSend(`/admin/users`, "POST", form)
    setSaving(false)
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
      return
    }
    toast.success(editing ? t("admin.users.updated") : t("admin.users.created"), {
      description: form.username,
    })
    setDialogOpen(false)
    reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await apiSend(`/admin/users/${deleting.id}`, "DELETE")
    if (res.error) {
      toast.error(t("common.loadError"), { description: res.error })
    } else {
      toast.success(t("admin.users.deleted"), { description: deleting.username })
      reload()
    }
    setDeleting(null)
  }

  const users = data.users
  const pg = data.pagination

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5 duration-500">
      <SectionHeader
        title={t("admin.users")}
        description={t("admin.users.subtitle")}
        action={
          <Button className="rounded-xl" onClick={openCreate}>
            <UserPlusIcon data-icon="inline-start" />
            {t("admin.users.add")}
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.searchEmail")}
            className="rounded-xl pl-8"
          />
        </div>
        {pg.total > 0 && (
          <span className="text-muted-foreground text-sm tabular-nums">
            {t("admin.users.total", { count: String(pg.total) })}
          </span>
        )}
      </div>

      {error && (
        <AdminError error={error} resource={t("admin.users")} onReload={reload} />
      )}

      <Card className="overflow-hidden rounded-2xl p-0">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-muted-foreground py-16 text-center text-sm">
            {t("admin.users.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("account.username")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("account.email")}</TableHead>
                <TableHead>{t("admin.role.user")}</TableHead>
                <TableHead className="hidden sm:table-cell">2FA</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-medium">
                      <Avatar className="size-8">
                        <AvatarFallback style={{ background: user.avatarColor }} className="text-background text-xs">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.admin ? (
                      <Badge variant="default" className="gap-1 font-normal">
                        <ShieldCheckIcon className="size-3" />
                        {t("admin.role.admin")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <ShieldIcon className="size-3" />
                        {t("admin.role.user")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {user.twoFactor ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <span className="bg-emerald-500 size-1.5 rounded-full" />
                        2FA
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(user)}>
                          <PencilIcon />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleting(user)}>
                          <Trash2Icon />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Пагинация (50 на страницу) */}
      {pg.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            {t("common.prev")}
          </Button>
          <span className="text-muted-foreground text-sm tabular-nums">
            {t("admin.users.pageOf", {
              page: String(pg.currentPage),
              total: String(pg.totalPages),
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page >= pg.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("common.next")}
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      )}

      {/* Диалог создания/редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("admin.users.editTitle") : t("admin.users.add")}
            </DialogTitle>
            <DialogDescription>
              {editing ? editing.email : t("admin.users.createHint")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-email">{t("account.email")}</Label>
              <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-username">{t("account.username")}</Label>
              <Input id="u-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-first">{t("admin.users.firstName")}</Label>
                <Input id="u-first" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="u-last">{t("admin.users.lastName")}</Label>
                <Input id="u-last" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-pass">
                {editing ? t("admin.users.newPasswordOptional") : t("auth.password")}
              </Label>
              <Input id="u-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="rounded-xl" />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-sm font-medium">{t("admin.users.adminRole")}</p>
                <p className="text-muted-foreground text-xs">{t("admin.users.adminRoleHint")}</p>
              </div>
              <Switch checked={form.root_admin} onCheckedChange={(v) => setForm({ ...form, root_admin: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="rounded-xl" onClick={submit} disabled={saving}>
              {saving && <LoaderCircleIcon className="animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("admin.users.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.deleteConfirm", { name: deleting?.username ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmDelete}>
              <Trash2Icon data-icon="inline-start" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
