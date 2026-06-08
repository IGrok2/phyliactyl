import { clientHandler } from "@/lib/pterodactyl/bff"
import { listFiles } from "@/lib/pterodactyl/api"
import { mapFile } from "@/lib/pterodactyl/map"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const directory = new URL(req.url).searchParams.get("directory") ?? "/"
  return clientHandler(async () => {
    const list = await listFiles(id, directory)
    return list.data.map((f) => mapFile(f.attributes))
  })
}
