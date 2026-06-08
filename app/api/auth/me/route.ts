import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAccount } from "@/lib/pterodactyl/api"
import { ptero } from "@/lib/pterodactyl/config"

export async function GET() {
  const session = await getSession()
  const defaultUrl = ptero.url || ""
  // Application API доступен, если ключ задан в env или в Panel Settings (сессия).
  const hasAppKey = Boolean(ptero.appKey || session?.appKey)

  if (!session) {
    return NextResponse.json({ authenticated: false, defaultUrl, hasAppKey })
  }

  try {
    const account = await getAccount()
    const admin = Boolean(account.attributes.admin)
    return NextResponse.json({
      authenticated: true,
      defaultUrl,
      // Админ-разделы видны только администраторам.
      hasAppKey: hasAppKey && admin,
      isAdmin: admin,
      account: {
        username: account.attributes.username,
        email: account.attributes.email,
        admin,
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false, defaultUrl, hasAppKey })
  }
}
