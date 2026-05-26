import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Modal } from '../../shared/ui/Modal'
import { Button } from '../../shared/ui/Button'
import { useUIStore } from '../../stores/uiStore'
import { handleError } from '../../shared/utils/logger'

interface ProductoItem {
  id: number
  nombre: string
  disponible: boolean
}

interface DisponibilidadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DisponibilidadModal({ isOpen, onClose }: DisponibilidadModalProps) {
  const [productos, setProductos] = useState<ProductoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const addToast = useUIStore((s) => s.addToast)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<ProductoItem[]>('/cocina/productos')
      setProductos(res.data)
    } catch (error) {
      addToast(`Error al cargar productos: ${handleError(error, 'DisponibilidadModal.fetch')}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    if (isOpen) fetchProductos()
  }, [isOpen, fetchProductos])

  const toggleProducto = useCallback(
    async (producto: ProductoItem) => {
      setTogglingId(producto.id)
      const nuevoEstado = !producto.disponible
      try {
        await api.patch(`/cocina/productos/${producto.id}/disponibilidad`, {
          disponible: nuevoEstado,
        })
        setProductos((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, disponible: nuevoEstado } : p))
        )
        const msg = nuevoEstado
          ? `✅ ${producto.nombre} ahora disponible`
          : `❌ ${producto.nombre} marcado como no disponible`
        addToast(msg, 'success')
      } catch (error) {
        addToast(
          `Error al cambiar disponibilidad: ${handleError(error, 'DisponibilidadModal.toggle')}`,
          'error'
        )
      } finally {
        setTogglingId(null)
      }
    },
    [addToast]
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📦 Disponibilidad de Productos" size="lg">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : productos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay productos activos</p>
      ) : (
        <div className="space-y-1">
          {productos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{p.nombre}</span>
              <Button
                size="sm"
                isLoading={togglingId === p.id}
                onClick={() => toggleProducto(p)}
                className={
                  p.disponible
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                    : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                }
              >
                {p.disponible ? '🟢 Disponible' : '🔴 No disponible'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Esto solo cambia la disponibilidad del producto en el catálogo. No modifica el stock
          (RN-CO08).
        </p>
      </div>
    </Modal>
  )
}
