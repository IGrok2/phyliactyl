import { clientHandler } from "@/lib/pterodactyl/bff"
import { writeFile } from "@/lib/pterodactyl/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    file?: string
    content?: string
  }
  return clientHandler(async () => {
    if (!body.file) throw new Error("Не указан файл")
    await writeFile(id, body.file, body.content ?? "")
    return { ok: true }
  })
}
