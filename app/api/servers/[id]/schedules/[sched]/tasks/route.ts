import { clientHandler } from "@/lib/pterodactyl/bff"
import { createScheduleTask } from "@/lib/pterodactyl/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sched: string }> },
) {
  const { id, sched } = await params
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return clientHandler(async () => {
    await createScheduleTask(id, sched, {
      action: String(b.action ?? "command"),
      payload: String(b.payload ?? ""),
      time_offset: Number(b.time_offset ?? 0),
      continue_on_failure: Boolean(b.continue_on_failure),
    })
    return { ok: true }
  })
}
