import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { Input } from '../shared/ui/Input'
import { Button } from '../shared/ui/Button'
import { ProductCard, ProductCardItem } from '../widgets/ProductCard/ProductCard'
import { useUIStore } from '../stores/uiStore'

interface CategoriaOption {
  id: number
  nombre: string
  subcategorias: CategoriaOption[]
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<ProductCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const addToast = useUIStore((s) => s.addToast)

  // Filters
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [excluirAlergenos, setExcluirAlergenos] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit }
      if (busqueda) params.busqueda = busqueda
      if (categoriaId) params.categoria_id = categoriaId
      if (excluirAlergenos) params.excluir_alergenos = excluirAlergenos

      const res = await api.get('/productos/public', { params })
      setProducts(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch {
      addToast('Error al cargar productos', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, busqueda, categoriaId, excluirAlergenos, addToast])

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await api.get('/categorias/')
      setCategorias(res.data)
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  const totalPages = Math.ceil(total / limit)

  function flattenCats(nodes: CategoriaOption[], level = 0): { id: number; nombre: string; level: number }[] {
    const result: { id: number; nombre: string; level: number }[] = []
    for (const cat of nodes) {
      result.push({ id: cat.id, nombre: cat.nombre, level })
      if (cat.subcategorias) result.push(...flattenCats(cat.subcategorias, level + 1))
    }
    return result
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Productos</h1>
        <p className="text-gray-500 mt-1">
          {total > 0 ? `${total} producto${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}` : 'Explorá nuestros productos'}
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={categoriaId ?? ''}
            onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas las categorías</option>
            {flattenCats(categorias).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'  '.repeat(cat.level)}{cat.level > 0 ? '└─ ' : ''}{cat.nombre}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Excluir alérgenos (IDs, ej: 1,2,3)"
          value={excluirAlergenos}
          onChange={(e) => setExcluirAlergenos(e.target.value)}
        />
        <Button type="submit">Filtrar</Button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron productos</p>
          <p className="text-sm">Probá con otros filtros o términos de búsqueda</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-green-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
