import { useCallback, useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../shared/ui'
import { useUIStore } from '../../stores/uiStore'
import { handleError } from '../../shared/utils/logger'

interface DetalleCocina {
  nombre_snapshot: string
  cantidad: number
  subtotal: number
  personalizacion_snapshot?: string | null
  excluded_ingredient_ids?: string | null
}

export interface PedidoCocina {
  id: number
  estado_nombre: string
  items: DetalleCocina[]
  notas?: string | null
  direccion_snapshot?: string | null
  entrada_cocina_en: string
}

interface CocinaCardProps {
  pedido: PedidoCocina
  onTransition: () => void
}

const URGENCIA_NORMAL = 10 * 60 * 1000      // 10 min
const URGENCIA_ADVERTENCIA = 20 * 60 * 1000  // 20 min

function getTimerStyle(ms: number): string {
  if (ms <= 0) return 'border-border'
  if (ms >= URGENCIA_ADVERTENCIA) return 'border-red-500 bg-red-50 dark:bg-red-950/20'
  if (ms >= URGENCIA_NORMAL) return 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
  return 'border-border'
}

function getTimerText(ms: number): { text: string; className: string } {
  if (ms <= 0) return { text: '0:00', className: 'text-muted-foreground' }

  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const text = `${min}:${sec.toString().padStart(2, '0')}`

  if (ms >= URGENCIA_ADVERTENCIA) return { text, className: 'text-red-600 font-bold' }
  if (ms >= URGENCIA_NORMAL) return { text, className: 'text-orange-500 font-semibold' }
  return { text, className: 'text-muted-foreground' }
}

/** Fuerza la interpretación como UTC: si el string no tiene timezone, agrega Z */
function parseUtc(iso: string): number {
  const hasTz = iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)
  return new Date(hasTz ? iso : iso + 'Z').getTime()
}

export function CocinaCard({ pedido, onTransition }: CocinaCardProps) {
  const addToast = useUIStore((s) => s.addToast)
  const [timer, setTimer] = useState(Date.now() - parseUtc(pedido.entrada_cocina_en))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Date.now() - parseUtc(pedido.entrada_cocina_en))
    }, 15_000)
    return () => clearInterval(interval)
  }, [pedido.entrada_cocina_en])

  const tomarPedido = useCallback(async () => {
    setLoading(true)
    try {
      await api.put(`/pedidos/${pedido.id}/estado`, { estado_nombre: 'en_preparacion' })
      addToast(`Pedido #${pedido.id} → En Preparación`, 'success')
      onTransition()
    } catch (error) {
      addToast(`Error: ${handleError(error, 'CocinaCard.tomarPedido')}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [pedido.id, addToast, onTransition])

  const marcarTerminado = useCallback(async () => {
    setLoading(true)
    try {
      await api.put(`/pedidos/${pedido.id}/estado`, { estado_nombre: 'en_camino' })
      addToast(`Pedido #${pedido.id} → En Camino`, 'success')
      onTransition()
    } catch (error) {
      addToast(`Error: ${handleError(error, 'CocinaCard.marcarTerminado')}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [pedido.id, addToast, onTransition])

  const esParaPreparar = pedido.estado_nombre === 'confirmado'
  const timerDisplay = getTimerText(timer)

  return (
    <div
      className={`rounded-lg border-2 p-4 space-y-3 bg-card shadow-sm transition-colors ${getTimerStyle(timer)}`}
    >
      {/* Header: N° de pedido + timer */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-foreground">#{pedido.id}</h3>
        <span className={`text-sm font-mono whitespace-nowrap ${timerDisplay.className}`}>
          {timerDisplay.text}
        </span>
      </div>

      {/* Items del pedido */}
      <div className="space-y-1">
        {pedido.items.map((item, i) => (
          <div key={i}>
            <p className="text-sm text-foreground">
              <span className="font-medium">{item.cantidad}x</span> {item.nombre_snapshot}
            </p>
            {item.personalizacion_snapshot && (
              <p className="text-xs text-muted-foreground ml-4">
                ✦ {item.personalizacion_snapshot}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Notas del cliente */}
      {pedido.notas && (
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Notas:</span> {pedido.notas}
          </p>
        </div>
      )}

      {/* Acciones */}
      <div>
        {esParaPreparar ? (
          <Button
            className="w-full"
            size="sm"
            onClick={tomarPedido}
            isLoading={loading}
          >
            Iniciar Preparación
          </Button>
        ) : (
          <Button
            className="w-full bg-green-600 text-white hover:bg-green-700"
            size="sm"
            onClick={marcarTerminado}
            isLoading={loading}
          >
            Listo / En Camino
          </Button>
        )}
      </div>
    </div>
  )
}
