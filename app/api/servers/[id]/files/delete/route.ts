import { clientHandler } from "@/lib/pterodactyl/bff"
import { deleteFiles } from "@/lib/pterodactyl/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    root?: string
    files?: string[]
  }
  return clientHandler(async () => {
    if (!body.files?.length) throw new Error("Не указаны файлы")
    await deleteFiles(id, body.root ?? "/", body.files)
    return { ok: true }
  })
}
