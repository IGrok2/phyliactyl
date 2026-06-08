"use client"

import * as React from "react"
import { use } from "react"
import { toast } from "sonner"
import { UserPlusIcon, Trash2Icon, ShieldCheckIcon, MailIcon } from "lucide-react"

import { subusers as mockSubusers, allPermissions, type Subuser } from "@/lib/data"
import { useApiData } from "@/lib/api"
import { useT } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from "@/components/panel/section-header"
import { DemoBadge } from "@/components/panel/demo-badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const permLabel = (key: string) => {
  for (const group of allPermissions) {
    const found = group.items.find((i) => i.key === key)
    if (found) return found.label
  }
  return key
}

export default function ServerUsersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useT()
  const { data: subusers, loading, demo } = useApiData<Subuser[]>(
    `/servers/${id}/subusers`,
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t("subusers.title")}
        description={t("subusers.subtitle")}
        action={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <UserPlusIcon data-icon="inline-start" />
                {t("subusers.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("subusers.add")}</DialogTitle>
                <DialogDescription>{t("subusers.subtitle")}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" placeholder="user@example.com" className="rounded-xl" />
                </div>
                <Separator />
                <ScrollArea className="h-56 pr-3">
                  <div className="flex flex-col gap-4">
                    {allPermissions.map((group) => (
                      <div key={group.group} className="flex flex-col gap-2">
                        <span className="text-muted-foreground text-xs font-medium">
                          {group.group}
                        </span>
                        {group.items.map((item) => (
                          <div key={item.key} className="flex items-center justify-between gap-2">
                            <Label htmlFor={item.key} className="font-normal">{item.label}</Label>
                            <Switch id={item.key} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl">{t("common.cancel")}</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button className="rounded-xl" onClick={() => toast.success(t("subusers.add"))}>
                    {t("common.create")}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DemoBadge show={demo} />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subusers.map((user) => (
            <Card key={user.id} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback style={{ background: user.avatarColor }} className="text-background text-xs">
                      {user.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5 truncate text-sm">
                      <MailIcon className="text-muted-foreground size-3.5 shrink-0" />
                      {user.email}
                    </span>
                    {user.twoFactor && (
                      <span className="text-muted-foreground flex items-center gap-1 text-xs font-normal">
                        <ShieldCheckIcon className="size-3" />
                        {t("subusers.twoFa")}
                      </span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {user.permissions.map((p) => (
                    <Badge key={p} variant="secondary" className="font-normal">
                      {permLabel(p)}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => toast.error(t("subusers.remove"), { description: user.email })}
                >
                  <Trash2Icon data-icon="inline-start" />
                  {t("subusers.remove")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
