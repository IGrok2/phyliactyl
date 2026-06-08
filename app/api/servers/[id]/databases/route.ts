import { clientHandler } from "@/lib/pterodactyl/bff"
import { listDatabases, createDatabase } from "@/lib/pterodactyl/api"
import { mapDatabase, dbPassword } from "@/lib/pterodactyl/map"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return clientHandler(async () => {
    const list = await listDatabases(id)
    return list.data.map((d) => ({
      ...mapDatabase(d.attributes),
      password: dbPassword(d.attributes),
    }))
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as {
    database?: string
    remote?: string
  }
  return clientHandler(async () => {
    if (!body.database?.trim()) throw new Error("Укажите имя базы данных")
    const created = await createDatabase(id, body.database, body.remote || "%")
    return {
      ...mapDatabase(created.attributes),
      password: dbPassword(created.attributes),
    }
  })
}
