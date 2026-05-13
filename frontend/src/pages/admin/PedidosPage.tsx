import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { useUIStore } from '../../stores/uiStore'

interface DetallePedido {
  id: number
  nombre_snapshot: string
  precio_snapshot: number
  cantidad: number
  subtotal: number
}

interface Pedido {
  id: number
  usuario_id: number
  estado_nombre: string
  estado_orden: number
  subtotal: number
  total: number
  direccion_snapshot?: string | null
  fecha_pedido: string
  detalles: DetallePedido[]
}

interface PedidoListResponse {
  items: Pedido[]
  total: number
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  en_preparacion: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  listo_para_entrega: 'bg-purple-100 text-purple-800 border-purple-200',
  en_camino: 'bg-orange-100 text-orange-800 border-orange-200',
  entregado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  listo_para_entrega: 'Listo para Entrega',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// Transiciones disponibles para cada estado
const NEXT_STATES: Record<string, Array<{ nombre: string; label: string; color: string }>> = {
  pendiente: [
    { nombre: 'confirmado', label: 'Confirmar', color: 'blue' },
    { nombre: 'cancelado', label: 'Cancelar', color: 'red' },
  ],
  confirmado: [
    { nombre: 'en_preparacion', label: 'En Preparación', color: 'indigo' },
    { nombre: 'cancelado', label: 'Cancelar', color: 'red' },
  ],
  en_preparacion: [
    { nombre: 'listo_para_entrega', label: 'Listo para Entrega', color: 'purple' },
    { nombre: 'cancelado', label: 'Cancelar', color: 'red' },
  ],
  listo_para_entrega: [
    { nombre: 'en_camino', label: 'En Camino', color: 'orange' },
  ],
  en_camino: [
    { nombre: 'entregado', label: 'Marcar Entregado', color: 'green' },
  ],
  entregado: [],
  cancelado: [],
}

export default function PedidosPage() {
  const [data, setData] = useState<PedidoListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const addToast = useUIStore((s) => s.addToast)

  const fetchPedidos = useCallback(async () => {
    try {
      const res = await api.get('/pedidos/admin?page=1&limit=100')
      setData(res.data)
    } catch {
      addToast('Error al cargar pedidos', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  const handleTransition = async (pedidoId: number, estadoNombre: string) => {
    setUpdating(pedidoId)
    try {
      await api.put(`/pedidos/${pedidoId}/estado`, {
        estado_nombre: estadoNombre,
      })
      addToast(`Pedido #${pedidoId} actualizado a "${STATUS_LABELS[estadoNombre] || estadoNombre}"`, 'success')
      fetchPedidos()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al actualizar estado', 'error')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Administrá el estado de todos los pedidos</p>
      </div>

      {!data || data.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((pedido) => {
            const nextActions = NEXT_STATES[pedido.estado_nombre] || []
            return (
              <Card key={pedido.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-800">Pedido #{pedido.id}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[pedido.estado_nombre] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[pedido.estado_nombre] || pedido.estado_nombre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Usuario #{pedido.usuario_id} — {new Date(pedido.fecha_pedido).toLocaleString('es-AR')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {pedido.detalles?.length || 0} producto{(pedido.detalles?.length || 0) !== 1 ? 's' : ''}
                      {pedido.detalles && pedido.detalles.length > 0 && (
                        <>: {pedido.detalles.slice(0, 3).map((d) => d.nombre_snapshot).join(', ')}{pedido.detalles.length > 3 ? '...' : ''}</>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">${pedido.total.toFixed(2)}</p>
                  </div>

                  {nextActions.length > 0 && (
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {nextActions.map((action) => (
                        <Button
                          key={action.nombre}
                          size="sm"
                          variant={action.color === 'red' ? 'outline' : 'primary'}
                          onClick={() => handleTransition(pedido.id, action.nombre)}
                          disabled={updating === pedido.id}
                        >
                          {updating === pedido.id ? '...' : action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
