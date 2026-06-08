import { appHandler } from "@/lib/pterodactyl/bff"
import { updateAppUser, deleteAppUser } from "@/lib/pterodactyl/api"
import { mapAppUser } from "@/lib/pterodactyl/map"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return appHandler(async () => {
    const patch: Record<string, unknown> = {}
    if (body.email !== undefined) patch.email = String(body.email)
    if (body.username !== undefined) patch.username = String(body.username)
    if (body.first_name !== undefined) patch.first_name = String(body.first_name)
    if (body.last_name !== undefined) patch.last_name = String(body.last_name)
    if (body.password) patch.password = String(body.password)
    if (body.root_admin !== undefined) patch.root_admin = Boolean(body.root_admin)
    const updated = await updateAppUser(Number(id), patch)
    return mapAppUser(updated.attributes)
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    await deleteAppUser(Number(id))
    return { ok: true }
  })
}
