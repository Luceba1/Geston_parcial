import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'
import { useWebSocket } from '../shared/hooks'
import { CocinaCard, type PedidoCocina } from '../widgets/cocina/CocinaCard'
import { DisponibilidadModal } from '../widgets/cocina/DisponibilidadModal'
import { useUIStore } from '../stores/uiStore'
import { handleError } from '../shared/utils/logger'

const SOUND_KEY = 'cocina-sound-enabled'

let audioCtx: AudioContext | null = null

/** Obtiene o crea el AudioContext, reanudándolo si el browser lo suspendió (autoplay policy). */
function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playBeep() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch {
    // Web Audio API no disponible
  }
}

export default function CocinaPage() {
  const [porPreparar, setPorPreparar] = useState<PedidoCocina[]>([])
  const [enPreparacion, setEnPreparacion] = useState<PedidoCocina[]>([])
  const [loading, setLoading] = useState(true)
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off')
  const [flash, setFlash] = useState(false)
  const [disponibilidadOpen, setDisponibilidadOpen] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Toggle sonido — también activa el AudioContext (requerido por autoplay policy)
  const toggleSound = useCallback(() => {
    getAudioCtx() // fuerza la creación + resume si estaba suspendido
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem(SOUND_KEY, next ? 'on' : 'off')
      return next
    })
  }, [])

  // Fetch inicial + refetch
  const fetchPedidos = useCallback(async () => {
    try {
      const res = await api.get<{ items: PedidoCocina[]; total: number }>('/cocina/pedidos')
      const items = res.data.items
      setPorPreparar(items.filter((p) => p.estado_nombre === 'confirmado'))
      setEnPreparacion(items.filter((p) => p.estado_nombre === 'en_preparacion'))
    } catch (error) {
      addToast(`Error al cargar pedidos: ${handleError(error, 'CocinaPage.fetchPedidos')}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  // WebSocket handler
  const handleWSMessage = useCallback(
    (event: string, _data: unknown) => {
      switch (event) {
        case 'PEDIDO_CONFIRMADO': {
          // Nuevo pedido: refetch para traerlo completo
          fetchPedidos()
          // Alerta visual y sonora (US-COCINA-05)
          if (soundEnabled) playBeep()
          setFlash(true)
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = setTimeout(() => setFlash(false), 2000)
          break
        }
        case 'PEDIDO_EN_PREPARACION':
        case 'PEDIDO_EN_CAMINO':
        case 'PEDIDO_CANCELADO': {
          // Refetch para actualizar ambas columnas
          fetchPedidos()
          break
        }
      }
    },
    [fetchPedidos, soundEnabled]
  )

  // Polling: si WebSocket está desconectado, hacer fetch cada 30s
  useEffect(() => {
    if (wsStatus !== 'disconnected') return

    const interval = setInterval(fetchPedidos, 30_000)
    return () => clearInterval(interval)
  }, [wsStatus, fetchPedidos])

  const { status, reconnect } = useWebSocket('/api/v1/cocina/ws', {
    onMessage: handleWSMessage,
    enabled: true,
  })

  useEffect(() => {
    setWsStatus(status)
  }, [status])

  // Activar AudioContext en el primer click (autoplay policy del browser)
  useEffect(() => {
    const unlock = () => {
      getAudioCtx()
      document.removeEventListener('click', unlock)
    }
    document.addEventListener('click', unlock, { once: true })
    return () => document.removeEventListener('click', unlock)
  }, [])

  // Limpiar flash timeout
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
    }
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className={`transition-colors ${flash ? 'bg-yellow-50 dark:bg-yellow-950/10' : ''}`}>
      {/* Toolbar de cocina (estado WS, contador, toggle sonido) */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">👨‍🍳 Cocina</h1>
            <span className="text-sm text-muted-foreground">
              {wsStatus === 'connected' ? '🟢 En vivo' : wsStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Sin conexión en vivo'}
            </span>
            {wsStatus !== 'connected' && (
              <button
                onClick={reconnect}
                className="text-xs text-primary underline hover:no-underline"
              >
                Reconectar
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Total: {porPreparar.length + enPreparacion.length} pedidos
            </span>
            <button
              onClick={toggleSound}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                soundEnabled
                  ? 'border-primary text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground hover:bg-accent'
              }`}
              aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            >
              {soundEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
            </button>
            <button
              onClick={() => setDisponibilidadOpen(true)}
              className="text-sm px-3 py-1 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              📦 Disponibilidad
            </button>
          </div>
        </div>
      </div>

      {/* Columnas */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna: Por preparar */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              Por preparar
              <span className="text-sm text-muted-foreground font-normal">
                ({porPreparar.length})
              </span>
            </h2>
            <div className="space-y-4">
              {porPreparar.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay pedidos pendientes
                </p>
              ) : (
                porPreparar.map((pedido) => (
                  <CocinaCard key={pedido.id} pedido={pedido} onTransition={fetchPedidos} />
                ))
              )}
            </div>
          </section>

          {/* Columna: En preparación */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              En preparación
              <span className="text-sm text-muted-foreground font-normal">
                ({enPreparacion.length})
              </span>
            </h2>
            <div className="space-y-4">
              {enPreparacion.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay pedidos en preparación
                </p>
              ) : (
                enPreparacion.map((pedido) => (
                  <CocinaCard key={pedido.id} pedido={pedido} onTransition={fetchPedidos} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <DisponibilidadModal
        isOpen={disponibilidadOpen}
        onClose={() => setDisponibilidadOpen(false)}
      />
    </div>
  )
}
