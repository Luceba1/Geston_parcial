import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { useUIStore } from '../stores/uiStore'

interface DetallePedido {
  id: number
  producto_id: number
  nombre_snapshot: string
  precio_snapshot: number
  cantidad: number
  subtotal: number
  excluded_ingredient_ids?: string | null
  personalizacion_snapshot?: string | null
}

interface HistorialEstado {
  id: number
  estado_id: number
  estado_nombre: string
  fecha_cambio: string
  notas?: string | null
}

interface Pedido {
  id: number
  usuario_id: number
  estado_id: number
  estado_nombre: string
  estado_orden: number
  subtotal: number
  costo_envio: number
  total: number
  notas?: string | null
  direccion_snapshot?: string | null
  fecha_pedido: string
  fecha_entrega_estimada?: string | null
  detalles: DetallePedido[]
  historial_estados: HistorialEstado[]
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-300',
  en_preparacion: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  listo_para_entrega: 'bg-purple-100 text-purple-800 border-purple-300',
  en_camino: 'bg-orange-100 text-orange-800 border-orange-300',
  entregado: 'bg-green-100 text-green-800 border-green-300',
  cancelado: 'bg-red-100 text-red-800 border-red-300',
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const fetchPedido = useCallback(async () => {
    try {
      const res = await api.get(`/pedidos/${id}`)
      setPedido(res.data)
    } catch {
      addToast('Error al cargar el pedido', 'error')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }, [id, addToast, navigate])

  useEffect(() => {
    fetchPedido()
  }, [fetchPedido])

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return
    setCancelling(true)
    try {
      await api.put(`/pedidos/${id}/estado`, {
        estado_nombre: 'cancelado',
        notas: 'Cancelado por el cliente',
      })
      addToast('Pedido cancelado', 'success')
      fetchPedido()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al cancelar pedido', 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando pedido...</div>
  }

  if (!pedido) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Pedido no encontrado</p>
        <Link to="/orders">
          <Button>Volver a Mis Pedidos</Button>
        </Link>
      </div>
    )
  }

  const canCancel = pedido.estado_nombre === 'pendiente'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/orders" className="text-sm text-green-600 hover:text-green-700 mb-2 inline-block">
          &larr; Volver a Mis Pedidos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pedido #{pedido.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(pedido.fecha_pedido).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${STATUS_COLORS[pedido.estado_nombre] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[pedido.estado_nombre] || pedido.estado_nombre}
            </span>
            {canCancel && (
              <Button variant="outline" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelando...' : 'Cancelar Pedido'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalle de productos */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Productos</h2>
            <div className="space-y-3">
              {pedido.detalles.map((det) => (
                <div key={det.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/productos/${det.producto_id}`}
                        className="font-medium text-gray-800 hover:text-green-600"
                      >
                        {det.nombre_snapshot}
                      </Link>
                      <span className="text-xs text-gray-400">x{det.cantidad}</span>
                    </div>
                    {det.personalizacion_snapshot && (
                      <p className="text-xs text-gray-500 mt-0.5">{det.personalizacion_snapshot}</p>
                    )}
                    {det.excluded_ingredient_ids && (
                      <p className="text-xs text-gray-400 mt-0.5">Ingredientes excluidos</p>
                    )}
                  </div>
                  <span className="font-medium text-gray-700">${det.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Dirección de entrega */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Dirección de Entrega</h2>
            <p className="text-sm text-gray-600">{pedido.direccion_snapshot || 'Sin dirección registrada'}</p>
          </Card>

          {/* Notas */}
          {pedido.notas && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Notas</h2>
              <p className="text-sm text-gray-600">{pedido.notas}</p>
            </Card>
          )}
        </div>

        {/* Sidebar: Resumen + Timeline */}
        <div className="space-y-6">
          {/* Resumen */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${pedido.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Envío</span>
                <span>{pedido.costo_envio === 0 ? 'Gratis' : `$${pedido.costo_envio.toFixed(2)}`}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">${pedido.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Timeline de estados */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Estado del Pedido</h2>
            <div className="relative">
              {pedido.historial_estados.length > 0 ? (
                <div className="space-y-4">
                  {[...pedido.historial_estados].reverse().map((h, idx) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[h.estado_nombre]?.split(' ')[0] || 'bg-gray-400'}`} />
                        {idx < pedido.historial_estados.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-sm text-gray-800">
                          {STATUS_LABELS[h.estado_nombre] || h.estado_nombre}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(h.fecha_cambio).toLocaleString('es-AR')}
                        </p>
                        {h.notas && (
                          <p className="text-xs text-gray-500 mt-0.5">{h.notas}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin historial disponible</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
