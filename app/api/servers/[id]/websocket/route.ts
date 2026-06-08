import { clientHandler } from "@/lib/pterodactyl/bff"
import { getWebsocket } from "@/lib/pterodactyl/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const ws = await getWebsocket(id)
    return ws.data // { token, socket }
  })
}
