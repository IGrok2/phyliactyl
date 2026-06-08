// Mock-данные и типы для панели управления игровыми серверами.
// Это фронтенд-демо: все данные статичны и хранятся локально.

export type ServerStatus = "running" | "offline" | "starting" | "stopping" | "installing"

export type ServerGame = string

export interface ResourceUsage {
  /** в процентах 0-100 */
  cpu: number
  /** использовано МБ */
  memoryUsed: number
  /** лимит МБ */
  memoryLimit: number
  /** использовано МБ диска */
  diskUsed: number
  /** лимит МБ */
  diskLimit: number
  /** входящий трафик КБ/с */
  netIn: number
  /** исходящий трафик КБ/с */
  netOut: number
}

export interface Server {
  id: string
  name: string
  description: string
  game: ServerGame
  status: ServerStatus
  /** основной адрес подключения */
  address: string
  port: number
  node: string
  location: string
  /** SFTP-подключение (адрес/порт демона) */
  sftp?: { ip: string; port: number }
  /** аптайм в секундах */
  uptime: number
  players: { online: number; max: number }
  usage: ResourceUsage
  cpuLimit: number // в %
}

export interface FileEntry {
  name: string
  type: "file" | "directory"
  size: number // в байтах
  modified: string // ISO дата
  mode: string // права, например "0644"
}

export interface Backup {
  id: string
  name: string
  size: number // байт
  createdAt: string
  locked: boolean
  successful: boolean
}

export interface Database {
  id: string
  name: string
  username: string
  host: string
  port: number
  connectionsFrom: string
  maxConnections: number
}

export interface Schedule {
  id: string
  name: string
  cron: string
  lastRun: string | null
  nextRun: string
  active: boolean
  tasks: { id: string; action: string; payload: string; offset: number }[]
}

export interface Subuser {
  id: string
  email: string
  avatarColor: string
  permissions: string[]
  twoFactor: boolean
}

export interface Allocation {
  id: string
  ip: string
  port: number
  alias: string | null
  primary: boolean
}

export interface Node {
  id: string
  name: string
  fqdn: string
  location: string
  status: "online" | "offline"
  memory: { used: number; total: number } // МБ
  disk: { used: number; total: number } // МБ
  servers: number
}

export interface Location {
  id: string
  short: string
  long: string
  nodes: number
  servers: number
}

export interface PanelUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  admin: boolean
  twoFactor: boolean
  createdAt: string
  avatarColor: string
}

export interface Egg {
  id: string
  name: string
  description: string
  dockerImage: string
}

export interface Nest {
  id: string
  name: string
  description: string
  author: string
  eggs: Egg[]
}

export interface Mount {
  id: string
  name: string
  description: string
  source: string
  target: string
  readOnly: boolean
  userMountable: boolean
}

export interface ApiKey {
  id: string
  description: string
  allowedIps: string[]
  lastUsed: string | null
  createdAt: string
}

export interface ActivityEntry {
  id: string
  event: string
  ip: string | null
  isApi: boolean
  description: string
  timestamp: string
}

export interface SshKey {
  name: string
  fingerprint: string
  publicKey: string
  createdAt: string
}

