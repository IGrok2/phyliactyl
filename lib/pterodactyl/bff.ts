// Помощник для BFF route handlers: единый формат ответа.
// Требует авторизованную сессию (или env-конфиг как fallback).
import { NextResponse } from "next/server"
import { ptero, PteroError } from "./config"
import { getSession } from "@/lib/auth/session"
import { getAccount } from "./api"

/**
 * Формат ответа BFF:
 * - 401 { error }                — нет авторизации (клиент редиректит на /login)
 * - 200 { data }                 — успех
 * - 4xx/5xx { error }            — ошибка обращения к Pterodactyl
 */
export async function clientHandler<T>(fn: () => Promise<T>) {
  const session = await getSession()
  const hasAuth = Boolean(session?.cookie || (ptero.url && ptero.clientKey))
  if (!hasAuth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  try {
    const data = await fn()
    return NextResponse.json({ data })
  } catch (e) {
    const err =
      e instanceof PteroError ? e : new PteroError(500, (e as Error).message)
    return NextResponse.json(
      { error: err.message },
      { status: err.status && err.status >= 400 ? err.status : 500 },
    )
  }
}

export async function appHandler<T>(fn: () => Promise<T>) {
  const session = await getSession()
  const hasClient = Boolean(session?.cookie || (ptero.url && ptero.clientKey))
  // Application API (админка) работает по ptla-ключу: из Panel Settings
  // (сессия) либо из env как fallback.
  const hasApp = Boolean(session?.appKey || ptero.appKey)
  if (!hasClient) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  // При входе по сессии админ-разделы доступны ТОЛЬКО администраторам
  // Pterodactyl (root_admin). Проверяем флаг у РЕАЛЬНОГО аккаунта через API,
  // а не из cookie — cookie не подписана и поле admin можно подделать.
  if (session) {
    try {
      const account = await getAccount()
      if (!account.attributes.admin) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }
  if (!hasApp) {
    return NextResponse.json({ error: "no_app_key" }, { status: 403 })
  }
  try {
    const data = await fn()
    return NextResponse.json({ data })
  } catch (e) {
    const err =
      e instanceof PteroError ? e : new PteroError(500, (e as Error).message)
    return NextResponse.json(
      { error: err.message },
      { status: err.status && err.status >= 400 ? err.status : 500 },
    )
  }
}
