import { clientHandler } from "@/lib/pterodactyl/bff"
import { deleteClientApiKey } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    await deleteClientApiKey(id)
    return { ok: true }
  })
}
