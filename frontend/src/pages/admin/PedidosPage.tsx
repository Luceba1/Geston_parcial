import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Badge, Button, Card, PageContainer, Pagination, TableSkeleton, ConfirmDialog } from '../../shared/ui'
import { useConfirmDialog } from '../../shared/hooks/useConfirmDialog'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { handleError } from '../../shared/utils/logger'
import { helpContent } from './helpContent'

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
  usuario_nombre?: string
  usuario_email?: string
}

interface PedidoListResponse {
  items: Pedido[]
  total: number
}

const STATUS_COLORS: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  pendiente: 'warning',
  confirmado: 'info',
  en_preparacion: 'info',
  listo_para_entrega: 'warning',
  en_camino: 'warning',
  entregado: 'success',
  cancelado: 'danger',
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

// Allowed transitions: from -> to
const ALLOWED_TRANSITIONS: Record<string, { to: string; label: string; roles: string[] }[]> = {
  pendiente: [
    { to: 'confirmado', label: 'Confirmar', roles: ['admin', 'cocinero'] },
    { to: 'cancelado', label: 'Cancelar', roles: ['admin'] },
  ],
  confirmado: [
    { to: 'en_preparacion', label: 'En Preparación', roles: ['admin', 'cocinero'] },
    { to: 'cancelado', label: 'Cancelar', roles: ['admin'] },
  ],
  en_preparacion: [
    { to: 'en_camino', label: 'Listo / En Camino', roles: ['admin', 'cocinero'] },
    { to: 'cancelado', label: 'Cancelar', roles: ['admin'] },
  ],
  en_camino: [
    { to: 'entregado', label: 'Entregar', roles: ['admin', 'repartidor'] },
  ],
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

export default function PedidosPage() {
  const [items, setItems] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const addToast = useUIStore((s) => s.addToast)
  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const cancelDialog = useConfirmDialog<Pedido>()

  const userRoles = useAuthStore((s) => s.user?.roles ?? [])

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get<PedidoListResponse>('/pedidos/admin', { params: { page, limit } })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('Error al cargar pedidos', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleTransition = useCallback(
    async (pedidoId: number, to: string) => {
      try {
        await api.put(`/pedidos/${pedidoId}/estado`, { estado_nombre: to })
        addToast(`Pedido #${pedidoId} → ${STATUS_LABELS[to] ?? to}`, 'success')
        fetchItems()
      } catch (error) {
        const message = handleError(error, 'PedidosPage.handleTransition')
        addToast(`Error: ${message}`, 'error')
      }
    },
    [fetchItems, addToast]
  )

  const handleCancel = useCallback(async () => {
    const item = cancelDialog.item
    if (!item) return

    try {
      await api.put(`/pedidos/${item.id}/estado`, { estado_nombre: 'cancelado' })
      addToast(`Pedido #${item.id} cancelado`, 'success')
      fetchItems()
      cancelDialog.close()
    } catch (error) {
      const message = handleError(error, 'PedidosPage.handleCancel')
      addToast(`Error: ${message}`, 'error')
    }
  }, [cancelDialog, fetchItems, addToast])

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime()),
    [items]
  )

  if (loading) {
    return (
      <PageContainer title="Panel de Pedidos" description="Gestión de pedidos del sistema" helpContent={helpContent.pedidos}>
        <Card className="p-6">
          <TableSkeleton rows={5} columns={6} />
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Panel de Pedidos"
      description="Gestión de pedidos del sistema"
      helpContent={helpContent.pedidos}
    >
      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={cancelDialog.close}
        onConfirm={handleCancel}
        title="Cancelar Pedido"
        message={`¿Estás seguro de cancelar el pedido #${cancelDialog.item?.id}?`}
        confirmLabel="Cancelar Pedido"
      />

      {/* Table */}
      {items.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No hay pedidos todavía</p>
            <p className="text-sm">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedItems.map((item) => {
                  const transitions = ALLOWED_TRANSITIONS[item.estado_nombre] ?? []
                  const availableTransitions = transitions.filter((t) =>
                    t.roles.some((r) => userRoles.includes(r))
                  )

                  return (
                    <tr key={item.id} className="hover:bg-accent transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">#{item.id}</td>
                      <td className="px-4 py-3">
                        <span className="text-foreground">{item.usuario_nombre ?? `Usuario #${item.usuario_id}`}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_COLORS[item.estado_nombre] ?? 'info'}>
                          {STATUS_LABELS[item.estado_nombre] ?? item.estado_nombre}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(item.fecha_pedido).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {availableTransitions.map((t) =>
                            t.to === 'cancelado' ? (
                              <Button
                                key={t.to}
                                variant="outline"
                                size="sm"
                                onClick={() => cancelDialog.open(item)}
                                aria-label={`Cancelar pedido #${item.id}`}
                              >
                                {t.label}
                              </Button>
                            ) : (
                              <Button
                                key={t.to}
                                variant="outline"
                                size="sm"
                                onClick={() => handleTransition(item.id, t.to)}
                                aria-label={`${t.label} pedido #${item.id}`}
                              >
                                {t.label}
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
          />
        </Card>
      )}
    </PageContainer>
  )
}
