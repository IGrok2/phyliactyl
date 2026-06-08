import { appHandler } from "@/lib/pterodactyl/bff"
import { listAppMounts, createAppMount } from "@/lib/pterodactyl/api"
import { mapMount } from "@/lib/pterodactyl/map"

export async function GET() {
  return appHandler(async () => {
    const list = await listAppMounts()
    return list.data.map((m) => mapMount(m.attributes))
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return appHandler(async () => {
    const created = await createAppMount({
      name: String(body.name ?? ""),
      source: String(body.source ?? ""),
      target: String(body.target ?? ""),
      description: body.description ? String(body.description) : undefined,
      read_only: Boolean(body.read_only),
      user_mountable: Boolean(body.user_mountable),
    })
    return mapMount(created.attributes)
  })
}
