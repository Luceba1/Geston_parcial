import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../stores'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Convertir http:// a ws://, https:// a wss://
function toWsUrl(httpUrl: string, path: string): string {
  const url = new URL(httpUrl)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${url.host}${path}`
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting'

interface WebSocketOptions {
  onMessage?: (event: string, data: unknown) => void
  enabled?: boolean
}

interface WebSocketReturn {
  status: ConnectionStatus
  reconnect: () => void
}

/**
 * Hook para conectarse a un endpoint WebSocket con reconexión automática.
 *
 * El token JWT se pasa como query param.
 * El servidor envía mensajes JSON con formato:
 * ```json
 * {"event": "PEDIDO_CONFIRMADO", "data": {"pedido_id": 1}}
 * ```
 */
export function useWebSocket(endpoint: string, options: WebSocketOptions = {}): WebSocketReturn {
  const { onMessage, enabled = true } = options
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 10
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const connect = useCallback(() => {
    const token = useAuthStore.getState().token
    if (!token || !enabled) return

    // Limpiar conexión anterior
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    setStatus('connecting')

    const wsUrl = `${toWsUrl(API_URL, endpoint)}?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      retryCountRef.current = 0

      // Ping cada 25s para mantener la conexión viva (el server espera 30s)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          // No enviamos ping activo, el server nos manda heartbeat
          // Si queremos detectar cierre más rápido, podemos enviar un ping
          // pero no es necesario porque el server ya manda pings cada 30s
        }
      }, 25_000)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data)
        const { event: eventType, data } = payload
        if (eventType === 'ping') {
          // Heartbeat del server, ignorar
          return
        }
        onMessage?.(eventType, data)
      } catch {
        // Ignorar mensajes no JSON
      }
    }

    ws.onclose = () => {
      setStatus('disconnected')
      wsRef.current = null

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }

      // Reconexión con backoff exponencial (máx 30s)
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
      retryCountRef.current += 1

      if (retryCountRef.current <= maxRetries) {
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      // El error va seguido de onclose, así que manejamos todo ahí
    }
  }, [endpoint, onMessage, enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStatus('disconnected')
    retryCountRef.current = 0
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    connect()
  }, [connect, disconnect])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return { status, reconnect }
}
