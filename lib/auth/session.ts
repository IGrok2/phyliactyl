// Серверная сессия пользователя. Хранится в httpOnly cookie (недоступна из JS).
// Содержит session-cookie панели Pterodactyl, полученные при веб-логине.
import { cookies } from "next/headers"

export const SESSION_COOKIE = "nebula_session"

export interface Session {
  /** URL панели Pterodactyl */
  url: string
  /** Строка Cookie для проксирования к Pterodactyl (pterodactyl_session, XSRF-TOKEN) */
  cookie: string
  /** Значение XSRF-TOKEN для заголовка X-XSRF-TOKEN при мутациях */
  xsrf: string
  /** Логин пользователя (для отображения) */
  username?: string
  /** Email пользователя */
  email?: string
  /** Является ли пользователь администратором панели */
  admin?: boolean
  /** Application API ключ (ptla_...), заданный пользователем в Panel Settings */
  appKey?: string
}

function decode(raw: string): Session | null {
  try {
    const json = JSON.parse(Buffer.from(raw, "base64").toString("utf8"))
    if (json && typeof json.url === "string" && typeof json.cookie === "string") {
      return json as Session
    }
  } catch {
    // ignore
  }
  return null
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64")
}

/** Возвращает сессию текущего запроса или null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  return raw ? decode(raw) : null
}

const COOKIE_OPTS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
}

/** Записывает сессию в httpOnly cookie. */
export async function setSession(session: Session): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, encodeSession(session), COOKIE_OPTS)
}

/** Частично обновляет текущую сессию (например, сохраняет appKey). */
export async function patchSession(
  patch: Partial<Session>,
): Promise<Session | null> {
  const current = await getSession()
  if (!current) return null
  const next = { ...current, ...patch }
  await setSession(next)
  return next
}
