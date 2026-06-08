import { appHandler } from "@/lib/pterodactyl/bff"
import {
  listAppLocations,
  listAppNodes,
  createAppLocation,
} from "@/lib/pterodactyl/api"
import { mapLocation } from "@/lib/pterodactyl/map"

export async function GET() {
  return appHandler(async () => {
    const [locations, nodes] = await Promise.all([
      listAppLocations(),
      listAppNodes().catch(() => null),
    ])
    const nodeCounts = new Map<number, number>()
    for (const n of nodes?.data ?? []) {
      const lid = n.attributes.location_id
      nodeCounts.set(lid, (nodeCounts.get(lid) ?? 0) + 1)
    }
    return locations.data.map((l) => ({
      ...mapLocation(l.attributes),
      nodes: nodeCounts.get(l.attributes.id) ?? 0,
    }))
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    short?: string
    long?: string
  }
  return appHandler(async () => {
    const created = await createAppLocation(
      String(body.short ?? ""),
      String(body.long ?? ""),
    )
    return mapLocation(created.attributes)
  })
}
