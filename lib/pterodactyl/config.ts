// Конфигурация подключения к Pterodactyl.
// Все значения читаются ТОЛЬКО на сервере (route handlers / server components).
// Ключи никогда не отправляются в браузер (этот модуль импортируется только серверным кодом).

export const ptero = {
  /** Базовый URL панели Pterodactyl, например https://panel.example.com */
  url: (process.env.PTERODACTYL_URL ?? "").replace(/\/+$/, ""),
  /** Client API ключ (ptlc_...) — опциональный fallback, если без логина */
  clientKey: process.env.PTERODACTYL_CLIENT_KEY ?? "",
  /** Application API ключ (ptla_...) — для админки (ноды/локации/юзеры) */
  appKey: process.env.PTERODACTYL_APP_KEY ?? "",
}

/** Брендирование по умолчанию (переопределяется в Panel Settings). */
export const brand = {
  name: process.env.APP_NAME?.trim() || "Phyliactyl",
  tagline: process.env.APP_TAGLINE?.trim() || "",
}

/** Настроен ли Client API (для пользовательской части панели). */
export function isClientConfigured(): boolean {
  return Boolean(ptero.url && ptero.clientKey)
}

/** Настроен ли Application API (для админки). */
export function isAppConfigured(): boolean {
  return Boolean(ptero.url && ptero.appKey)
}

/** Ошибка обращения к Pterodactyl API. */
export class PteroError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message)
    this.name = "PteroError"
  }
}
