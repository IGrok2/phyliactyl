import { clientHandler } from "@/lib/pterodactyl/bff"
import { getServer, getResources } from "@/lib/pterodactyl/api"
import { mapServer } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const [server, res] = await Promise.all([
      getServer(id),
      getResources(id).catch(() => null),
    ])
    return mapServer(server.attributes, res?.attributes)
  })
}
