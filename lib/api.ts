"use client"

import * as React from "react"

interface BffResponse<T> {
  data?: T
  error?: string
  /** true — сессия отсутствует/истекла (нужно на /login) */
  unauthorized?: boolean
}

/** Низкоуровневый запрос к BFF. */
export async function bff<T>(
  path: string,
  init?: RequestInit,
): Promise<BffResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    if (res.status === 401) {
      return { unauthorized: true, error: "unauthorized" }
    }
    const json = (await res.json().catch(() => ({}))) as BffResponse<T>
    if (!res.ok && !json.error) {
      return { error: `HTTP ${res.status}` }
    }
    return json
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export const apiSend = <T>(
  path: string,
  method: "POST" | "DELETE" | "PUT" | "PATCH",
  body?: unknown,
) => bff<T>(path, { method, body: body ? JSON.stringify(body) : undefined })

function redirectToLogin() {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

interface UseApiResult<T> {
  data: T
  loading: boolean
  /** Совместимость: демо-режим удалён, всегда false */
  demo: boolean
  error: string | null
  reload: () => void
  setData: React.Dispatch<React.SetStateAction<T>>
}

/**
 * Загружает данные из BFF. При 401 перенаправляет на /login.
 * `initial` — начальное значение, пока идёт загрузка.
 */
export function useApiData<T>(path: string, initial: T): UseApiResult<T> {
  const [data, setData] = React.useState<T>(initial)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    bff<T>(path).then((res) => {
      if (cancelled) return
      if (res.unauthorized) {
        redirectToLogin()
        return
      }
      if (res.error) {
        setError(res.error)
      } else if (res.data !== undefined) {
        setData(res.data)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce])

  const reload = React.useCallback(() => setNonce((n) => n + 1), [])

  return { data, loading, demo: false, error, reload, setData }
}
