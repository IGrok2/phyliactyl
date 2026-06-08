import { clientHandler } from "@/lib/pterodactyl/bff"
import { listAccountActivity } from "@/lib/pterodactyl/api"
import { mapActivity } from "@/lib/pterodactyl/map"

export async function GET() {
  return clientHandler(async () => {
    const list = await listAccountActivity()
    return list.data.map((a) => mapActivity(a.attributes))
  })
}
