import { NextResponse } from "next/server"
import { getSettings, fetchPanelName } from "@/lib/settings/store"
import { getSession } from "@/lib/auth/session"
import { ptero, brand } from "@/lib/pterodactyl/config"

/**
 * Публичное брендирование панели (название/подзаголовок) — используется
 * в сайдбаре, шапке и на странице входа. Доступно без авторизации.
 * Приоритет: ручная настройка → имя из Pterodactyl (settings/general) →
 * значение по умолчанию (APP_NAME из .env).
 */
export async function GET() {
  const settings = await getSettings()
  const session = await getSession()
  const url = session?.url || ptero.url

  let name = settings.brand.name.trim()
  let source: "custom" | "pterodactyl" | "default" = "custom"
  if (!name) {
    const fromPtero = await fetchPanelName(url)
    if (fromPtero) {
      name = fromPtero
      source = "pterodactyl"
    } else {
      name = brand.name
      source = "default"
    }
  }

  return NextResponse.json({
    name,
    tagline: settings.brand.tagline || brand.tagline || "",
    source,
  })
}
