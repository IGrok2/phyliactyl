import { clientHandler } from "@/lib/pterodactyl/bff"
import { setDockerImage } from "@/lib/pterodactyl/api"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { docker_image?: string }
  return clientHandler(async () => {
    await setDockerImage(id, String(body.docker_image ?? ""))
    return { ok: true }
  })
}
