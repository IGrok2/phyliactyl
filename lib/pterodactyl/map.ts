// Мапперы: Pterodactyl Fractal-ответы → внутренние UI-типы (lib/data.ts).
// Это позволяет страницам почти не меняться при переходе с mock на реальные данные.
import type {
  ClientServerAttributes,
  ResourcesAttributes,
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
  Fractal,
} from "./types"
import type {
  Server,
  ServerStatus,
  FileEntry,
  Database,
  Schedule,
  Backup,
  Allocation,
  Subuser,
  PanelUser,
  Node,
  Location,
  Nest,
  Egg,
  Mount,
  ApiKey,
  ActivityEntry,
  SshKey,
} from "@/lib/data"

const B_TO_MB = 1024 * 1024
const B_TO_KB = 1024

function defaultAllocation(attr: ClientServerAttributes) {
  const allocs = attr.relationships?.allocations?.data ?? []
  const def = allocs.find((a) => a.attributes.is_default) ?? allocs[0]
  return def?.attributes
}

function stateToStatus(
  attr: ClientServerAttributes,
  state?: ResourcesAttributes["current_state"],
): ServerStatus {
  if (attr.is_installing) return "installing"
  if (state) return state === "offline" ? "offline" : state
  if (attr.is_suspended) return "offline"
  return "offline"
}

export function mapServer(
  attr: ClientServerAttributes,
  res?: ResourcesAttributes,
): Server {
  const alloc = defaultAllocation(attr)
  const r = res?.resources
  return {
    id: attr.identifier,
    name: attr.name,
    description: attr.description || "",
    game: attr.node, // egg/nest недоступны в Client API — показываем ноду
    status: stateToStatus(attr, res?.current_state),
    address: alloc?.ip_alias ?? alloc?.ip ?? attr.sftp_details.ip,
    port: alloc?.port ?? attr.sftp_details.port,
    node: attr.node,
    location: attr.node,
    sftp: { ip: attr.sftp_details.ip, port: attr.sftp_details.port },
    uptime: r ? Math.floor(r.uptime / 1000) : 0,
    players: { online: 0, max: 0 },
    usage: {
      cpu: r ? Math.round(r.cpu_absolute) : 0,
      memoryUsed: r ? Math.round(r.memory_bytes / B_TO_MB) : 0,
      memoryLimit: attr.limits.memory,
      diskUsed: r ? Math.round(r.disk_bytes / B_TO_MB) : 0,
      diskLimit: attr.limits.disk,
      netIn: r ? Math.round(r.network_rx_bytes / B_TO_KB) : 0,
      netOut: r ? Math.round(r.network_tx_bytes / B_TO_KB) : 0,
    },
    cpuLimit: attr.limits.cpu,
  }
}

export function mapFile(attr: FileAttributes): FileEntry {
  return {
    name: attr.name,
    type: attr.is_file ? "file" : "directory",
    size: attr.size,
    modified: attr.modified_at,
    mode: attr.mode_bits || attr.mode,
  }
}

export function mapDatabase(attr: DatabaseAttributes): Database {
  return {
    id: attr.id,
    name: attr.name,
    username: attr.username,
    host: attr.host.address,
    port: attr.host.port,
    connectionsFrom: attr.connections_from,
    maxConnections: attr.max_connections || 0,
  }
}

export function dbPassword(attr: DatabaseAttributes): string {
  return attr.relationships?.password?.attributes.password ?? ""
}

export function mapSchedule(attr: ScheduleAttributes): Schedule {
  const cron = `${attr.cron.minute} ${attr.cron.hour} ${attr.cron.day_of_month} ${attr.cron.month} ${attr.cron.day_of_week}`
  const tasks = (attr.relationships?.tasks?.data ?? []).map((t) => ({
    id: String(t.attributes.id),
    action: t.attributes.action,
    payload: t.attributes.payload,
    offset: t.attributes.time_offset,
  }))
  return {
    id: String(attr.id),
    name: attr.name,
    cron,
    lastRun: attr.last_run_at,
    nextRun: attr.next_run_at ?? "",
    active: attr.is_active,
    tasks,
  }
}

