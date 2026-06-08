import { clientHandler } from "@/lib/pterodactyl/bff"
import { listAllocations } from "@/lib/pterodactyl/api"
import { mapAllocation } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await listAllocations(id)
    return list.data.map((a) => mapAllocation(a.attributes))
  })
}
