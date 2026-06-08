// Типы ответов Pterodactyl API (Fractal-формат: object/attributes).
// Покрываем только поля, которые реально используются панелью.

export interface Fractal<T> {
  object: string
  attributes: T
}

export interface FractalList<T> {
  object: "list"
  data: Fractal<T>[]
  meta?: {
    pagination?: {
      total: number
      count: number
      per_page: number
      current_page: number
      total_pages: number
    }
  }
}

// ---------- Client API ----------

export interface ClientServerAttributes {
  server_owner: boolean
  identifier: string
  uuid: string
  name: string
  node: string
  description: string
  is_suspended: boolean
  is_installing: boolean
  sftp_details: { ip: string; port: number }
  limits: {
    memory: number // МБ
    swap: number
    disk: number // МБ
    io: number
    cpu: number // %
  }
  feature_limits: {
    databases: number
    allocations: number
    backups: number
  }
  relationships?: {
    allocations?: FractalList<AllocationAttributes>
  }
}

export interface ResourcesAttributes {
  current_state: "running" | "starting" | "stopping" | "offline"
  is_suspended: boolean
  resources: {
    memory_bytes: number
    cpu_absolute: number
    disk_bytes: number
    network_rx_bytes: number
    network_tx_bytes: number
    uptime: number // мс
  }
}

export interface WebsocketCredentials {
  token: string
  socket: string
}

export interface FileAttributes {
  name: string
  mode: string
  mode_bits: string
  size: number
  is_file: boolean
  is_symlink: boolean
  mimetype: string
  created_at: string
  modified_at: string
}

export interface DatabaseAttributes {
  id: string
  name: string
  username: string
  connections_from: string
  max_connections: number
  host: { address: string; port: number }
  relationships?: {
    password?: Fractal<{ password: string }>
  }
}

export interface ScheduleAttributes {
  id: number
  name: string
  cron: {
    day_of_week: string
    day_of_month: string
    month: string
    hour: string
    minute: string
  }
  is_active: boolean
  is_processing: boolean
  last_run_at: string | null
  next_run_at: string | null
  relationships?: {
    tasks?: FractalList<TaskAttributes>
  }
}

export interface TaskAttributes {
  id: number
  sequence_id: number
  action: string
  payload: string
  time_offset: number
  is_queued: boolean
}

export interface BackupAttributes {
  uuid: string
  name: string
  is_successful: boolean
  is_locked: boolean
  bytes: number
  created_at: string
  completed_at: string | null
}

export interface AllocationAttributes {
  id: number
  ip: string
  ip_alias: string | null
  port: number
  notes: string | null
  is_default: boolean
}

export interface StartupVariableAttributes {
  name: string
  description: string
  env_variable: string
  default_value: string
  server_value: string
  is_editable: boolean
  rules: string
}

export interface SubuserAttributes {
  uuid: string
  username: string
  email: string
  image: string
  "2fa_enabled": boolean
  created_at: string
  permissions: string[]
}

// ---------- Application API ----------

export interface AppUserAttributes {
  id: number
  uuid: string
  username: string
  email: string
  first_name: string
  last_name: string
  language: string
  root_admin: boolean
  "2fa": boolean
  created_at: string
}

export interface AppNodeAttributes {
  id: number
  uuid: string
  name: string
  location_id: number
  fqdn: string
  scheme: string
  memory: number
  memory_overallocate: number
  disk: number
  disk_overallocate: number
  maintenance_mode: boolean
  relationships?: {
    allocations?: FractalList<AllocationAttributes>
  }
}

export interface AppNodeUtilization {
  memory: { total: number; used: number }
  disk: { total: number; used: number }
}

export interface AppLocationAttributes {
  id: number
  short: string
  long: string
  created_at: string
}

export interface AppNestAttributes {
  id: number
  uuid: string
  author: string
  name: string
  description: string | null
  created_at: string
  relationships?: {
    eggs?: FractalList<AppEggAttributes>
  }
}

export interface AppEggAttributes {
  id: number
  uuid: string
  nest: number
  author: string
  name: string
  description: string | null
  docker_image: string
  docker_images?: Record<string, string>
  startup: string
  created_at: string
  relationships?: {
    variables?: FractalList<AppEggVariableAttributes>
  }
}

export interface AppEggVariableAttributes {
  id: number
  name: string
  description: string | null
  env_variable: string
  default_value: string | null
  user_viewable: boolean
  user_editable: boolean
  rules: string
}

export interface AppMountAttributes {
  id: number
  uuid: string
  name: string
  description: string | null
  source: string
  target: string
  read_only: boolean
  user_mountable: boolean
}

export interface ClientApiKeyAttributes {
  identifier: string
  description: string
  allowed_ips: string[]
  last_used_at: string | null
  created_at: string
}

export interface AccountActivityAttributes {
  id: string
  batch: string | null
  event: string
  is_api: boolean
  ip: string | null
  description: string | null
  properties: Record<string, unknown>
  has_additional_metadata: boolean
  timestamp: string
}

export interface SshKeyAttributes {
  name: string
  public_key: string
  fingerprint: string
  created_at: string
}
