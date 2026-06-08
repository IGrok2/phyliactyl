import { appHandler } from "@/lib/pterodactyl/bff"
import {
  listAppNodes,
  listAppLocations,
  listAppServers,
  createAppNode,
  type NodeInput,
} from "@/lib/pterodactyl/api"
import { mapNode } from "@/lib/pterodactyl/map"

export async function GET() {
  return appHandler(async () => {
    const [nodes, locations, servers] = await Promise.all([
      listAppNodes(),
      listAppLocations().catch(() => null),
      listAppServers().catch(() => null),
    ])
    const locMap = new Map(
      (locations?.data ?? []).map((l) => [l.attributes.id, l.attributes.short]),
    )
    // Считаем количество серверов на каждой ноде.
    const serverCounts = new Map<number, number>()
    for (const s of servers?.data ?? []) {
      const nodeId = s.attributes.node
      if (nodeId != null) serverCounts.set(nodeId, (serverCounts.get(nodeId) ?? 0) + 1)
    }
    // Утилизация по нодам недоступна напрямую через Application API,
    // поэтому показываем общие лимиты (used=0).
    return nodes.data.map((n) => ({
      ...mapNode(n, null, locMap.get(n.attributes.location_id)),
      servers: serverCounts.get(n.attributes.id) ?? 0,
    }))
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<NodeInput>
  return appHandler(async () => {
    const created = await createAppNode({
      name: String(body.name ?? ""),
      location_id: Number(body.location_id ?? 0),
      fqdn: String(body.fqdn ?? ""),
      scheme: body.scheme === "http" ? "http" : "https",
      memory: Number(body.memory ?? 0),
      memory_overallocate: Number(body.memory_overallocate ?? 0),
      disk: Number(body.disk ?? 0),
      disk_overallocate: Number(body.disk_overallocate ?? 0),
    })
    return mapNode(created, null)
  })
}