export const servers: Server[] = [
  {
    id: "a1b2c3",
    name: "Survival World",
    description: "Основной выживальный сервер с модами",
    game: "Minecraft",
    status: "running",
    address: "play.example.net",
    port: 25565,
    node: "Node-DE-01",
    location: "Frankfurt",
    uptime: 384210,
    players: { online: 18, max: 60 },
    usage: {
      cpu: 42,
      memoryUsed: 5320,
      memoryLimit: 8192,
      diskUsed: 12400,
      diskLimit: 40960,
      netIn: 128,
      netOut: 256,
    },
    cpuLimit: 200,
  },
  {
    id: "d4e5f6",
    name: "Rust Main",
    description: "Wipe каждое воскресенье",
    game: "Rust",
    status: "running",
    address: "rust.example.net",
    port: 28015,
    node: "Node-DE-01",
    location: "Frankfurt",
    uptime: 91230,
    players: { online: 124, max: 200 },
    usage: {
      cpu: 88,
      memoryUsed: 14200,
      memoryLimit: 16384,
      diskUsed: 28600,
      diskLimit: 51200,
      netIn: 512,
      netOut: 1024,
    },
    cpuLimit: 400,
  },
  {
    id: "g7h8i9",
    name: "CS2 Competitive",
    description: "5v5 матчмейкинг",
    game: "CS2",
    status: "offline",
    address: "cs.example.net",
    port: 27015,
    node: "Node-US-02",
    location: "New York",
    uptime: 0,
    players: { online: 0, max: 10 },
    usage: {
      cpu: 0,
      memoryUsed: 0,
      memoryLimit: 4096,
      diskUsed: 18200,
      diskLimit: 30720,
      netIn: 0,
      netOut: 0,
    },
    cpuLimit: 200,
  },
  {
    id: "j1k2l3",
    name: "Valheim Vikings",
    description: "Кооп прохождение",
    game: "Valheim",
    status: "starting",
    address: "valheim.example.net",
    port: 2456,
    node: "Node-US-02",
    location: "New York",
    uptime: 12,
    players: { online: 0, max: 10 },
    usage: {
      cpu: 12,
      memoryUsed: 1200,
      memoryLimit: 4096,
      diskUsed: 4200,
      diskLimit: 20480,
      netIn: 8,
      netOut: 4,
    },
    cpuLimit: 200,
  },
  {
    id: "m4n5o6",
    name: "ARK Island",
    description: "PvE кластер",
    game: "ARK",
    status: "running",
    address: "ark.example.net",
    port: 7777,
    node: "Node-SG-03",
    location: "Singapore",
    uptime: 220140,
    players: { online: 31, max: 70 },
    usage: {
      cpu: 64,
      memoryUsed: 11800,
      memoryLimit: 16384,
      diskUsed: 44200,
      diskLimit: 81920,
      netIn: 320,
      netOut: 410,
    },
    cpuLimit: 600,
  },
  {
    id: "p7q8r9",
    name: "Terraria Hardcore",
    description: "Эксперт-режим",
    game: "Terraria",
    status: "installing",
    address: "terraria.example.net",
    port: 7777,
    node: "Node-SG-03",
    location: "Singapore",
    uptime: 0,
    players: { online: 0, max: 16 },
    usage: {
      cpu: 0,
      memoryUsed: 0,
      memoryLimit: 2048,
      diskUsed: 0,
      diskLimit: 10240,
      netIn: 0,
      netOut: 0,
    },
    cpuLimit: 100,
  },
]

export function getServer(id: string): Server | undefined {
  return servers.find((s) => s.id === id)
}

export const consoleLines: string[] = [
  "[12:04:21] [Server thread/INFO]: Starting minecraft server version 1.20.4",
  "[12:04:21] [Server thread/INFO]: Loading properties",
  "[12:04:22] [Server thread/INFO]: Default game type: SURVIVAL",
  "[12:04:22] [Server thread/INFO]: Generating keypair",
  "[12:04:23] [Server thread/INFO]: Starting Minecraft server on *:25565",
  "[12:04:24] [Server thread/INFO]: Preparing level \"world\"",
  "[12:04:27] [Server thread/INFO]: Preparing start region for dimension minecraft:overworld",
  "[12:04:29] [Server thread/INFO]: Time elapsed: 1893 ms",
  "[12:04:29] [Server thread/INFO]: Done (6.214s)! For help, type \"help\"",
  "[12:05:02] [Server thread/INFO]: Steve joined the game",
  "[12:05:11] [Server thread/INFO]: Alex joined the game",
  "[12:06:48] [Server thread/INFO]: <Steve> привет всем",
  "[12:07:03] [Server thread/INFO]: <Alex> йо",
  "[12:09:15] [Server thread/INFO]: Saving the game (this may take a moment!)",
  "[12:09:16] [Server thread/INFO]: Saved the game",
]