export function mapBackup(attr: BackupAttributes): Backup {
  return {
    id: attr.uuid,
    name: attr.name,
    size: attr.bytes,
    createdAt: attr.created_at,
    locked: attr.is_locked,
    successful: attr.is_successful,
  }
}

export function mapAllocation(attr: AllocationAttributes): Allocation {
  return {
    id: String(attr.id),
    ip: attr.ip,
    port: attr.port,
    alias: attr.ip_alias,
    primary: attr.is_default,
  }
}

export function mapStartupVariable(attr: StartupVariableAttributes) {
  return {
    name: attr.name,
    description: attr.description,
    envVariable: attr.env_variable,
    value: attr.server_value || attr.default_value,
    defaultValue: attr.default_value,
    editable: attr.is_editable,
  }
}

const PALETTE = [
  "oklch(0.7 0 0)",
  "oklch(0.6 0 0)",
  "oklch(0.55 0 0)",
  "oklch(0.5 0 0)",
]

export function mapSubuser(attr: SubuserAttributes, i = 0): Subuser {
  return {
    id: attr.uuid,
    email: attr.email,
    avatarColor: PALETTE[i % PALETTE.length],
    permissions: attr.permissions,
    twoFactor: attr["2fa_enabled"],
  }
}

export function mapAppUser(attr: AppUserAttributes, i = 0): PanelUser {
  return {
    id: String(attr.id),
    username: attr.username,
    email: attr.email,
    firstName: attr.first_name,
    lastName: attr.last_name,
    admin: attr.root_admin,
    twoFactor: attr["2fa"],
    createdAt: attr.created_at,
    avatarColor: PALETTE[i % PALETTE.length],
  }
}

export function mapEgg(attr: AppEggAttributes): Egg {
  return {
    id: String(attr.id),
    name: attr.name,
    description: attr.description ?? "",
    dockerImage: attr.docker_image,
  }
}

export function mapNest(attr: AppNestAttributes): Nest {
  const eggs = (attr.relationships?.eggs?.data ?? []).map((e) =>
    mapEgg(e.attributes),
  )
  return {
    id: String(attr.id),
    name: attr.name,
    description: attr.description ?? "",
    author: attr.author,
    eggs,
  }
}

export function mapMount(attr: AppMountAttributes): Mount {
  return {
    id: String(attr.id),
    name: attr.name,
    description: attr.description ?? "",
    source: attr.source,
    target: attr.target,
    readOnly: attr.read_only,
    userMountable: attr.user_mountable,
  }
}

export function mapApiKey(attr: ClientApiKeyAttributes): ApiKey {
  return {
    id: attr.identifier,
    description: attr.description,
    allowedIps: attr.allowed_ips ?? [],
    lastUsed: attr.last_used_at,
    createdAt: attr.created_at,
  }
}

export function mapActivity(attr: AccountActivityAttributes): ActivityEntry {
  return {
    id: attr.id,
    event: attr.event,
    ip: attr.ip,
    isApi: attr.is_api,
    description: attr.description ?? "",
    timestamp: attr.timestamp,
  }
}

export function mapSshKey(attr: SshKeyAttributes): SshKey {
  return {
    name: attr.name,
    fingerprint: attr.fingerprint,
    publicKey: attr.public_key,
    createdAt: attr.created_at,
  }
}

export function mapNode(
  node: Fractal<AppNodeAttributes>,
  util: AppNodeUtilization | null,
  locationShort?: string,
): Node {
  const a = node.attributes
  return {
    id: String(a.id),
    name: a.name,
    fqdn: a.fqdn,
    location: locationShort ?? String(a.location_id),
    status: a.maintenance_mode ? "offline" : "online",
    memory: {
      used: util ? Math.round(util.memory.used / B_TO_MB) : 0,
      total: a.memory,
    },
    disk: {
      used: util ? Math.round(util.disk.used / B_TO_MB) : 0,
      total: a.disk,
    },
    servers: 0,
  }
}

export function mapLocation(attr: AppLocationAttributes): Location {
  return {
    id: String(attr.id),
    short: attr.short,
    long: attr.long,
    nodes: 0,
    servers: 0,
  }
}
