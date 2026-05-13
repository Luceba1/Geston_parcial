import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../shared/ui/Button'
import { Input } from '../../shared/ui/Input'
import { Card } from '../../shared/ui/Card'
import { useUIStore } from '../../stores/uiStore'

interface Ingrediente {
  id: number
  nombre: string
  unidad_medida: string
  disponible: boolean
  alergenos?: string | null
  creado_en?: string
  actualizado_en?: string
}

interface IngredienteForm {
  nombre: string
  unidad_medida: string
  alergenos: string
}

const emptyForm: IngredienteForm = {
  nombre: '',
  unidad_medida: 'unidad',
  alergenos: '',
}

export default function IngredientesPage() {
  const [items, setItems] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<IngredienteForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const limit = 50

  const fetchItems = useCallback(async () => {
    try {
      const res = await api.get('/ingredientes/', { params: { page, limit, solo_disponibles: false } })
      setItems(res.data.items)
      setTotal(res.data.total)
    } catch {
      addToast('Error al cargar ingredientes', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, addToast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item: Ingrediente) => {
    setEditingId(item.id)
    setForm({
      nombre: item.nombre,
      unidad_medida: item.unidad_medida,
      alergenos: item.alergenos || '',
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = { ...form }
      if (!payload.alergenos) delete payload.alergenos

      if (editingId) {
        await api.put(`/ingredientes/${editingId}`, payload)
        addToast('Ingrediente actualizado', 'success')
      } else {
        await api.post('/ingredientes/', payload)
        addToast('Ingrediente creado', 'success')
      }
      setShowForm(false)
      fetchItems()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al guardar ingrediente', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este ingrediente?')) return
    try {
      await api.delete(`/ingredientes/${id}`)
      addToast('Ingrediente eliminado', 'success')
      fetchItems()
    } catch {
      addToast('Error al eliminar ingrediente', 'error')
    }
  }

  const toggleDisponible = async (item: Ingrediente) => {
    try {
      await api.put(`/ingredientes/${item.id}`, { disponible: !item.disponible })
      addToast(`Ingrediente ${item.disponible ? 'desactivado' : 'activado'}`, 'success')
      fetchItems()
    } catch {
      addToast('Error al actualizar ingrediente', 'error')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando ingredientes...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ingredientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de ingredientes y alérgenos ({total} registros)</p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Ingrediente</Button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nuevo'} Ingrediente</h2>
            <div className="space-y-4">
              <Input
                label="Nombre *"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Unidad de medida *</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.unidad_medida}
                  onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                >
                  <option value="unidad">Unidad</option>
                  <option value="gramo">Gramo (g)</option>
                  <option value="kilogramo">Kilogramo (kg)</option>
                  <option value="mililitro">Mililitro (ml)</option>
                  <option value="litro">Litro (L)</option>
                  <option value="cucharada">Cucharada</option>
                  <option value="cucharadita">Cucharadita</option>
                  <option value="taza">Taza</option>
                  <option value="porcion">Porción</option>
                </select>
              </div>
              <Input
                label="Alérgenos (separados por coma)"
                value={form.alergenos}
                onChange={(e) => setForm({ ...form, alergenos: e.target.value })}
                placeholder="ej: harina, leche, huevo"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.nombre}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay ingredientes todavía</p>
          <p className="text-sm">Creá el primer ingrediente para comenzar</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Alérgenos</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Disponible</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{item.unidad_medida}</td>
                    <td className="px-4 py-3">
                      {item.alergenos ? (
                        <div className="flex gap-1 flex-wrap">
                          {item.alergenos.split(',').map((a, i) => (
                            <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              {a.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleDisponible(item)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                          item.disponible
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {item.disponible ? 'Disponible' : 'No disponible'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
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
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-gray-500 self-center">Página {page}</span>
              <Button variant="outline" size="sm" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
