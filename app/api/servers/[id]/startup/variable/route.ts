import { clientHandler } from "@/lib/pterodactyl/bff"
import { updateStartupVariable } from "@/lib/pterodactyl/api"
import { mapStartupVariable } from "@/lib/pterodactyl/map"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    key?: string
    value?: string
  }
  return clientHandler(async () => {
    const res = await updateStartupVariable(
      id,
      String(body.key ?? ""),
      String(body.value ?? ""),
    )
    return mapStartupVariable(res.attributes)
  })
}
