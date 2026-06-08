import { clientHandler } from "@/lib/pterodactyl/bff"
import { listServers, listAllServers, getResources } from "@/lib/pterodactyl/api"
import { mapServer } from "@/lib/pterodactyl/map"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "1"
  return clientHandler(async () => {
    const list = all ? await listAllServers() : await listServers()
    // Параллельно подтягиваем живое состояние ресурсов по каждому серверу.
    const servers = await Promise.all(
      list.data.map(async (s) => {
        try {
          const res = await getResources(s.attributes.identifier)
          return mapServer(s.attributes, res.attributes)
        } catch {
          return mapServer(s.attributes)
        }
      }),
    )
    return servers
  })
}
