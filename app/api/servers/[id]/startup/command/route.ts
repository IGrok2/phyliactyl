import { appHandler } from "@/lib/pterodactyl/bff"
import {
  findAppServerByIdentifier,
  updateAppServerStartup,
} from "@/lib/pterodactyl/api"
import { PteroError } from "@/lib/pterodactyl/config"

/**
 * Изменение команды запуска сервера. Клиентский API Pterodactyl не позволяет
 * менять «сырую» команду запуска (она задаётся эггом), поэтому делаем это
 * через Application API — доступно только администраторам (appHandler).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { command?: string }
  const command = String(body.command ?? "").trim()

  return appHandler(async () => {
    if (!command) throw new PteroError(400, "Команда запуска пуста")
    const server = await findAppServerByIdentifier(id)
    if (!server) {
      throw new PteroError(404, "Сервер не найден в Application API")
    }
    await updateAppServerStartup(server.id, {
      startup: command,
      environment: server.container.environment,
      egg: server.egg,
      image: server.container.image,
      skip_scripts: false,
    })
    return { ok: true, command }
  })
}
