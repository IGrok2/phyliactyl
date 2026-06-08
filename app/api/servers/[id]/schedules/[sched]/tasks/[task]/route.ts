import { clientHandler } from "@/lib/pterodactyl/bff"
import { deleteScheduleTask } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sched: string; task: string }> },
) {
  const { id, sched, task } = await params
  return clientHandler(async () => {
    await deleteScheduleTask(id, sched, task)
    return { ok: true }
  })
}
