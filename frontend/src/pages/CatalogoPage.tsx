import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { Input } from '../shared/ui/Input'
import { Button, Pagination } from '../shared/ui'
import { ProductCard, ProductCardItem } from '../widgets/ProductCard/ProductCard'
import { useUIStore } from '../stores/uiStore'

interface CategoriaOption {
  id: number
  nombre: string
  subcategorias: CategoriaOption[]
}

interface AlergenoOption {
  id: number
  nombre: string
  icono?: string | null
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<ProductCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [categorias, setCategorias] = useState<CategoriaOption[]>([])
  const [alergenos, setAlergenos] = useState<AlergenoOption[]>([])
  const addToast = useUIStore((s) => s.addToast)

  // Filters
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [alergenosSeleccionados, setAlergenosSeleccionados] = useState<Set<number>>(new Set())

  const [alergenoDropdownOpen, setAlergenoDropdownOpen] = useState(false)
  const excluirAlergenos = Array.from(alergenosSeleccionados).join(',')

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

  const fetchAlergenos = useCallback(async () => {
    try {
      const res = await api.get('/alergenos')
      setAlergenos(res.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchCategorias()
    fetchAlergenos()
  }, [fetchCategorias, fetchAlergenos])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const toggleAlergeno = (id: number) => {
    setPage(1)
    setAlergenosSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
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
        <h1 className="text-3xl font-bold text-foreground">Catálogo de Productos</h1>
        <p className="text-muted-foreground mt-1">
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
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus-visible:ring-ring"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setPage(1)
              setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
            }}
          >
            <option value="">Todas las categorías</option>
            {flattenCats(categorias).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'  '.repeat(cat.level)}{cat.level > 0 ? '└─ ' : ''}{cat.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="relative">
            <div className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background cursor-pointer"
                 onClick={() => setAlergenoDropdownOpen(prev => !prev)}>
              <span className={alergenosSeleccionados.size === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {alergenosSeleccionados.size === 0
                  ? 'Excluir alérgenos...'
                  : `${alergenosSeleccionados.size} seleccionado${alergenosSeleccionados.size !== 1 ? 's' : ''}`}
              </span>
              <span className="float-right mt-0.5 text-muted-foreground">▾</span>
            </div>
            <div className={`${alergenoDropdownOpen ? '' : 'hidden'} absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
              {alergenos.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Cargando...</div>
              ) : (
                alergenos.map((alergeno) => (
                  <label
                    key={alergeno.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={alergenosSeleccionados.has(alergeno.id)}
                      onChange={() => toggleAlergeno(alergeno.id)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    {alergeno.nombre}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
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
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
