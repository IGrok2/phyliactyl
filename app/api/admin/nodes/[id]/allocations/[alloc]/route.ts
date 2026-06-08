import { appHandler } from "@/lib/pterodactyl/bff"
import { deleteNodeAllocation } from "@/lib/pterodactyl/api"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; alloc: string }> },
) {
  const { id, alloc } = await params
  return appHandler(async () => {
    await deleteNodeAllocation(Number(id), Number(alloc))
    return { ok: true }
  })
}
