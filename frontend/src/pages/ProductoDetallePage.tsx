import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../shared/ui/Button'
import { Card } from '../shared/ui/Card'
import { useUIStore } from '../stores/uiStore'
import { useCartStore } from '../stores'

interface CategoriaInfo {
  id: number
  nombre: string
}

interface IngredienteInfo {
  id: number
  nombre: string
  cantidad: number
  alergeno: boolean
}

interface ProductoDetalle {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  imagen_url?: string | null
  activo: boolean
  stock: number
  tiempo_preparacion_minutos: number
  categorias: CategoriaInfo[]
  ingredientes: IngredienteInfo[]
  creado_en?: string
  actualizado_en?: string
}

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [excludedIds, setExcludedIds] = useState<number[]>([])
  const addToast = useUIStore((s) => s.addToast)
  const addToCart = useCartStore((s) => s.addItem)

  useEffect(() => {
    if (!id) return
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/productos/public/${id}`)
        setProduct(res.data)
      } catch {
        addToast('Error al cargar el producto', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, addToast])

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando producto...</div>

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h1>
        <Link to="/catalogo">
          <Button>Volver al catálogo</Button>
        </Link>
      </div>
    )
  }

  const alergenos = product.ingredientes.filter((i) => i.alergeno)
  const outOfStock = product.stock <= 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/catalogo" className="hover:text-green-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = ''
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Categories */}
          {product.categorias.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {product.categorias.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalogo?categoria_id=${cat.id}`}
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 transition-colors"
                >
                  {cat.nombre}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.nombre}</h1>

          {product.descripcion && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.descripcion}</p>
          )}

          {/* Info badges */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ≈ {product.tiempo_preparacion_minutos} min
            </div>
            <div className={`flex items-center gap-1 text-sm ${outOfStock ? 'text-red-500' : 'text-green-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {outOfStock ? 'Sin stock' : `${product.stock} disponibles`}
            </div>
          </div>

          {/* Price */}
          <div className="text-4xl font-bold text-green-600 mb-6">
            ${product.precio.toFixed(2)}
          </div>

          {/* Quantity selector */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cantidad</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-10 text-center text-xl font-bold">{cantidad}</span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Ingredients with exclusion */}
          {product.ingredientes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Ingredientes {product.ingredientes.some(i => i.alergeno) && <span className="text-xs text-yellow-600 font-normal">(desmarcá para excluir)</span>}
              </h3>
              <div className="space-y-2">
                {product.ingredientes.map((ing) => {
                  const isExcluded = excludedIds.includes(ing.id)
                  return (
                    <label
                      key={ing.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isExcluded ? 'bg-red-50 line-through text-red-400' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => {
                          if (isExcluded) {
                            setExcludedIds(excludedIds.filter((eid) => eid !== ing.id))
                          } else {
                            setExcludedIds([...excludedIds, ing.id])
                          }
                        }}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm flex-1">
                        {ing.nombre}
                        {ing.cantidad > 0 && <span className="text-gray-400 ml-1">({ing.cantidad})</span>}
                      </span>
                      {ing.alergeno && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">⚠ alérgeno</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Allergens warning */}
          {alergenos.length > 0 && (
            <Card variant="outlined" className="p-4 mb-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">Información de alérgenos</h3>
              <p className="text-xs text-yellow-700">
                Este producto contiene: {alergenos.map((a) => a.nombre).join(', ')}.
                Puede contener trazas de otros alérgenos.
              </p>
            </Card>
          )}

          {/* CTA */}
          <div className="mt-auto flex gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => {
                const excludedIngredientIds = excludedIds.length > 0 ? excludedIds : undefined
                const persDescription = excludedIngredientIds
                  ? `Sin: ${product.ingredientes.filter(i => excludedIds.includes(i.id)).map(i => i.nombre).join(', ')}`
                  : undefined
                addToCart({
                  productoId: product.id,
                  nombre: product.nombre,
                  precio: product.precio,
                  cantidad,
                  imagen: product.imagen_url || undefined,
                  excludedIngredientIds,
                  personalizacion: persDescription,
                })
                addToast(`${product.nombre} agregado al carrito`, 'success')
              }}
            >
              {outOfStock ? 'Sin stock' : `Agregar al carrito — $${(product.precio * cantidad).toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
