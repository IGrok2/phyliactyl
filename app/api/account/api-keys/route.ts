import { clientHandler } from "@/lib/pterodactyl/bff"
import { listClientApiKeys, createClientApiKey } from "@/lib/pterodactyl/api"
import { mapApiKey } from "@/lib/pterodactyl/map"

export async function GET() {
  return clientHandler(async () => {
    const list = await listClientApiKeys()
    return list.data.map((k) => mapApiKey(k.attributes))
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    description?: string
    allowed_ips?: string[]
  }
  return clientHandler(async () => {
    const created = await createClientApiKey(
      String(body.description ?? "API key"),
      Array.isArray(body.allowed_ips) ? body.allowed_ips.map(String) : [],
    )
    return {
      key: mapApiKey(created.attributes),
      // секрет показывается один раз
      secret: `${created.attributes.identifier}${created.meta?.secret_token ?? ""}`,
    }
  })
}
