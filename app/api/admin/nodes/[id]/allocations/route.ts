import { appHandler } from "@/lib/pterodactyl/bff"
import {
  listNodeAllocations,
  createNodeAllocations,
} from "@/lib/pterodactyl/api"
import { mapAllocation } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    const list = await listNodeAllocations(Number(id))
    return list.data.map((a) => ({
      ...mapAllocation(a.attributes),
      assigned: Boolean((a.attributes as { assigned?: boolean }).assigned),
    }))
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    ip?: string
    ports?: string[]
    alias?: string
  }
  return appHandler(async () => {
    const ports = (body.ports ?? []).map(String).filter(Boolean)
    await createNodeAllocations(Number(id), String(body.ip ?? ""), ports, body.alias)
    return { ok: true }
  })
}
