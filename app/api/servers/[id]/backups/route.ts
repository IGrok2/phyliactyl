import { clientHandler } from "@/lib/pterodactyl/bff"
import { listBackups, createBackup } from "@/lib/pterodactyl/api"
import { mapBackup } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await listBackups(id)
    return list.data.map((b) => mapBackup(b.attributes))
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { name?: string }
  return clientHandler(async () => {
    const created = await createBackup(id, body.name)
    return mapBackup(created.attributes)
  })
}
