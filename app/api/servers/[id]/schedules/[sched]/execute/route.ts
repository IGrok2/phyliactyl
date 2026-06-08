import { clientHandler } from "@/lib/pterodactyl/bff"
import { runSchedule } from "@/lib/pterodactyl/api"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; sched: string }> },
) {
  const { id, sched } = await params
  return clientHandler(async () => {
    await runSchedule(id, sched)
    return { ok: true }
  })
}
