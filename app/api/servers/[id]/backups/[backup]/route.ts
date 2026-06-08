import { clientHandler } from "@/lib/pterodactyl/bff"
import { deleteBackup } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; backup: string }> },
) {
  const { id, backup } = await params
  return clientHandler(async () => {
    await deleteBackup(id, backup)
    return { ok: true }
  })
}
