"use client"

import * as React from "react"
import { bff, apiSend } from "@/lib/api"

export interface LiveStats {
  cpu: number
  memoryBytes: number
  diskBytes: number
  netRx: number
  netTx: number
  uptime: number
  state: string
}

interface WsCreds {
  token: string
  socket: string
}

interface UseServerSocketResult {
  lines: string[]
  stats: LiveStats | null
  state: string | null
  live: boolean
  connected: boolean
  sendCommand: (command: string) => void
  setPowerState: (signal: "start" | "stop" | "restart" | "kill") => void
}

/**
 * Подключение к Wings WebSocket для живой консоли, статистики и питания.
 */
export function useServerSocket(serverId: string): UseServerSocketResult {
  const [lines, setLines] = React.useState<string[]>([])
  const [stats, setStats] = React.useState<LiveStats | null>(null)
  const [state, setState] = React.useState<string | null>(null)
  const [live, setLive] = React.useState(false)
  const [connected, setConnected] = React.useState(false)

  const wsRef = React.useRef<WebSocket | null>(null)
  const liveRef = React.useRef(false)

  const append = React.useCallback((line: string) => {
    setLines((prev) => {
      const next = [...prev, line]
      return next.length > 2000 ? next.slice(-2000) : next
    })
  }, [])

  const fetchCreds = React.useCallback(async () => {
    const res = await bff<WsCreds>(`/servers/${serverId}/websocket`)
    if (res.error || !res.data) return null
    return res.data
  }, [serverId])

  React.useEffect(() => {
    let cancelled = false
    let socket: WebSocket | null = null

    async function connect() {
      const creds = await fetchCreds().catch(() => null)
      if (cancelled || !creds) return

      try {
        socket = new WebSocket(creds.socket)
      } catch {
        return
      }
      wsRef.current = socket

      socket.onopen = () => {
        socket?.send(JSON.stringify({ event: "auth", args: [creds.token] }))
      }

      socket.onmessage = (ev) => {
        let msg: { event: string; args?: string[] }
        try {
          msg = JSON.parse(ev.data)
        } catch {
          return
        }
        const arg = msg.args?.[0]
        switch (msg.event) {
          case "auth success":
            setConnected(true)
            setLive(true)
            liveRef.current = true
            socket?.send(JSON.stringify({ event: "send logs", args: [null] }))
            break
          case "console output":
            if (arg !== undefined) append(arg)
            break
          case "status":
            if (arg) setState(arg)
            break
          case "stats": {
            if (!arg) break
            try {
              const s = JSON.parse(arg) as {
                cpu_absolute: number
                memory_bytes: number
                disk_bytes: number
                network: { rx_bytes: number; tx_bytes: number }
                uptime: number
                state: string
              }
              setStats({
                cpu: s.cpu_absolute,
                memoryBytes: s.memory_bytes,
                diskBytes: s.disk_bytes,
                netRx: s.network?.rx_bytes ?? 0,
                netTx: s.network?.tx_bytes ?? 0,
                uptime: s.uptime,
                state: s.state,
              })
              if (s.state) setState(s.state)
            } catch {
              // ignore
            }
            break
          }
          case "token expiring":
          case "token expired": {
            fetchCreds()
              .then((c) => {
                if (c && wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ event: "auth", args: [c.token] }))
                }
              })
              .catch(() => {})
            break
          }
        }
      }

      socket.onclose = () => {
        setConnected(false)
        liveRef.current = false
      }
      socket.onerror = () => {
        setConnected(false)
      }
    }

    connect()

    return () => {
      cancelled = true
      socket?.close()
      wsRef.current = null
      liveRef.current = false
    }
  }, [serverId, append, fetchCreds])

  const sendCommand = React.useCallback(
    (command: string) => {
      const ws = wsRef.current
      if (liveRef.current && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "send command", args: [command] }))
      } else {
        // Сокет не подключён — отправляем команду через BFF.
        apiSend(`/servers/${serverId}/command`, "POST", { command }).catch(() => {})
      }
    },
    [serverId],
  )

  const setPowerState = React.useCallback(
    (signal: "start" | "stop" | "restart" | "kill") => {
      const ws = wsRef.current
      if (liveRef.current && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "set state", args: [signal] }))
      } else {
        apiSend(`/servers/${serverId}/power`, "POST", { signal }).catch(() => {})
      }
    },
    [serverId],
  )

  return { lines, stats, state, live, connected, sendCommand, setPowerState }
}
