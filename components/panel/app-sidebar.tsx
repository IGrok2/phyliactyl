"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HexagonIcon,
  ServerIcon,
  LayoutDashboardIcon,
  HardDriveIcon,
  MapPinIcon,
  UsersIcon,
  UserCogIcon,
  KeyRoundIcon,
  LifeBuoyIcon,
  EggIcon,
  FolderSymlinkIcon,
  SlidersHorizontalIcon,
  Code2Icon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useT } from "@/components/i18n-provider"
import { useBrand } from "@/components/brand-provider"

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}

const mainNav: NavItem[] = [
  { titleKey: "nav.servers", href: "/", icon: ServerIcon, exact: true },
  { titleKey: "nav.account", href: "/account", icon: UserCogIcon, exact: true },
  { titleKey: "nav.apiKeys", href: "/account/api", icon: KeyRoundIcon },
]

// Админ-зона, разбита на три группы (как просили).
const basicAdminNav: NavItem[] = [
  { titleKey: "nav.adminOverview", href: "/admin", icon: LayoutDashboardIcon, exact: true },
  { titleKey: "nav.settings", href: "/admin/settings", icon: SlidersHorizontalIcon },
  { titleKey: "nav.applications", href: "/admin/applications", icon: Code2Icon },
]

const managementNav: NavItem[] = [
  { titleKey: "nav.users", href: "/admin/users", icon: UsersIcon },
  { titleKey: "nav.adminServers", href: "/admin/servers", icon: ServerIcon },
  { titleKey: "nav.nodes", href: "/admin/nodes", icon: HardDriveIcon },
  { titleKey: "nav.locations", href: "/admin/locations", icon: MapPinIcon },
]

const serverManagementNav: NavItem[] = [
  { titleKey: "nav.nests", href: "/admin/nests", icon: EggIcon },
  { titleKey: "nav.mounts", href: "/admin/mounts", icon: FolderSymlinkIcon },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { t } = useT()
  const brand = useBrand()
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.isAdmin)))
      .catch(() => {})
  }, [])

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

  function renderItems(items: NavItem[]) {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item)}
          tooltip={t(item.titleKey)}
        >
          <Link href={item.href} onClick={() => setOpenMobile(false)}>
            <item.icon className="size-4" />
            <span>{t(item.titleKey)}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={brand.name}>
              <Link href="/" onClick={() => setOpenMobile(false)}>
                <div className="bg-foreground text-background flex aspect-square size-8 items-center justify-center rounded-xl">
                  <HexagonIcon className="size-4.5" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">{brand.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {brand.tagline || t("brand.tagline")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.group.panel")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t("nav.group.basicAdmin")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(basicAdminNav)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t("nav.group.management")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(managementNav)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t("nav.group.serverManagement")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(serverManagementNav)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("common.support")}>
              <Link href="#">
                <LifeBuoyIcon className="size-4" />
                <span>{t("common.support")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