export const files: FileEntry[] = [
  { name: "plugins", type: "directory", size: 0, modified: "2025-05-30T14:22:00Z", mode: "0755" },
  { name: "world", type: "directory", size: 0, modified: "2025-06-06T09:11:00Z", mode: "0755" },
  { name: "world_nether", type: "directory", size: 0, modified: "2025-06-06T09:11:00Z", mode: "0755" },
  { name: "logs", type: "directory", size: 0, modified: "2025-06-07T12:09:00Z", mode: "0755" },
  { name: "server.properties", type: "file", size: 1429, modified: "2025-06-01T18:30:00Z", mode: "0644" },
  { name: "server.jar", type: "file", size: 48234112, modified: "2025-05-28T10:00:00Z", mode: "0644" },
  { name: "eula.txt", type: "file", size: 189, modified: "2025-05-28T10:01:00Z", mode: "0644" },
  { name: "ops.json", type: "file", size: 312, modified: "2025-06-03T22:14:00Z", mode: "0644" },
  { name: "whitelist.json", type: "file", size: 87, modified: "2025-06-02T11:05:00Z", mode: "0644" },
  { name: "start.sh", type: "file", size: 256, modified: "2025-05-28T10:02:00Z", mode: "0755" },
]

export const backups: Backup[] = [
  { id: "bk1", name: "Авто-бэкап 2025-06-07", size: 1288490188, createdAt: "2025-06-07T03:00:00Z", locked: false, successful: true },
  { id: "bk2", name: "Перед обновлением 1.20.4", size: 1180590080, createdAt: "2025-05-28T09:55:00Z", locked: true, successful: true },
  { id: "bk3", name: "Авто-бэкап 2025-06-06", size: 1254780928, createdAt: "2025-06-06T03:00:00Z", locked: false, successful: true },
  { id: "bk4", name: "Ручной бэкап", size: 0, createdAt: "2025-06-05T16:42:00Z", locked: false, successful: false },
]

export const databases: Database[] = [
  { id: "db1", name: "s1_main", username: "u1_app", host: "10.0.0.12", port: 3306, connectionsFrom: "%", maxConnections: 25 },
  { id: "db2", name: "s1_stats", username: "u1_stats", host: "10.0.0.12", port: 3306, connectionsFrom: "10.0.0.%", maxConnections: 10 },
]

export const schedules: Schedule[] = [
  {
    id: "sc1",
    name: "Ежедневный рестарт",
    cron: "0 5 * * *",
    lastRun: "2025-06-07T05:00:00Z",
    nextRun: "2025-06-08T05:00:00Z",
    active: true,
    tasks: [
      { id: "t1", action: "power", payload: "restart", offset: 0 },
      { id: "t2", action: "command", payload: "say Сервер перезагружается через 60 секунд", offset: -60 },
    ],
  },
  {
    id: "sc2",
    name: "Ночной бэкап",
    cron: "0 3 * * *",
    lastRun: "2025-06-07T03:00:00Z",
    nextRun: "2025-06-08T03:00:00Z",
    active: true,
    tasks: [{ id: "t3", action: "backup", payload: "", offset: 0 }],
  },
  {
    id: "sc3",
    name: "Еженедельный wipe",
    cron: "0 6 * * 0",
    lastRun: null,
    nextRun: "2025-06-08T06:00:00Z",
    active: false,
    tasks: [{ id: "t4", action: "command", payload: "wipe full", offset: 0 }],
  },
]

export const subusers: Subuser[] = [
  { id: "su1", email: "moderator@example.com", avatarColor: "oklch(0.6 0 0)", permissions: ["control.console", "control.start", "control.stop", "file.read"], twoFactor: true },
  { id: "su2", email: "helper@example.com", avatarColor: "oklch(0.5 0 0)", permissions: ["control.console", "file.read"], twoFactor: false },
]

export const allocations: Allocation[] = [
  { id: "al1", ip: "192.168.1.10", port: 25565, alias: "play.example.net", primary: true },
  { id: "al2", ip: "192.168.1.10", port: 25566, alias: null, primary: false },
  { id: "al3", ip: "192.168.1.10", port: 25567, alias: "map.example.net", primary: false },
]

export const startupVariables: { name: string; description: string; envVariable: string; value: string; editable: boolean }[] = [
  { name: "Версия сервера", description: "Версия игрового ядра", envVariable: "SERVER_VERSION", value: "1.20.4", editable: true },
  { name: "Тип ядра", description: "Vanilla / Paper / Spigot", envVariable: "SERVER_JARFILE", value: "server.jar", editable: true },
  { name: "Макс. игроков", description: "Лимит онлайна", envVariable: "MAX_PLAYERS", value: "60", editable: true },
  { name: "Build номер", description: "Сборка ядра (только чтение)", envVariable: "BUILD_NUMBER", value: "latest", editable: false },
]

