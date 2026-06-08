import { clientHandler } from "@/lib/pterodactyl/bff"
import { sendPower } from "@/lib/pterodactyl/api"

const VALID = new Set(["start", "stop", "restart", "kill"])

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { signal?: string }
  return clientHandler(async () => {
    if (!body.signal || !VALID.has(body.signal)) {
      throw new Error("Недопустимый сигнал питания")
    }
    await sendPower(id, body.signal)
    return { ok: true }
  })
}
