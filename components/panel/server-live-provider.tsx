"use client"

import * as React from "react"
import { useServerSocket } from "@/hooks/use-server-socket"

type Live = ReturnType<typeof useServerSocket>

const ServerLiveContext = React.createContext<Live | null>(null)

/**
 * Единое live-подключение к Wings на весь раздел сервера.
 * И шапка (ServerShell), и консоль читают один и тот же сокет,
 * поэтому статус/питание/логи синхронны и обновляются в реальном времени.
 */
export function ServerLiveProvider({
  serverId,
  children,
}: {
  serverId: string
  children: React.ReactNode
}) {
  const live = useServerSocket(serverId)
  return (
    <ServerLiveContext.Provider value={live}>
      {children}
    </ServerLiveContext.Provider>
  )
}

export function useServerLive(): Live {
  const ctx = React.useContext(ServerLiveContext)
  if (!ctx) {
    throw new Error("useServerLive must be used within ServerLiveProvider")
  }
  return ctx
}
