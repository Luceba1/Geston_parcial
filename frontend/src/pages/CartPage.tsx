import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores'
import { api } from '../lib/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { useUIStore } from '../stores/uiStore'

interface Direccion {
  id: number
  nombre: string
  calle: string
  numero: string
  ciudad: string
  provincia?: string | null
  codigo_postal: string
  referencias?: string | null
  es_default: boolean
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)

  const [showCheckout, setShowCheckout] = useState(false)
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [selectedDirId, setSelectedDirId] = useState<number | null>(null)
  const [loadingDirs, setLoadingDirs] = useState(false)
  const [creating, setCreating] = useState(false)

  const openCheckout = useCallback(async () => {
    setShowCheckout(true)
    setLoadingDirs(true)
    try {
      const res = await api.get('/direcciones/')
      const dirs: Direccion[] = res.data
      setDirecciones(dirs)
      // Preseleccionar default
      const defaultDir = dirs.find((d) => d.es_default)
      if (defaultDir) setSelectedDirId(defaultDir.id)
      else if (dirs.length > 0) setSelectedDirId(dirs[0].id)
    } catch {
      addToast('Error al cargar direcciones', 'error')
    } finally {
      setLoadingDirs(false)
    }
  }, [addToast])

  const handleCreateOrder = async () => {
    if (!selectedDirId) {
      addToast('Seleccioná una dirección de entrega', 'warning')
      return
    }
    setCreating(true)
    try {
      const payload = {
        direccion_entrega_id: selectedDirId,
        items: items.map((item) => ({
          producto_id: item.productoId,
          nombre_snapshot: item.nombre,
          precio_snapshot: item.precio,
          cantidad: item.cantidad,
          excluded_ingredient_ids: (item.excludedIngredientIds || []).join(','),
          personalizacion_snapshot: item.personalizacion || null,
        })),
      }
      const res = await api.post('/pedidos', payload)
      clearCart()
      addToast('Pedido creado con éxito!', 'success')
      setShowCheckout(false)
      navigate(`/orders/${res.data.id}`)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al crear pedido', 'error')
    } finally {
      setCreating(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-gray-300 mb-6">
          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-6">Agregá productos desde el catálogo para empezar</p>
        <Link to="/catalogo">
          <Button>Ver Catálogo</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Carrito de Compras</h1>
          <p className="text-sm text-gray-500">{totalItems()} producto{totalItems() !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={() => { if (confirm('¿Vaciar carrito?')) clearCart() }}>
          Vaciar Carrito
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={`${item.productoId}-${(item.excludedIngredientIds || []).join(',')}`} className="p-4">
            <div className="flex gap-4">
              {/* Image placeholder */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/productos/${item.productoId}`} className="font-semibold text-gray-800 hover:text-green-600">
                      {item.nombre}
                    </Link>
                    {item.personalizacion && (
                      <p className="text-xs text-gray-500 mt-1">{item.personalizacion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.productoId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-medium">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">${(item.precio * item.cantidad).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">${item.precio.toFixed(2)} c/u</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Subtotal ({totalItems()} items)</span>
          <span className="font-semibold">${totalPrice().toFixed(2)}</span>
        </div>
        <hr className="my-3" />
        <div className="flex items-center justify-between text-lg">
          <span className="font-bold text-gray-800">Total</span>
          <span className="font-bold text-green-600">${totalPrice().toFixed(2)}</span>
        </div>
        <Button className="w-full mt-4" size="lg" onClick={openCheckout}>
          Iniciar Pedido
        </Button>
      </Card>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirmar Pedido</h2>

            {/* Resumen del carrito */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Productos</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.productoId} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.cantidad}x {item.nombre}
                    </span>
                    <span className="font-medium">${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-green-600">${totalPrice().toFixed(2)}</span>
              </div>
            </div>

            {/* Selección de dirección */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Dirección de Entrega</h3>
              {loadingDirs ? (
                <p className="text-sm text-gray-400">Cargando direcciones...</p>
              ) : direcciones.length === 0 ? (
                <div className="text-sm text-gray-500">
                  <p className="mb-2">No tenés direcciones guardadas.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCheckout(false)
                      navigate('/direcciones')
                    }}
                  >
                    + Agregar Dirección
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {direcciones.map((dir) => (
                    <label
                      key={dir.id}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedDirId === dir.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        checked={selectedDirId === dir.id}
                        onChange={() => setSelectedDirId(dir.id)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{dir.nombre}</span>
                          {dir.es_default && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {dir.calle} {dir.numero}, {dir.ciudad}
                          {dir.provincia ? `, ${dir.provincia}` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCheckout(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={creating || !selectedDirId || direcciones.length === 0}
              >
                {creating ? 'Creando Pedido...' : 'Confirmar Pedido'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
