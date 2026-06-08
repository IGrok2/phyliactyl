import { clientHandler } from "@/lib/pterodactyl/bff"
import { sendCommand } from "@/lib/pterodactyl/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { command?: string }
  return clientHandler(async () => {
    if (!body.command?.trim()) throw new Error("Пустая команда")
    await sendCommand(id, body.command)
    return { ok: true }
  })
}
