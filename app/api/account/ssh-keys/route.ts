import { clientHandler } from "@/lib/pterodactyl/bff"
import { listSshKeys, createSshKey, deleteSshKey } from "@/lib/pterodactyl/api"
import { mapSshKey } from "@/lib/pterodactyl/map"

export async function GET() {
  return clientHandler(async () => {
    const list = await listSshKeys()
    return list.data.map((k) => mapSshKey(k.attributes))
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string
    public_key?: string
  }
  return clientHandler(async () => {
    const created = await createSshKey(
      String(body.name ?? ""),
      String(body.public_key ?? ""),
    )
    return mapSshKey(created.attributes)
  })
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { fingerprint?: string }
  return clientHandler(async () => {
    await deleteSshKey(String(body.fingerprint ?? ""))
    return { ok: true }
  })
}
