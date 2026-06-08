import { clientHandler } from "@/lib/pterodactyl/bff"
import { getStartup } from "@/lib/pterodactyl/api"
import { mapStartupVariable } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await getStartup(id)
    return {
      command: list.meta?.startup_command ?? list.meta?.raw_startup_command ?? "",
      rawCommand: list.meta?.raw_startup_command ?? "",
      dockerImages: list.meta?.docker_images ?? {},
      variables: list.data.map((v) => mapStartupVariable(v.attributes)),
    }
  })
}
