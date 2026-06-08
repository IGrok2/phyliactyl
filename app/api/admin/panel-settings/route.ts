import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { ptero } from "@/lib/pterodactyl/config"
import { getAccount } from "@/lib/pterodactyl/api"
import {
  getSettings,
  updateSettings,
  fetchPanelName,
  type SmtpSettings,
  type HttpSettings,
  type AllocationSettings,
} from "@/lib/settings/store"

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: "unauthorized" as const, session: null }
  // Проверяем админ-права у реального аккаунта (cookie не подписана).
  try {
    const account = await getAccount()
    if (!account.attributes.admin) {
      return { error: "forbidden" as const, session: null }
    }
  } catch {
    return { error: "unauthorized" as const, session: null }
  }
  return { error: null, session }
}

export async function GET() {
  const { error, session } = await requireAdmin()
  if (error) {
    return NextResponse.json({ error }, { status: error === "forbidden" ? 403 : 401 })
  }
  const settings = await getSettings()
  const detected = await fetchPanelName(session.url || ptero.url)
  return NextResponse.json({
    data: {
      brand: settings.brand,
      detectedName: detected || null,
      smtp: {
        ...settings.smtp,
        // пароль не отдаём наружу
        password: "",
        hasPassword: Boolean(settings.smtp.password),
      },
      http: settings.http,
      allocation: settings.allocation,
    },
  })
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin()
  if (error) {
    return NextResponse.json({ error }, { status: error === "forbidden" ? 403 : 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    brand?: { name?: string; tagline?: string }
    smtp?: Partial<SmtpSettings> & { password?: string }
    http?: Partial<HttpSettings>
    allocation?: Partial<AllocationSettings>
  }

  const current = await getSettings()
  const patch: Parameters<typeof updateSettings>[0] = {}

  if (body.brand) {
    patch.brand = {
      name: (body.brand.name ?? current.brand.name).trim(),
      tagline: (body.brand.tagline ?? current.brand.tagline).trim(),
    }
  }

  if (body.smtp) {
    const s = body.smtp
    patch.smtp = {
      host: s.host ?? current.smtp.host,
      port: s.port !== undefined ? Number(s.port) : current.smtp.port,
      encryption: (s.encryption as SmtpSettings["encryption"]) ?? current.smtp.encryption,
      username: s.username ?? current.smtp.username,
      // пустой пароль = оставить прежний
      password: s.password ? s.password : current.smtp.password,
      fromAddress: s.fromAddress ?? current.smtp.fromAddress,
      fromName: s.fromName ?? current.smtp.fromName,
    }
  }

  if (body.http) {
    const h = body.http
    patch.http = {
      connectionTimeout:
        h.connectionTimeout !== undefined
          ? Number(h.connectionTimeout)
          : current.http.connectionTimeout,
      requestTimeout:
        h.requestTimeout !== undefined
          ? Number(h.requestTimeout)
          : current.http.requestTimeout,
      proxy: h.proxy ?? current.http.proxy,
      userAgent: h.userAgent ?? current.http.userAgent,
    }
  }

  if (body.allocation) {
    const a = body.allocation
    patch.allocation = {
      enabled:
        a.enabled !== undefined ? Boolean(a.enabled) : current.allocation.enabled,
      startPort:
        a.startPort !== undefined
          ? Number(a.startPort)
          : current.allocation.startPort,
      endPort:
        a.endPort !== undefined
          ? Number(a.endPort)
          : current.allocation.endPort,
    }
  }

  const next = await updateSettings(patch)
  return NextResponse.json({
    data: {
      brand: next.brand,
      smtp: { ...next.smtp, password: "", hasPassword: Boolean(next.smtp.password) },
      http: next.http,
      allocation: next.allocation,
    },
  })
}
