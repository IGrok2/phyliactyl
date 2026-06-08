import { appHandler } from "@/lib/pterodactyl/bff"
import {
  updateAppNode,
  deleteAppNode,
  getAppNode,
  getNodeConfiguration,
} from "@/lib/pterodactyl/api"
import { mapNode } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    const [node, config] = await Promise.all([
      getAppNode(Number(id)),
      getNodeConfiguration(Number(id)),
    ])
    return {
      ...mapNode(node, null),
      raw: node.attributes,
      config,
    }
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return appHandler(async () => {
    const patch: Record<string, unknown> = {}
    for (const k of [
      "name",
      "location_id",
      "fqdn",
      "scheme",
      "memory",
      "memory_overallocate",
      "disk",
      "disk_overallocate",
    ]) {
      if (body[k] !== undefined) {
        patch[k] =
          k === "name" || k === "fqdn" || k === "scheme"
            ? String(body[k])
            : Number(body[k])
      }
    }
    const updated = await updateAppNode(Number(id), patch)
    return mapNode(updated, null)
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return appHandler(async () => {
    await deleteAppNode(Number(id))
    return { ok: true }
  })
}
