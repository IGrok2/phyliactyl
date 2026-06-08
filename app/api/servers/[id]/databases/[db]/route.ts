import { clientHandler } from "@/lib/pterodactyl/bff"
import { deleteDatabase } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; db: string }> },
) {
  const { id, db } = await params
  return clientHandler(async () => {
    await deleteDatabase(id, db)
    return { ok: true }
  })
}