export const startupCommand =
  "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}} nogui"

export const nodes: Node[] = [
  { id: "n1", name: "Node-DE-01", fqdn: "de01.example.net", location: "Frankfurt", status: "online", memory: { used: 38000, total: 65536 }, disk: { used: 420000, total: 1048576 }, servers: 14 },
  { id: "n2", name: "Node-US-02", fqdn: "us02.example.net", location: "New York", status: "online", memory: { used: 21000, total: 65536 }, disk: { used: 260000, total: 1048576 }, servers: 9 },
  { id: "n3", name: "Node-SG-03", fqdn: "sg03.example.net", location: "Singapore", status: "online", memory: { used: 49000, total: 65536 }, disk: { used: 680000, total: 1048576 }, servers: 21 },
  { id: "n4", name: "Node-DE-04", fqdn: "de04.example.net", location: "Frankfurt", status: "offline", memory: { used: 0, total: 32768 }, disk: { used: 120000, total: 524288 }, servers: 3 },
]

export const locations: Location[] = [
  { id: "l1", short: "FRA", long: "Frankfurt, Germany", nodes: 2, servers: 17 },
  { id: "l2", short: "NYC", long: "New York, USA", nodes: 1, servers: 9 },
  { id: "l3", short: "SGP", long: "Singapore", nodes: 1, servers: 21 },
]

export const panelUsers: PanelUser[] = [
  { id: "u1", username: "admin", email: "admin@example.com", admin: true, twoFactor: true, createdAt: "2024-11-02T10:00:00Z", avatarColor: "oklch(0.7 0 0)" },
  { id: "u2", username: "ilya", email: "ilya@example.com", admin: true, twoFactor: false, createdAt: "2025-01-15T14:30:00Z", avatarColor: "oklch(0.6 0 0)" },
  { id: "u3", username: "moderator", email: "moderator@example.com", admin: false, twoFactor: true, createdAt: "2025-03-21T09:12:00Z", avatarColor: "oklch(0.55 0 0)" },
  { id: "u4", username: "support", email: "support@example.com", admin: false, twoFactor: false, createdAt: "2025-04-08T17:45:00Z", avatarColor: "oklch(0.5 0 0)" },
]

export const allPermissions: { group: string; items: { key: string; label: string }[] }[] = [
  {
    group: "Консоль",
    items: [
      { key: "control.console", label: "Просмотр консоли" },
      { key: "control.start", label: "Запуск сервера" },
      { key: "control.stop", label: "Остановка сервера" },
      { key: "control.restart", label: "Перезапуск сервера" },
    ],
  },
  {
    group: "Файлы",
    items: [
      { key: "file.read", label: "Чтение файлов" },
      { key: "file.write", label: "Запись файлов" },
      { key: "file.delete", label: "Удаление файлов" },
    ],
  },
  {
    group: "Бэкапы",
    items: [
      { key: "backup.read", label: "Просмотр бэкапов" },
      { key: "backup.create", label: "Создание бэкапов" },
      { key: "backup.delete", label: "Удаление бэкапов" },
    ],
  },
]

// Хелперы форматирования

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatMB(mb: number): string {
  return formatBytes(mb * 1024 * 1024)
}

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d) parts.push(`${d}д`)
  if (h) parts.push(`${h}ч`)
  if (m) parts.push(`${m}м`)
  return parts.join(" ") || "<1м"
}

export const statusMeta: Record<ServerStatus, { label: string; dot: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  running: { label: "Работает", dot: "bg-emerald-500", variant: "outline" },
  offline: { label: "Выключен", dot: "bg-neutral-500", variant: "outline" },
  starting: { label: "Запуск", dot: "bg-amber-500", variant: "outline" },
  stopping: { label: "Остановка", dot: "bg-amber-500", variant: "outline" },
  installing: { label: "Установка", dot: "bg-sky-500", variant: "outline" },
}
