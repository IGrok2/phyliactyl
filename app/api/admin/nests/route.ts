import { appHandler } from "@/lib/pterodactyl/bff"
import { listAppNests, listNestEggs } from "@/lib/pterodactyl/api"
import { mapNest, mapEgg } from "@/lib/pterodactyl/map"

export async function GET() {
  return appHandler(async () => {
    const nests = await listAppNests()
    // Подтягиваем эгги для каждого нэста параллельно.
    const withEggs = await Promise.all(
      nests.data.map(async (n) => {
        const base = mapNest(n.attributes)
        try {
          const eggs = await listNestEggs(n.attributes.id)
          base.eggs = eggs.data.map((e) => mapEgg(e.attributes))
        } catch {
          // оставляем пустой список
        }
        return base
      }),
    )
    return withEggs
  })
}
