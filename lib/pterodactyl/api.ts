// Серверные функции обращения к Pterodactyl API.
// Импортируется ТОЛЬКО серверным кодом (route handlers).
import { ptero, PteroError } from "./config"
import { getSession } from "@/lib/auth/session"
import type {
  Fractal,
  FractalList,
  ClientServerAttributes,
  ResourcesAttributes,
  WebsocketCredentials,
  FileAttributes,
  DatabaseAttributes,
  ScheduleAttributes,
  BackupAttributes,
  AllocationAttributes,
  StartupVariableAttributes,
  SubuserAttributes,
  AppUserAttributes,
  AppNodeAttributes,
  AppNodeUtilization,
  AppLocationAttributes,
  AppNestAttributes,
  AppEggAttributes,
  AppMountAttributes,
  ClientApiKeyAttributes,
  AccountActivityAttributes,
  SshKeyAttributes,
} from "./types"

type FetchInit = Omit<RequestInit, "body"> & { body?: unknown }

/**
 * Готовит URL и заголовки авторизации:
 * - client API: cookie-режим (вход по логину/паролю) или Bearer-ключ из env;
 * - application API: всегда Bearer ptla-ключ (из сессии Panel Settings или env),
 *   так как web-session панели не подходит для /api/application.
 */
async function authContext(base: "client" | "application") {
  const session = await getSession()
  const url = session?.url || ptero.url
  const headers: Record<string, string> = { Accept: "application/json" }

  if (base === "application") {
    const key = session?.appKey || ptero.appKey
    if (key) headers["Authorization"] = `Bearer ${key}`
    return { url, headers, authed: Boolean(url && key) }
  }

  if (session?.cookie) {
    headers["Cookie"] = session.cookie
    headers["X-Requested-With"] = "XMLHttpRequest"
    if (session.xsrf) headers["X-XSRF-TOKEN"] = session.xsrf
    return { url, headers, authed: true }
  }

  const key = ptero.clientKey
  if (key) headers["Authorization"] = `Bearer ${key}`
  return { url, headers, authed: Boolean(key) }
}

