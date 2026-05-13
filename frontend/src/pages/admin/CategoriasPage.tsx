import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import { Button } from '../../shared/ui/Button'
import { Input } from '../../shared/ui/Input'
import { Card } from '../../shared/ui/Card'
import { useUIStore } from '../../stores/uiStore'

interface Categoria {
  id: number
  nombre: string
  descripcion?: string | null
  slug: string
  imagen_url?: string | null
  activo: boolean
  padre_id?: number | null
  subcategorias: Categoria[]
}

interface CategoriaForm {
  nombre: string
  descripcion: string
  slug: string
  imagen_url: string
  padre_id: number | null
}

const emptyForm: CategoriaForm = {
  nombre: '',
  descripcion: '',
  slug: '',
  imagen_url: '',
  padre_id: null,
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoriaForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await api.get('/categorias/')
      setCategorias(res.data)
    } catch {
      addToast('Error al cargar categorías', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (cat: Categoria) => {
    setEditingId(cat.id)
    setForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion || '',
      slug: cat.slug,
      imagen_url: cat.imagen_url || '',
      padre_id: cat.padre_id ?? null,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.slug) payload.slug = payload.nombre.toLowerCase().replace(/\s+/g, '-')
      if (!payload.imagen_url) delete (payload as any).imagen_url
      if (!payload.descripcion) delete (payload as any).descripcion
      if (payload.padre_id === null) delete (payload as any).padre_id

      if (editingId) {
        await api.put(`/categorias/${editingId}`, payload)
        addToast('Categoría actualizada', 'success')
      } else {
        await api.post('/categorias/', payload)
        addToast('Categoría creada', 'success')
      }
      setShowForm(false)
      fetchCategorias()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al guardar categoría', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await api.delete(`/categorias/${id}`)
      addToast('Categoría eliminada', 'success')
      fetchCategorias()
    } catch {
      addToast('Error al eliminar categoría', 'error')
    }
  }

  function renderTree(nodes: Categoria[], level = 0) {
    return (
      <ul className="space-y-1" style={{ paddingLeft: level > 0 ? 24 : 0 }}>
        {nodes.map((cat) => (
          <li key={cat.id}>
            <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg group">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{level > 0 ? '└─' : '📁'}</span>
                <span className="font-medium text-gray-800">{cat.nombre}</span>
                {!cat.activo && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">inactivo</span>
                )}
                {cat.slug && (
                  <span className="text-xs text-gray-400 hidden sm:inline">/{cat.slug}</span>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>Eliminar</Button>
              </div>
            </div>
            {cat.subcategorias && cat.subcategorias.length > 0 && renderTree(cat.subcategorias, level + 1)}
          </li>
        ))}
      </ul>
    )
  }

  function flattenForSelect(nodes: Categoria[], level = 0): { id: number; nombre: string; level: number }[] {
    const result: { id: number; nombre: string; level: number }[] = []
    for (const cat of nodes) {
      result.push({ id: cat.id, nombre: cat.nombre, level })
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        result.push(...flattenForSelect(cat.subcategorias, level + 1))
      }
    }
    return result
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando categorías...</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión jerárquica de categorías del menú</p>
        </div>
        <Button onClick={openCreate}>+ Nueva Categoría</Button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nueva'} Categoría</h2>
            <div className="space-y-4">
              <Input
                label="Nombre *"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <Input
                label="Slug (dejar vacío para auto-generar)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <Input
                label="URL de imagen"
                value={form.imagen_url}
                onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Categoría padre</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.padre_id ?? ''}
                  onChange={(e) => setForm({ ...form, padre_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">— Ninguna (raíz) —</option>
                  {flattenForSelect(categorias)
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {'  '.repeat(c.level)}{c.level > 0 ? '└─ ' : ''}{c.nombre}
                      </option>
                    ))}
                </select>
              </div>
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

      {/* Tree */}
      {categorias.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay categorías todavía</p>
          <p className="text-sm">Creá la primera categoría para comenzar</p>
        </div>
      ) : (
        <Card className="p-4">{renderTree(categorias)}</Card>
      )}
    </div>
  )
}
