import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
}

interface HistorialEstado {
  id: number
  estado_nombre: string
  fecha_cambio: string
}

interface Pedido {
  id: number
  estado_nombre: string
  estado_orden: number
  subtotal: number
  costo_envio: number
  total: number
  direccion_snapshot?: string | null
  fecha_pedido: string
  detalles: DetallePedido[]
  historial_estados: HistorialEstado[]
}

interface PedidoListResponse {
  items: Pedido[]
  total: number
  page: number
  limit: number
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

const LIMIT = 5

export default function OrdersPage() {
  const [data, setData] = useState<PedidoListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const addToast = useUIStore((s) => s.addToast)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/pedidos?page=${page}&limit=${LIMIT}`)
      setData(res.data)
    } catch {
      addToast('Error al cargar pedidos', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando pedidos...</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mis Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial de tus pedidos realizados</p>
      </div>

      {!data || data.items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-muted-foreground mb-4">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-lg text-muted-foreground mb-2">No tenés pedidos todavía</p>
          <p className="text-sm text-muted-foreground mb-6">Agregá productos al carrito y realizá tu primer pedido</p>
          <Link to="/catalogo">
            <Button>Ir al Catálogo</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.items.map((pedido) => (
              <Link key={pedido.id} to={`/orders/${pedido.id}`}>
                <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-foreground">
                          Pedido #{pedido.id}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[pedido.estado_nombre] || 'bg-muted text-muted-foreground'}`}>
                          {STATUS_LABELS[pedido.estado_nombre] || pedido.estado_nombre}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(pedido.fecha_pedido).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pedido.detalles?.length || 0} producto{(pedido.detalles?.length || 0) !== 1 ? 's' : ''}
                        {pedido.detalles && pedido.detalles.length > 0 && (
                          <>: {pedido.detalles.map((d) => d.nombre_snapshot).join(', ').slice(0, 80)}...</>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-primary">${pedido.total.toFixed(2)}</p>
                      <svg className="w-5 h-5 text-muted-foreground mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
                    p === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