async function request<T>(
  base: "client" | "application",
  path: string,
  init: FetchInit = {},
): Promise<T> {
  const { url, headers, authed } = await authContext(base)
  if (!url || !authed) {
    throw new PteroError(401, "Не авторизовано")
  }
  const res = await fetch(`${url}/api/${base}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }

  if (!res.ok) {
    const detail =
      (json as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ??
      res.statusText
    throw new PteroError(res.status, detail, json)
  }

  return json as T
}

const clientGet = <T>(path: string) => request<T>("client", path)
const appGet = <T>(path: string) => request<T>("application", path)

// ---------- Аккаунт / авторизация ----------

export interface AccountInfo {
  id: number
  admin: boolean
  username: string
  email: string
  first_name: string
  last_name: string
  language: string
}

export const getAccount = () =>
  clientGet<Fractal<AccountInfo>>("/account")

// ---------- Файлы: содержимое и запись ----------

export async function getFileContents(id: string, file: string): Promise<string> {
  const { url, headers, authed } = await authContext("client")
  if (!url || !authed) throw new PteroError(401, "Не авторизовано")
  const res = await fetch(
    `${url}/api/client/servers/${id}/files/contents?file=${encodeURIComponent(file)}`,
    { headers, cache: "no-store" },
  )
  if (!res.ok) throw new PteroError(res.status, "Не удалось прочитать файл")
  return res.text()
}

export async function writeFile(
  id: string,
  file: string,
  content: string,
): Promise<void> {
  const { url, headers, authed } = await authContext("client")
  if (!url || !authed) throw new PteroError(401, "Не авторизовано")
  const res = await fetch(
    `${url}/api/client/servers/${id}/files/write?file=${encodeURIComponent(file)}`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "text/plain" },
      body: content,
      cache: "no-store",
    },
  )
  if (!res.ok) throw new PteroError(res.status, "Не удалось сохранить файл")
}

// ---------- Client API: серверы ----------

export const listServers = () =>
  clientGet<FractalList<ClientServerAttributes>>("/?per_page=100")

/** Все серверы панели (для root_admin) — Pterodactyl client API type=admin. */
export const listAllServers = () =>
  clientGet<FractalList<ClientServerAttributes>>("/?type=admin&per_page=100")

export const getServer = (id: string) =>
  clientGet<Fractal<ClientServerAttributes>>(
    `/servers/${id}?include=allocations`,
  )

export const getResources = (id: string) =>
  clientGet<Fractal<ResourcesAttributes>>(`/servers/${id}/resources`)

export const getWebsocket = (id: string) =>
  clientGet<{ data: WebsocketCredentials }>(`/servers/${id}/websocket`)

export const sendPower = (id: string, signal: string) =>
  request("client", `/servers/${id}/power`, {
    method: "POST",
    body: { signal },
  })

export const sendCommand = (id: string, command: string) =>
  request("client", `/servers/${id}/command`, {
    method: "POST",
    body: { command },
  })

// ---------- Client API: файлы ----------

export const listFiles = (id: string, directory = "/") =>
  clientGet<FractalList<FileAttributes>>(
    `/servers/${id}/files/list?directory=${encodeURIComponent(directory)}`,
  )

export const deleteFiles = (id: string, root: string, files: string[]) =>
  request("client", `/servers/${id}/files/delete`, {
    method: "POST",
    body: { root, files },
  })

// ---------- Client API: базы данных ----------

export const listDatabases = (id: string) =>
  clientGet<FractalList<DatabaseAttributes>>(
    `/servers/${id}/databases?include=password`,
  )

export const createDatabase = (id: string, database: string, remote: string) =>
  request<Fractal<DatabaseAttributes>>("client", `/servers/${id}/databases`, {
    method: "POST",
    body: { database, remote },
  })

export const deleteDatabase = (id: string, dbId: string) =>
  request("client", `/servers/${id}/databases/${dbId}`, { method: "DELETE" })

// ---------- Client API: расписания ----------

export const listSchedules = (id: string) =>
  clientGet<FractalList<ScheduleAttributes>>(
    `/servers/${id}/schedules?include=tasks`,
  )

export interface ScheduleInput {
  name: string
  minute: string
  hour: string
  day_of_month: string
  month: string
  day_of_week: string
  is_active: boolean
}

export const createSchedule = (id: string, data: ScheduleInput) =>
  request<Fractal<ScheduleAttributes>>("client", `/servers/${id}/schedules`, {
    method: "POST",
    body: data,
  })

export const updateSchedule = (id: string, scheduleId: string, data: ScheduleInput) =>
  request<Fractal<ScheduleAttributes>>(
    "client",
    `/servers/${id}/schedules/${scheduleId}`,
    { method: "POST", body: data },
  )

export const deleteSchedule = (id: string, scheduleId: string) =>
  request<void>("client", `/servers/${id}/schedules/${scheduleId}`, {
    method: "DELETE",
  })

export const runSchedule = (id: string, scheduleId: string) =>
  request<void>("client", `/servers/${id}/schedules/${scheduleId}/execute`, {
    method: "POST",
  })

export interface TaskInput {
  action: string
  payload: string
  time_offset: number
  continue_on_failure?: boolean
}

export const createScheduleTask = (id: string, scheduleId: string, data: TaskInput) =>
  request("client", `/servers/${id}/schedules/${scheduleId}/tasks`, {
    method: "POST",
    body: data,
  })

export const deleteScheduleTask = (
  id: string,
  scheduleId: string,
  taskId: string,
) =>
  request<void>(
    "client",
    `/servers/${id}/schedules/${scheduleId}/tasks/${taskId}`,
    { method: "DELETE" },
  )

// ---------- Client API: бэкапы ----------

export const listBackups = (id: string) =>
  clientGet<FractalList<BackupAttributes>>(`/servers/${id}/backups`)

export const createBackup = (id: string, name?: string) =>
  request<Fractal<BackupAttributes>>("client", `/servers/${id}/backups`, {
    method: "POST",
    body: name ? { name } : {},
  })

export const deleteBackup = (id: string, uuid: string) =>
  request("client", `/servers/${id}/backups/${uuid}`, { method: "DELETE" })

// ---------- Client API: сеть ----------

export const listAllocations = (id: string) =>
  clientGet<FractalList<AllocationAttributes>>(
    `/servers/${id}/network/allocations`,
  )

// ---------- Client API: запуск ----------

export const getStartup = (id: string) =>
  clientGet<
    FractalList<StartupVariableAttributes> & {
      meta?: {
        startup_command: string
        raw_startup_command: string
        docker_images?: Record<string, string>
      }
    }
  >(`/servers/${id}/startup`)

/** Изменение значения переменной запуска (клиентский API). */
export const updateStartupVariable = (id: string, key: string, value: string) =>
  request<Fractal<StartupVariableAttributes>>(
    "client",
    `/servers/${id}/startup/variable`,
    { method: "PUT", body: { key, value } },
  )

/** Смена Docker-образа сервера (клиентский API). */
export const setDockerImage = (id: string, docker_image: string) =>
  request<void>("client", `/servers/${id}/settings/docker-image`, {
    method: "PUT",
    body: { docker_image },
  })

// ---------- Client API: субпользователи ----------

export const listSubusers = (id: string) =>
  clientGet<FractalList<SubuserAttributes>>(`/servers/${id}/users`)

// ---------- Client API: настройки ----------

export const renameServer = (id: string, name: string) =>
  request("client", `/servers/${id}/settings/rename`, {
    method: "POST",
    body: { name },
  })

// ---------- Application API: админка ----------

const appSend = <T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
) => request<T>("application", path, { method, body })

// --- Пользователи ---

export interface UserQuery {
  page?: number
  perPage?: number
  email?: string
}

export const listAppUsers = (q: UserQuery = {}) => {
  const params = new URLSearchParams()
  params.set("per_page", String(q.perPage ?? 50))
  if (q.page) params.set("page", String(q.page))
  if (q.email) params.set("filter[email]", q.email)
  return appGet<FractalList<AppUserAttributes>>(`/users?${params.toString()}`)
}

export interface UserInput {
  email: string
  username: string
  first_name: string
  last_name: string
  password?: string
  root_admin?: boolean
}

export const createAppUser = (data: UserInput) =>
  appSend<Fractal<AppUserAttributes>>("/users", "POST", data)

export const updateAppUser = (id: number, data: Partial<UserInput>) =>
  appSend<Fractal<AppUserAttributes>>(`/users/${id}`, "PATCH", data)

export const deleteAppUser = (id: number) =>
  appSend<void>(`/users/${id}`, "DELETE")

// --- Ноды ---

export const listAppNodes = () =>
  appGet<FractalList<AppNodeAttributes>>("/nodes?per_page=100")

export const getAppNode = (id: number) =>
  appGet<Fractal<AppNodeAttributes>>(`/nodes/${id}`)

export const getNodeUtilization = (nodeId: number) =>
  appGet<AppNodeUtilization>(`/nodes/${nodeId}/configuration`).catch(() => null)

/** Конфигурация демона (wings) ноды — то, что вставляется в config.yml. */
export const getNodeConfiguration = (nodeId: number) =>
  appGet<Record<string, unknown>>(`/nodes/${nodeId}/configuration`).catch(
    () => null,
  )

export interface NodeInput {
  name: string
  location_id: number
  fqdn: string
  scheme: string
  memory: number
  memory_overallocate: number
  disk: number
  disk_overallocate: number
  upload_size?: number
  daemon_sftp?: number
  daemon_listen?: number
}

export const createAppNode = (data: NodeInput) =>
  appSend<Fractal<AppNodeAttributes>>("/nodes", "POST", {
    upload_size: 100,
    daemon_sftp: 2022,
    daemon_listen: 8080,
    ...data,
  })

export const updateAppNode = (id: number, data: Partial<NodeInput>) =>
  appSend<Fractal<AppNodeAttributes>>(`/nodes/${id}`, "PATCH", data)

export const deleteAppNode = (id: number) =>
  appSend<void>(`/nodes/${id}`, "DELETE")

export const listNodeAllocations = (nodeId: number) =>
  appGet<FractalList<AllocationAttributes>>(
    `/nodes/${nodeId}/allocations?per_page=200`,
  )

export const createNodeAllocations = (
  nodeId: number,
  ip: string,
  ports: string[],
  alias?: string,
) =>
  appSend<void>(`/nodes/${nodeId}/allocations`, "POST", {
    ip,
    ports,
    alias: alias || undefined,
  })

export const deleteNodeAllocation = (nodeId: number, allocId: number) =>
  appSend<void>(`/nodes/${nodeId}/allocations/${allocId}`, "DELETE")

// --- Локации ---

export const listAppLocations = () =>
  appGet<FractalList<AppLocationAttributes>>("/locations?per_page=100")

export const createAppLocation = (short: string, long: string) =>
  appSend<Fractal<AppLocationAttributes>>("/locations", "POST", { short, long })

export const updateAppLocation = (id: number, short: string, long: string) =>
  appSend<Fractal<AppLocationAttributes>>(`/locations/${id}`, "PATCH", {
    short,
    long,
  })

export const deleteAppLocation = (id: number) =>
  appSend<void>(`/locations/${id}`, "DELETE")

// --- Нэсты и эгги ---

export const listAppNests = () =>
  appGet<FractalList<AppNestAttributes>>("/nests?per_page=100")

export const listNestEggs = (nestId: number) =>
  appGet<FractalList<AppEggAttributes>>(
    `/nests/${nestId}/eggs?include=variables&per_page=100`,
  )

export const getEgg = (nestId: number, eggId: number) =>
  appGet<Fractal<AppEggAttributes>>(
    `/nests/${nestId}/eggs/${eggId}?include=variables`,
  )

// --- Mounts (доступно не на всех сборках Application API) ---

export const listAppMounts = () =>
  appGet<FractalList<AppMountAttributes>>("/mounts?per_page=100")

export const createAppMount = (data: {
  name: string
  source: string
  target: string
  description?: string
  read_only?: boolean
  user_mountable?: boolean
}) => appSend<Fractal<AppMountAttributes>>("/mounts", "POST", data)

export const deleteAppMount = (id: number) =>
  appSend<void>(`/mounts/${id}`, "DELETE")

// --- Серверы (Application) ---

export const listAppServers = () =>
  appGet<FractalList<{ id: number; node: number }>>("/servers?per_page=100")

// Полные атрибуты сервера через Application API (для правки команды запуска).
interface AppServerFull {
  id: number
  identifier: string
  egg: number
  container: {
    startup_command: string
    image: string
    environment: Record<string, string | number | boolean>
  }
}

/** Находит сервер Application API по короткому идентификатору (client id). */
export async function findAppServerByIdentifier(identifier: string) {
  const list = await appGet<FractalList<AppServerFull>>("/servers?per_page=200")
  const match = list.data.find((s) => s.attributes.identifier === identifier)
  return match?.attributes ?? null
}

/** Обновляет команду запуска сервера (Application API, права админа). */
export const updateAppServerStartup = (
  numericId: number,
  body: {
    startup: string
    environment: Record<string, string | number | boolean>
    egg: number
    image: string
    skip_scripts?: boolean
  },
) =>
  appSend(`/servers/${numericId}/startup`, "PATCH", {
    skip_scripts: false,
    ...body,
  })

// ---------- Client API: пользовательские API-ключи ----------

export const listClientApiKeys = () =>
  clientGet<FractalList<ClientApiKeyAttributes>>("/account/api-keys")

export const createClientApiKey = (description: string, allowed_ips: string[] = []) =>
  request<
    Fractal<ClientApiKeyAttributes> & { meta?: { secret_token: string } }
  >("client", "/account/api-keys", {
    method: "POST",
    body: { description, allowed_ips },
  })

export const deleteClientApiKey = (identifier: string) =>
  request<void>("client", `/account/api-keys/${identifier}`, {
    method: "DELETE",
  })

// ---------- Client API: журнал активности и SSH-ключи ----------

export const listAccountActivity = () =>
  clientGet<FractalList<AccountActivityAttributes>>(
    "/account/activity?per_page=50&sort=-timestamp",
  )

export const listSshKeys = () =>
  clientGet<FractalList<SshKeyAttributes>>("/account/ssh-keys")

export const createSshKey = (name: string, public_key: string) =>
  request<Fractal<SshKeyAttributes>>("client", "/account/ssh-keys", {
    method: "POST",
    body: { name, public_key },
  })

export const deleteSshKey = (fingerprint: string) =>
  request<void>("client", "/account/ssh-keys/remove", {
    method: "POST",
    body: { fingerprint },
  })

// ---------- Client API: двухфакторная аутентификация ----------

export const getTwoFactorSetup = () =>
  clientGet<{ data: { image_url_data: string; secret?: string } }>(
    "/account/two-factor",
  )

export const enableTwoFactor = (code: string, password?: string) =>
  request<{ object: string; attributes: { tokens: string[] } }>(
    "client",
    "/account/two-factor",
    { method: "POST", body: password ? { code, password } : { code } },
  )

export const disableTwoFactor = (password: string) =>
  request<void>("client", "/account/two-factor", {
    method: "DELETE",
    body: { password },
  })
