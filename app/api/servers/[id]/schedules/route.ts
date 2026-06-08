import { clientHandler } from "@/lib/pterodactyl/bff"
import { listSchedules, createSchedule } from "@/lib/pterodactyl/api"
import { mapSchedule } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await listSchedules(id)
    return list.data.map((s) => mapSchedule(s.attributes))
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return clientHandler(async () => {
    const created = await createSchedule(id, {
      name: String(b.name ?? "Schedule"),
      minute: String(b.minute ?? "*"),
      hour: String(b.hour ?? "*"),
      day_of_month: String(b.day_of_month ?? "*"),
      month: String(b.month ?? "*"),
      day_of_week: String(b.day_of_week ?? "*"),
      is_active: b.is_active === undefined ? true : Boolean(b.is_active),
    })
    return mapSchedule(created.attributes)
  })
}
