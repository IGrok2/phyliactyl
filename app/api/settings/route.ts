import { NextResponse } from "next/server"
import { getSession, patchSession } from "@/lib/auth/session"
import { ptero } from "@/lib/pterodactyl/config"
import { getAccount } from "@/lib/pterodactyl/api"

function mask(key: string): string {
  if (!key) return ""
  if (key.length <= 12) return key.slice(0, 4) + "…"
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

async function requireAdmin() {
  const session = await getSession()
  if (!session?.cookie && !(ptero.url && ptero.clientKey)) return null
  return session
}

/** Проверяет, что текущий пользователь — реальный администратор Pterodactyl. */
async function isLiveAdmin(): Promise<boolean> {
  try {
    const account = await getAccount()
    return Boolean(account.attributes.admin)
  } catch {
    return false
  }
}

/** Текущее состояние Application API ключа. */
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const sessionKey = session.appKey || ""
  const envKey = ptero.appKey || ""
  const active = sessionKey || envKey
  return NextResponse.json({
    data: {
      configured: Boolean(active),
      masked: mask(active),
      source: sessionKey ? "session" : envKey ? "env" : null,
      // env-ключ нельзя изменить из UI, только переопределить своим.
      fromEnv: Boolean(envKey),
      isAdmin: Boolean(session.admin),
    },
  })
}

/** Сохраняет (и проверяет) Application API ключ в сессии. */
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (session.cookie && !(await isLiveAdmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as { appKey?: string }
  const appKey = (body.appKey ?? "").trim()
  if (!appKey.startsWith("ptla_")) {
    return NextResponse.json(
      { error: "Application API ключ должен начинаться с ptla_" },
      { status: 400 },
    )
  }

  // Проверяем ключ реальным запросом к Application API.
  const base = (session.url || ptero.url).replace(/\/+$/, "")
  try {
    const res = await fetch(`${base}/api/application/users?per_page=1`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${appKey}` },
      cache: "no-store",
    })
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "Ключ отклонён панелью (нет прав Application API)" },
        { status: 400 },
      )
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Панель вернула ошибку ${res.status}` },
        { status: 400 },
      )
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 })
  }

  await patchSession({ appKey })
  return NextResponse.json({ data: { configured: true, masked: mask(appKey) } })
}

/** Удаляет Application API ключ из сессии. */
export async function DELETE() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  await patchSession({ appKey: undefined })
  return NextResponse.json({ data: { configured: Boolean(ptero.appKey) } })
}
