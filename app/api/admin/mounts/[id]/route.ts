import { appHandler } from "@/lib/pterodactyl/bff"
import { deleteAppMount } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    await deleteAppMount(Number(id))
    return { ok: true }
  })
}
