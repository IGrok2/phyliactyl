import { clientHandler } from "@/lib/pterodactyl/bff"
import { renameServer } from "@/lib/pterodactyl/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { name?: string }
  return clientHandler(async () => {
    if (!body.name?.trim()) throw new Error("Укажите название сервера")
    await renameServer(id, body.name)
    return { ok: true }
  })
}
