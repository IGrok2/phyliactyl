// Эмуляция веб-логина Pterodactyl (логин/пароль через сессию Laravel).
// Pterodactyl не даёт публичного API для входа по паролю, поэтому повторяем
// поведение его фронтенда: получаем CSRF-cookie, POST /auth/login, и используем
// полученные session-cookie для доступа к /api/client/*.
import { PteroError } from "./config"

type Jar = Record<string, string>

/** Парсит заголовки Set-Cookie ответа в простой словарь name=value. */
function mergeSetCookies(jar: Jar, res: Response): Jar {
  // undici (Node 18+) поддерживает getSetCookie()
  const list: string[] =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : []
  for (const sc of list) {
    const pair = sc.split(";")[0]
    const eq = pair.indexOf("=")
    if (eq > 0) {
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1).trim()
      if (name) jar[name] = value
    }
  }
  return jar
}

function cookieHeader(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ")
}

function xsrfFrom(jar: Jar): string {
  const raw = jar["XSRF-TOKEN"]
  return raw ? decodeURIComponent(raw) : ""
}

export interface WebLoginResult {
  cookie: string
  xsrf: string
  account: { username: string; email: string; admin: boolean }
}

/**
 * Надёжно получает CSRF-cookie (XSRF-TOKEN) панели.
 * Pterodactyl — Laravel-приложение: XSRF-TOKEN выдаётся web-middleware на
 * любой странице. Сначала пробуем штатный маршрут Sanctum, а если он
 * отсутствует (старые сборки) или не вернул токен — берём cookie со страницы
 * входа или с корня панели.
 */
async function bootstrapCsrf(base: string, jar: Jar): Promise<void> {
  const candidates = [
    `${base}/sanctum/csrf-cookie`,
    `${base}/auth/login`,
    `${base}/`,
  ]
  for (const target of candidates) {
    const res = await fetch(target, {
      headers: { Accept: "text/html,application/json", "X-Requested-With": "XMLHttpRequest" },
      cache: "no-store",
      redirect: "manual",
    }).catch(() => null)
    if (res) mergeSetCookies(jar, res)
    if (xsrfFrom(jar)) return
  }
}

export async function webLogin(
  url: string,
  user: string,
  password: string,
  totp?: string,
): Promise<WebLoginResult> {
  const base = url.replace(/\/+$/, "")
  const jar: Jar = {}

  // 1. Получаем CSRF-cookie (с запасными маршрутами).
  await bootstrapCsrf(base, jar)
  if (!xsrfFrom(jar)) {
    throw new PteroError(502, "Панель недоступна или не выдала CSRF-токен")
  }

  // 2. POST /auth/login. При 419 (CSRF token mismatch) обновляем cookie и
  //    повторяем один раз — это устраняет «ошибку CSRF токена» на части сборок.
  async function attemptLogin(): Promise<Response> {
    return fetch(`${base}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": xsrfFrom(jar),
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookieHeader(jar),
      },
      body: JSON.stringify({ user, password }),
      cache: "no-store",
    })
  }

  let loginRes = await attemptLogin()
  mergeSetCookies(jar, loginRes)
  if (loginRes.status === 419) {
    await bootstrapCsrf(base, jar)
    loginRes = await attemptLogin()
    mergeSetCookies(jar, loginRes)
  }

  if (loginRes.status === 422 || loginRes.status === 401) {
    throw new PteroError(401, "Неверный логин или пароль")
  }
  if (loginRes.status === 419) {
    throw new PteroError(419, "Ошибка CSRF токена — обновите страницу и попробуйте снова")
  }
  if (!loginRes.ok) {
    throw new PteroError(loginRes.status, "Ошибка входа в панель")
  }

  const loginJson = (await loginRes.json().catch(() => ({}))) as {
    data?: { complete?: boolean; confirmation_token?: string }
  }

  // 3. Двухфакторная аутентификация при необходимости.
  if (loginJson.data && loginJson.data.complete === false) {
    const token = loginJson.data.confirmation_token
    if (!token) throw new PteroError(401, "Ошибка входа в панель")
    if (!totp) {
      throw new PteroError(428, "Требуется код двухфакторной аутентификации")
    }
    const cpRes = await fetch(`${base}/auth/login/checkpoint`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": xsrfFrom(jar),
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookieHeader(jar),
      },
      body: JSON.stringify({
        confirmation_token: token,
        authentication_code: totp.replace(/\s/g, ""),
      }),
      cache: "no-store",
    })
    mergeSetCookies(jar, cpRes)
    if (!cpRes.ok) {
      throw new PteroError(401, "Неверный код 2FA")
    }
  }

  // 4. Проверяем доступ через session-cookie.
  const cookie = cookieHeader(jar)
  const xsrf = xsrfFrom(jar)
  const acc = await fetch(`${base}/api/client/account`, {
    headers: {
      Accept: "application/json",
      "X-XSRF-TOKEN": xsrf,
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookie,
    },
    cache: "no-store",
  })
  if (!acc.ok) {
    throw new PteroError(401, "Не удалось подтвердить сессию панели")
  }
  const accJson = (await acc.json()) as {
    attributes: { username: string; email: string; admin: boolean }
  }

  return {
    cookie,
    xsrf,
    account: {
      username: accJson.attributes.username,
      email: accJson.attributes.email,
      admin: accJson.attributes.admin,
    },
  }
}
