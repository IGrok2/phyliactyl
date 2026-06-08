// Глобальные настройки панели (брендирование + SMTP), общие для всех
// пользователей. Хранятся в JSON-файле рядом с проектом, так как у панели
// нет собственной БД. Модуль импортируется ТОЛЬКО серверным кодом.
import { promises as fs } from "fs"
import path from "path"

export interface BrandSettings {
  /** Отображаемое название панели (пусто = брать из Pterodactyl/по умолчанию) */
  name: string
  /** Подзаголовок под названием */
  tagline: string
}

export interface SmtpSettings {
  host: string
  port: number
  encryption: "tls" | "ssl" | "none"
  username: string
  password: string
  fromAddress: string
  fromName: string
}

export interface HttpSettings {
  /** Таймаут установки соединения, сек */
  connectionTimeout: number
  /** Таймаут запроса, сек */
  requestTimeout: number
  /** HTTP(S) прокси для исходящих запросов */
  proxy: string
  /** User-Agent исходящих запросов */
  userAgent: string
}

export interface AllocationSettings {
  /** Разрешить пользователям автоматически создавать аллокации */
  enabled: boolean
  /** Начальный порт диапазона авто-создания */
  startPort: number
  /** Конечный порт диапазона авто-создания */
  endPort: number
}

export interface PanelSettings {
  brand: BrandSettings
  smtp: SmtpSettings
  http: HttpSettings
  allocation: AllocationSettings
}

const DEFAULTS: PanelSettings = {
  brand: { name: "", tagline: "" },
  smtp: {
    host: "",
    port: 587,
    encryption: "tls",
    username: "",
    password: "",
    fromAddress: "",
    fromName: "",
  },
  http: {
    connectionTimeout: 5,
    requestTimeout: 15,
    proxy: "",
    userAgent: "",
  },
  allocation: {
    enabled: false,
    startPort: 0,
    endPort: 0,
  },
}

const FILE = path.join(process.cwd(), ".nebula-settings.json")

let cache: PanelSettings | null = null

export async function getSettings(): Promise<PanelSettings> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(FILE, "utf8")
    const parsed = JSON.parse(raw) as Partial<PanelSettings>
    cache = {
      brand: { ...DEFAULTS.brand, ...parsed.brand },
      smtp: { ...DEFAULTS.smtp, ...parsed.smtp },
      http: { ...DEFAULTS.http, ...parsed.http },
      allocation: { ...DEFAULTS.allocation, ...parsed.allocation },
    }
  } catch {
    cache = structuredClone(DEFAULTS)
  }
  return cache
}

export async function updateSettings(
  patch: Partial<PanelSettings>,
): Promise<PanelSettings> {
  const current = await getSettings()
  const next: PanelSettings = {
    brand: { ...current.brand, ...patch.brand },
    smtp: { ...current.smtp, ...patch.smtp },
    http: { ...current.http, ...patch.http },
    allocation: { ...current.allocation, ...patch.allocation },
  }
  cache = next
  try {
    await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8")
  } catch {
    // в read-only окружении просто держим значение в памяти
  }
  return next
}

// --- Имя панели из Pterodactyl ---

let nameCache: { url: string; name: string; at: number } | null = null
const NAME_TTL = 5 * 60 * 1000

/**
 * Пытается получить название панели из Pterodactyl (settings → general).
 * Application API его не отдаёт, поэтому читаем <title> главной страницы
 * (там подставляется app:name из настроек панели).
 */
export async function fetchPanelName(url: string): Promise<string> {
  if (!url) return ""
  const base = url.replace(/\/+$/, "")
  if (nameCache && nameCache.url === base && Date.now() - nameCache.at < NAME_TTL) {
    return nameCache.name
  }
  try {
    const res = await fetch(base, {
      headers: { Accept: "text/html" },
      cache: "no-store",
      redirect: "follow",
    })
    const html = await res.text()
    const m = html.match(/<title>([^<]*)<\/title>/i)
    let name = m ? m[1].trim() : ""
    // Pterodactyl формирует title как "<app name> | Sign In" и т.п.
    name = name.split("|")[0].split("·")[0].split("—")[0].trim()
    if (name) {
      nameCache = { url: base, name, at: Date.now() }
      return name
    }
  } catch {
    // ignore
  }
  return ""
}
