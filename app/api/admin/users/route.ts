import { appHandler } from "@/lib/pterodactyl/bff"
import { listAppUsers, createAppUser } from "@/lib/pterodactyl/api"
import { mapAppUser } from "@/lib/pterodactyl/map"

const PER_PAGE = 50

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const email = searchParams.get("email")?.trim() || undefined

  return appHandler(async () => {
    const list = await listAppUsers({ page, perPage: PER_PAGE, email })
    const pagination = list.meta?.pagination
    return {
      users: list.data.map((u, i) => mapAppUser(u.attributes, i)),
      pagination: {
        total: pagination?.total ?? list.data.length,
        currentPage: pagination?.current_page ?? page,
        totalPages: pagination?.total_pages ?? 1,
        perPage: pagination?.per_page ?? PER_PAGE,
      },
    }
  })
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  return appHandler(async () => {
    const created = await createAppUser({
      email: String(body.email ?? ""),
      username: String(body.username ?? ""),
      first_name: String(body.first_name ?? body.username ?? ""),
      last_name: String(body.last_name ?? "user"),
      password: body.password ? String(body.password) : undefined,
      root_admin: Boolean(body.root_admin),
    })
    return mapAppUser(created.attributes)
  })
}
