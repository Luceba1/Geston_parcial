import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Card } from '../shared/ui/Card'
import { useUIStore } from '../stores/uiStore'

interface Direccion {
  id: number
  usuario_id: number
  nombre: string
  calle: string
  numero: string
  ciudad: string
  provincia?: string | null
  codigo_postal: string
  referencias?: string | null
  es_default: boolean
}

interface DireccionForm {
  nombre: string
  calle: string
  numero: string
  ciudad: string
  provincia: string
  codigo_postal: string
  referencias: string
  es_default: boolean
}

const emptyForm: DireccionForm = {
  nombre: '',
  calle: '',
  numero: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  referencias: '',
  es_default: false,
}

export default function DireccionesPage() {
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<DireccionForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const addToast = useUIStore((s) => s.addToast)

  const fetchDirecciones = useCallback(async () => {
    try {
      const res = await api.get('/direcciones/')
      setDirecciones(res.data)
    } catch {
      addToast('Error al cargar direcciones', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchDirecciones()
  }, [fetchDirecciones])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (dir: Direccion) => {
    setEditingId(dir.id)
    setForm({
      nombre: dir.nombre,
      calle: dir.calle,
      numero: dir.numero,
      ciudad: dir.ciudad,
      provincia: dir.provincia || '',
      codigo_postal: dir.codigo_postal,
      referencias: dir.referencias || '',
      es_default: dir.es_default,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = { ...form }
      if (!payload.provincia) delete payload.provincia
      if (!payload.referencias) delete payload.referencias

      if (editingId) {
        await api.put(`/direcciones/${editingId}`, payload)
        addToast('Dirección actualizada', 'success')
      } else {
        await api.post('/direcciones/', payload)
        addToast('Dirección creada', 'success')
      }
      setShowForm(false)
      fetchDirecciones()
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al guardar dirección', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta dirección?')) return
    try {
      await api.delete(`/direcciones/${id}`)
      addToast('Dirección eliminada', 'success')
      fetchDirecciones()
    } catch {
      addToast('Error al eliminar dirección', 'error')
    }
  }

  const setDefault = async (id: number) => {
    try {
      await api.put(`/direcciones/${id}/default`)
      addToast('Dirección predeterminada actualizada', 'success')
      fetchDirecciones()
    } catch {
      addToast('Error al actualizar dirección', 'error')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando direcciones...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Direcciones</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná tus direcciones de entrega</p>
        </div>
        <Button onClick={openCreate}>+ Nueva Dirección</Button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar' : 'Nueva'} Dirección</h2>
            <div className="space-y-4">
              <Input label="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Casa, Trabajo" required />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input label="Calle *" value={form.calle} onChange={(e) => setForm({ ...form, calle: e.target.value })} required />
                </div>
                <Input label="Número *" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ciudad *" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} required />
                <Input label="Provincia" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
              </div>
              <Input label="Código Postal *" value={form.codigo_postal} onChange={(e) => setForm({ ...form, codigo_postal: e.target.value })} required />
              <Input label="Referencias" value={form.referencias} onChange={(e) => setForm({ ...form, referencias: e.target.value })} placeholder="Ej: Depto 3, entre calle X y Y" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.es_default}
                  onChange={(e) => setForm({ ...form, es_default: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Establecer como dirección predeterminada
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.nombre || !form.calle || !form.numero || !form.ciudad || !form.codigo_postal}>
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* List */}
      {direcciones.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No tenés direcciones guardadas</p>
          <p className="text-sm">Agregá una dirección para recibir pedidos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {direcciones.map((dir) => (
            <Card key={dir.id} className={`p-5 ${dir.es_default ? 'ring-2 ring-green-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{dir.nombre}</h3>
                    {dir.es_default && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {dir.calle} {dir.numero}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {dir.ciudad}{dir.provincia ? `, ${dir.provincia}` : ''} - CP: {dir.codigo_postal}
                  </p>
                  {dir.referencias && (
                    <p className="text-gray-400 text-xs mt-1">{dir.referencias}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  {!dir.es_default && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(dir.id)}>
                      Default
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dir)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(dir.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
