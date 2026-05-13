import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../shared/ui/Button'
import { Input } from '../../shared/ui/Input'
import { Card } from '../../shared/ui/Card'
import { useUIStore } from '../../stores/uiStore'

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

interface Producto {
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

interface ProductoForm {
  nombre: string
  descripcion: string
  precio: string
  imagen_url: string
  stock: string
  tiempo_preparacion_minutos: string
}

const emptyForm: ProductoForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  imagen_url: '',
  stock: '0',
  tiempo_preparacion_minutos: '15',
}

export default function ProductosPage() {
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductoForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const limit = 20

  // Category/Ingredient assignment state
  const [showCategories, setShowCategories] = useState<number | null>(null)
  const [showIngredients, setShowIngredients] = useState<number | null>(null)
  const [showStock, setShowStock] = useState<number | null>(null)
  const [allCategories, setAllCategories] = useState<CategoriaInfo[]>([])
  const [allIngredients, setAllIngredients] = useState<{ id: number; nombre: string }[]>([])
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([])
  const [selectedIngs, setSelectedIngs] = useState<{ ingrediente_id: number; cantidad: number }[]>([])
  const [stockOp, setStockOp] = useState<'set' | 'incrementar' | 'decrementar'>('set')
  const [stockQty, setStockQty] = useState('0')

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/productos/', { params: { page, limit } })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('Error al cargar productos', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  const fetchAuxData = useCallback(async () => {
    try {
      const [catRes, ingRes] = await Promise.all([
        api.get('/categorias/'),
        api.get('/ingredientes/', { params: { solo_disponibles: false, limit: 500 } }),
      ])
      const flattenCats = (cats: any[]): CategoriaInfo[] => {
        const result: CategoriaInfo[] = []
        for (const c of cats) {
          result.push({ id: c.id, nombre: c.nombre })
          if (c.subcategorias) result.push(...flattenCats(c.subcategorias))
        }
        return result
      }
      setAllCategories(flattenCats(catRes.data))
      setAllIngredients(ingRes.data.items || [])
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchAuxData()
  }, [fetchItems, fetchAuxData])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item: Producto) => {
    setEditingId(item.id)
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: String(item.precio),
      imagen_url: item.imagen_url || '',
      stock: String(item.stock),
      tiempo_preparacion_minutos: String(item.tiempo_preparacion_minutos),
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {
        nombre: form.nombre,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock) || 0,
        tiempo_preparacion_minutos: parseInt(form.tiempo_preparacion_minutos) || 15,
      }
      if (form.descripcion) payload.descripcion = form.descripcion
      if (form.imagen_url) payload.imagen_url = form.imagen_url

      if (editingId) {
        await api.put(`/productos/${editingId}`, payload)
        addToast('Producto actualizado', 'success')
      } else {
        await api.post('/productos/', payload)
        addToast('Producto creado', 'success')
      }
      setShowForm(false)
      fetchItems()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al guardar producto', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await api.delete(`/productos/${id}`)
      addToast('Producto eliminado', 'success')
      fetchItems()
    } catch {
      addToast('Error al eliminar producto', 'error')
    }
  }

  // Category assignment
  const openCategories = (producto: Producto) => {
    setShowCategories(producto.id)
    setSelectedCatIds(producto.categorias.map((c) => c.id))
  }

  const saveCategories = async () => {
    if (!showCategories) return
    try {
      await api.put(`/productos/${showCategories}/categorias`, { categoria_ids: selectedCatIds })
      addToast('Categorías asignadas', 'success')
      setShowCategories(null)
      fetchItems()
    } catch {
      addToast('Error al asignar categorías', 'error')
    }
  }

  // Ingredient assignment
  const openIngredients = (producto: Producto) => {
    setShowIngredients(producto.id)
    setSelectedIngs(producto.ingredientes.map((i) => ({ ingrediente_id: i.id, cantidad: i.cantidad })))
  }

  const saveIngredients = async () => {
    if (!showIngredients) return
    try {
      await api.put(`/productos/${showIngredients}/ingredientes`, {
        ingredientes: selectedIngs.filter((i) => i.cantidad > 0),
      })
      addToast('Ingredientes asignados', 'success')
      setShowIngredients(null)
      fetchItems()
    } catch {
      addToast('Error al asignar ingredientes', 'error')
    }
  }

  // Stock update
  const openStock = (producto: Producto) => {
    setShowStock(producto.id)
    setStockQty(String(producto.stock))
    setStockOp('set')
  }

  const saveStock = async () => {
    if (!showStock) return
    try {
      await api.patch(`/productos/${showStock}/stock`, {
        cantidad: parseInt(stockQty) || 0,
        operacion: stockOp,
      })
      addToast('Stock actualizado', 'success')
      setShowStock(null)
      fetchItems()
    } catch {
      addToast('Error al actualizar stock', 'error')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando productos...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de productos del menú ({total} registros)</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Producto</Button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nuevo'} Producto</h2>
            <div className="space-y-4">
              <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <Input label="Precio *" type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
              <Input label="URL de imagen" value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Stock inicial" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                <Input label="Tiempo prep. (min)" type="number" min="1" value={form.tiempo_preparacion_minutos} onChange={(e) => setForm({ ...form, tiempo_preparacion_minutos: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.nombre || !form.precio}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Category Assignment Modal */}
      {showCategories && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Asignar Categorías</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCatIds.includes(cat.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCatIds([...selectedCatIds, cat.id])
                      else setSelectedCatIds(selectedCatIds.filter((id) => id !== cat.id))
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{cat.nombre}</span>
                </label>
              ))}
              {allCategories.length === 0 && <p className="text-sm text-gray-400">No hay categorías disponibles</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCategories(null)}>Cancelar</Button>
              <Button onClick={saveCategories}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Ingredient Assignment Modal */}
      {showIngredients && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Asignar Ingredientes</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {allIngredients.map((ing) => {
                const existing = selectedIngs.find((i) => i.ingrediente_id === ing.id)
                return (
                  <div key={ing.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={!!existing}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIngs([...selectedIngs, { ingrediente_id: ing.id, cantidad: 1 }])
                        else setSelectedIngs(selectedIngs.filter((i) => i.ingrediente_id !== ing.id))
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">{ing.nombre}</span>
                    {existing && (
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={existing.cantidad}
                        onChange={(e) => setSelectedIngs(selectedIngs.map((i) => i.ingrediente_id === ing.id ? { ...i, cantidad: parseFloat(e.target.value) || 0 } : i))}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                )
              })}
              {allIngredients.length === 0 && <p className="text-sm text-gray-400">No hay ingredientes disponibles</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowIngredients(null)}>Cancelar</Button>
              <Button onClick={saveIngredients}>Guardar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Actualizar Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Operación</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={stockOp}
                  onChange={(e) => setStockOp(e.target.value as any)}
                >
                  <option value="set">Seteado absoluto</option>
                  <option value="incrementar">Incrementar</option>
                  <option value="decrementar">Decrementar</option>
                </select>
              </div>
              <Input
                label="Cantidad"
                type="number"
                min="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowStock(null)}>Cancelar</Button>
              <Button onClick={saveStock}>Actualizar</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay productos todavía</p>
          <p className="text-sm">Creá el primer producto para comenzar</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Categorías</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Ingredientes</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">{item.nombre}</p>
                        {item.descripcion && <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.descripcion}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${item.precio.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${item.stock <= 0 ? 'text-red-600' : item.stock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => openCategories(item)}>
                        {item.categorias.length > 0 ? `${item.categorias.length} cats` : 'Asignar'}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => openIngredients(item)}>
                        {item.ingredientes.length > 0 ? `${item.ingredientes.length} ings` : 'Asignar'}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openStock(item)}>Stock</Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>Eliminar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="text-sm text-gray-500 self-center">Página {page} de {Math.ceil(total / limit)}</span>
              <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
