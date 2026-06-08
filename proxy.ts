import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Имя cookie дублируем здесь намеренно: модуль lib/auth/session тянет
// next/headers, который недоступен в proxy-runtime.
const SESSION_COOKIE = "nebula_session"

// В Next.js 16 middleware переименован в proxy (runtime nodejs).
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthed = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  const isApi = pathname.startsWith("/api")
  const isLogin = pathname === "/login"

  // API-роуты обрабатывают авторизацию сами (возвращают 401).
  if (isApi) return NextResponse.next()

  // Неавторизованный пользователь — всегда на страницу входа.
  if (!isAuthed && !isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Авторизованный на /login — сразу на главную.
  if (isAuthed && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Исключаем статику и внутренние ассеты Next.js.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
