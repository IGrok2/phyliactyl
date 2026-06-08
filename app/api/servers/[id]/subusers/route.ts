import { clientHandler } from "@/lib/pterodactyl/bff"
import { listSubusers } from "@/lib/pterodactyl/api"
import { mapSubuser } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await listSubusers(id)
    return list.data.map((u, i) => mapSubuser(u.attributes, i))
  })
}
