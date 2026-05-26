import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../stores'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting'

interface SSEOptions {
  onMessage?: (event: string, data: unknown) => void
  enabled?: boolean
}

interface SSEReturn {
  status: ConnectionStatus
  reconnect: () => void
}

/**
 * Hook para conectarse a un stream SSE con reconexión automática.
 *
 * El token JWT se pasa como query param porque EventSource
 * no soporta headers personalizados.
 */
export function useSSE(endpoint: string, options: SSEOptions = {}): SSEReturn {
  const { onMessage, enabled = true } = options
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 10

  const connect = useCallback(() => {
    const token = useAuthStore.getState().token
    if (!token || !enabled) return

    // Limpiar conexión anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setStatus('connecting')

    const url = `${API_URL}${endpoint}?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      setStatus('connected')
      retryCountRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage?.(event.type || 'message', data)
      } catch {
        // Ignorar eventos no JSON (heartbeats, etc.)
      }
    }

    // Manejar eventos nombrados: el server envía "event: <tipo>\ndata: ..."
    // EventSource dispara eventos con el nombre del evento del server
    // Para eventos nombrados, usamos addEventListener
    const handleEvent = (eventType: string) => {
      es.addEventListener(eventType, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(eventType, data)
        } catch {
          // ignorar
        }
      })
    }

    handleEvent('PEDIDO_CONFIRMADO')
    handleEvent('PEDIDO_EN_PREPARACION')
    handleEvent('PEDIDO_EN_CAMINO')
    handleEvent('PEDIDO_CANCELADO')

    es.onerror = () => {
      setStatus('disconnected')
      es.close()
      eventSourceRef.current = null

      // Reconexión con backoff exponencial (máx 30s)
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
      retryCountRef.current += 1

      if (retryCountRef.current <= maxRetries) {
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }
  }, [endpoint, onMessage, enabled])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
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
