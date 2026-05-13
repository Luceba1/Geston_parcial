import { useState } from 'react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores'
import { Button } from '../shared/ui/Button'
import { Input } from '../shared/ui/Input'
import { Card } from '../shared/ui/Card'
import { useUIStore } from '../stores/uiStore'

export default function PerfilPage() {
  const { user, setUser } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return <div className="p-8 text-center text-gray-500">Debés iniciar sesión para ver tu perfil</div>
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {}
      if (nombre !== user.nombre) payload.nombre = nombre
      if (telefono !== (user.telefono || '')) payload.telefono = telefono || null

      if (Object.keys(payload).length === 0) {
        setEditing(false)
        return
      }

      const res = await api.put('/auth/me', payload)
      setUser(res.data)
      addToast('Perfil actualizado', 'success')
      setEditing(false)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      addToast(detail || 'Error al actualizar perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Avatar / Info header */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">
                {user.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.nombre}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex gap-2 mt-2">
                {user.roles?.map((rol) => (
                  <span key={rol} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {rol}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Editable fields */}
          {editing ? (
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
              <Input
                label="Email"
                value={user.email}
                disabled
                className="bg-gray-50"
              />
              <Input
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +54 11 1234-5678"
              />
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-gray-800 mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</label>
                  <p className="text-gray-800 mt-1">{user.telefono || '—'}</p>
                </div>
              </div>
              <Button onClick={() => setEditing(true)}>Editar Perfil</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
