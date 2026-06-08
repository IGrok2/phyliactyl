import { appHandler } from "@/lib/pterodactyl/bff"
import { updateAppLocation, deleteAppLocation } from "@/lib/pterodactyl/api"
import { mapLocation } from "@/lib/pterodactyl/map"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    short?: string
    long?: string
  }
  return appHandler(async () => {
    const updated = await updateAppLocation(
      Number(id),
      String(body.short ?? ""),
      String(body.long ?? ""),
    )
    return mapLocation(updated.attributes)
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    await deleteAppLocation(Number(id))
    return { ok: true }
  })
}
