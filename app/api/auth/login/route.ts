import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { webLogin } from "@/lib/pterodactyl/web-auth"
import { ptero, PteroError } from "@/lib/pterodactyl/config"
import { SESSION_COOKIE, encodeSession } from "@/lib/auth/session"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    user?: string
    password?: string
    totp?: string
  }

  const user = (body.user ?? "").trim()
  const password = body.password ?? ""
  const totp = (body.totp ?? "").trim() || undefined

  if (!user || !password) {
    return NextResponse.json(
      { error: "Укажите логин и пароль" },
      { status: 400 },
    )
  }

  try {
    const result = await webLogin(ptero.url, user, password, totp)
    const store = await cookies()
    store.set(
      SESSION_COOKIE,
      encodeSession({
        url: ptero.url,
        cookie: result.cookie,
        xsrf: result.xsrf,
        username: result.account.username,
        email: result.account.email,
        admin: result.account.admin,
        appKey: ptero.appKey || undefined,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    )
    return NextResponse.json({ ok: true, account: result.account })
  } catch (e) {
    const err = e instanceof PteroError ? e : new PteroError(500, (e as Error).message)
    // 428 — требуется код 2FA (фронт покажет поле кода).
    return NextResponse.json(
      { error: err.message, twoFactor: err.status === 428 },
      { status: err.status || 500 },
    )
  }
}
