import { clientHandler } from "@/lib/pterodactyl/bff"
import { getFileContents } from "@/lib/pterodactyl/api"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const file = new URL(req.url).searchParams.get("file") ?? ""
  return clientHandler(async () => {
    if (!file) throw new Error("Не указан файл")
    const content = await getFileContents(id, file)
    return { content }
  })
}
