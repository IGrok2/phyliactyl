import { clientHandler } from "@/lib/pterodactyl/bff"
import {
  getTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
} from "@/lib/pterodactyl/api"

/** Данные для настройки 2FA (otpauth URI + секрет). */
export async function GET() {
  return clientHandler(async () => {
    const res = await getTwoFactorSetup()
    return {
      otpauth: res.data.image_url_data,
      secret: res.data.secret ?? extractSecret(res.data.image_url_data),
    }
  })
}

/** Включение 2FA по коду из приложения. Возвращает коды восстановления. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    code?: string
    password?: string
  }
  return clientHandler(async () => {
    const res = await enableTwoFactor(
      String(body.code ?? "").replace(/\s/g, ""),
      body.password,
    )
    return { tokens: res.attributes?.tokens ?? [] }
  })
}

/** Отключение 2FA (требуется пароль). */
export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string }
  return clientHandler(async () => {
    await disableTwoFactor(String(body.password ?? ""))
    return { ok: true }
  })
}

function extractSecret(otpauth: string): string {
  try {
    const u = new URL(otpauth)
    return u.searchParams.get("secret") ?? ""
  } catch {
    return ""
  }
}
